/**
 * Battlefield layout — where each unit is *drawn*, as distinct from where the simulation puts it.
 *
 * The simulation is a single 1-D lane with no unit collision. Allies walking into the same fight
 * stop at the same x, and melee reach (25–30 world units) is narrower than a figure, so a raw
 * projection draws every fight as one overlapping clump. This module spreads that clump out:
 *
 *   - Rows: five rows of ground. An engaged unit moves onto its target's row, so a duel reads as two
 *     figures facing each other on one line; extra attackers fan onto the neighbouring rows.
 *   - Engagement gap: opponents are pushed apart until there is visible ground between them.
 *   - Ranks: allies stack *backwards*, away from the enemy, into a staggered formation.
 *   - Edge fit: a figure is never drawn past the canvas edge.
 *
 * Purely visual. Nothing here feeds back into the simulation: positions, ranges and timing are
 * unchanged, and every offset pushes a unit back toward its own side (except the edge fit).
 */

import { CANVAS_WIDTH, LANE_LENGTH, LANE_Y, PLAYER_BASE_X } from '../sim/constants';
import type { Deity, DeityIndex, Side, Tier, Unit, World } from '../sim/types';
import { getSettings } from '../ui/settings';
import type { AnimName, Figure } from './rig/figure';
import { figureFor } from './rig/figures';

// ---------------------------------------------------------------------------
// Screen geometry
// ---------------------------------------------------------------------------

/** Screen footprint per tier for placeholder blocks. Size is the primary signal for cost. */
export const TIER_SIZE: Readonly<Record<Tier, { w: number; h: number }>> = {
  chaff: { w: 13, h: 19 },
  demigod: { w: 17, h: 27 },
  god: { w: 21, h: 35 },
  titan: { w: 29, h: 47 },
};

/**
 * Space left outside the lane at each end. Long figures (the serpents) used to widen this until
 * they fit at the base, which cost a third of the screen; now they are fitted per unit instead
 * (see fitFigureX), so the lane keeps ~79% of the width.
 */
const BATTLEFIELD_PADDING = 128;

/** World-to-screen horizontal scale. Constant: it no longer depends on the unit-size setting. */
export function battlefieldScale(): number {
  return CANVAS_WIDTH / (CANVAS_WIDTH + BATTLEFIELD_PADDING * 2);
}

/** World-space x to screen-space x, before any layout offset. */
export function worldToScreen(x: number): number {
  const scale = battlefieldScale();
  return CANVAS_WIDTH * (1 - scale) / 2 + (x / LANE_LENGTH) * CANVAS_WIDTH * scale;
}

/** On-screen height of a titan's figure; every other tier is a fraction of this. */
const SPRITE_BASE = 98;

/**
 * Per-tier figure scale. The delivered art fills its frame regardless of tier, so the renderer
 * imposes the cost curve itself rather than trusting each image to agree on a ratio.
 */
const SPRITE_TIER_SCALE: Readonly<Record<Tier, number>> = {
  chaff: 0.62,
  demigod: 0.76,
  god: 0.88,
  titan: 1,
};

/** Widest rig overhang (the serpents), which the lane framing was once padded to fit. */
const FIGURE_OVERHANG = 185;

/**
 * Figures keep the on-screen size they had when the whole lane was padded around the serpents.
 * Widening the lane then spreads units apart instead of simply enlarging them along with it.
 */
function figureFrameScale(): number {
  const overhang = FIGURE_OVERHANG * SPRITE_BASE / 100 * getSettings().unitScale;
  const baseOffset = PLAYER_BASE_X / LANE_LENGTH * CANVAS_WIDTH;
  const padding = Math.max(BATTLEFIELD_PADDING, overhang - baseOffset + 20);
  return CANVAS_WIDTH / (CANVAS_WIDTH + padding * 2);
}

/** On-screen height of a figure of this tier, after the player's size setting. */
export function figureHeight(tier: Tier): number {
  return SPRITE_BASE * SPRITE_TIER_SCALE[tier] * getSettings().unitScale * figureFrameScale();
}

/** The figure drawn for this deity under the current settings, or undefined for a block. */
function currentFigure(deity: Deity): Figure | undefined {
  return figureFor(deity, getSettings().unitGraphics);
}

/** True when this deity is drawn as an animated figure rather than a placeholder block. */
export function drawsAsFigure(deity: Deity): boolean {
  return currentFigure(deity) !== undefined;
}

/** Screen height of a unit's body, by tier. Everything anchored above a unit clears this. */
export function unitBodyHeight(deity: Deity | undefined): number {
  const tier = deity?.tier ?? 'chaff';
  if (deity !== undefined && currentFigure(deity) !== undefined) return figureHeight(tier);
  return TIER_SIZE[tier].h;
}

/** Rig-unit half-width of the solid body, by body plan — what allies must not stand inside. */
const BODY_HALF: Readonly<Record<Figure['body'], number>> = {
  biped: 21,
  flyer: 28,
  beast: 46,
  serpent: 56,
};

/** Screen half-width of a unit's body, for spacing and the team ring. */
export function unitHalfWidth(deity: Deity | undefined): number {
  if (deity === undefined) return TIER_SIZE.chaff.w / 2;
  const figure = currentFigure(deity);
  if (figure === undefined) return TIER_SIZE[deity.tier].w / 2 + 2;
  return BODY_HALF[figure.body] * figureHeight(deity.tier) / 100;
}

// ---------------------------------------------------------------------------
// Edge fit
// ---------------------------------------------------------------------------

/** Horizontal reach of a figure in rig units, facing right: how far it draws behind and ahead. */
interface Extent {
  readonly back: number;
  readonly front: number;
}

const extents = new Map<string, Extent>();

/** Sprite frames are 512 px wide, mapped to 112 rig units; the image can reach either edge. */
const SPRITE_HALF = 56;
/** Slack for ambient flutter between the sampled clocks. */
const EXTENT_SLACK = 6;

/** Traces a figure's drawing calls without painting, recording how far left and right it reaches. */
function measure(figure: Figure): Extent {
  let left = 0;
  let right = 0;
  type M = [number, number, number, number, number, number];
  let m: M = [1, 0, 0, 1, 0, 0];
  const stack: M[] = [];
  const point = (x: number, y: number): void => {
    const px = m[0] * x + m[2] * y + m[4];
    left = Math.min(left, px);
    right = Math.max(right, px);
  };
  const ellipse = (x: number, y: number, rx: number, ry: number, rot = 0): void => {
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      point(x + rx * Math.cos(a) * Math.cos(rot) - ry * Math.sin(a) * Math.sin(rot),
        y + rx * Math.cos(a) * Math.sin(rot) + ry * Math.sin(a) * Math.cos(rot));
    }
  };
  const rect = (x: number, y: number, w: number, h: number): void => { point(x, y); point(x + w, y + h); };
  const gradient = { addColorStop(): void {} };
  const noop = (): void => {};
  const ctx = {
    save() { stack.push([...m]); },
    restore() { m = stack.pop() ?? [1, 0, 0, 1, 0, 0]; },
    translate(x: number, y: number) { m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
    scale(x: number, y: number) { m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; },
    rotate(a: number) {
      const [v0, v1, v2, v3] = m;
      const c = Math.cos(a), s = Math.sin(a);
      m[0] = v0 * c + v2 * s; m[1] = v1 * c + v3 * s;
      m[2] = v2 * c - v0 * s; m[3] = v3 * c - v1 * s;
    },
    moveTo: point, lineTo: point, rect, fillRect: rect, strokeRect: rect,
    quadraticCurveTo(cx: number, cy: number, x: number, y: number) { point(cx, cy); point(x, y); },
    bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number) { point(a, b); point(c, d); point(x, y); },
    arc(x: number, y: number, r: number) { ellipse(x, y, r, r); }, ellipse,
    drawImage(_image: unknown, x: number, y: number, w: number, h: number) { rect(x, y, w, h); },
    beginPath: noop, closePath: noop, fill: noop, stroke: noop, clip: noop, setLineDash: noop,
    fillText: noop, strokeText: noop, arcTo: noop,
    createLinearGradient: () => gradient, createRadialGradient: () => gradient,
  } as unknown as CanvasRenderingContext2D;

  const anims: readonly AnimName[] = ['idle', 'walk', 'attack', 'hit', 'death'];
  for (const anim of anims) {
    for (const t of [0, 0.14, 0.28, 0.4, 0.55, 0.7, 1]) {
      for (const time of [0, 1.23, 2.9]) {
        m = [1, 0, 0, 1, 0, 0];
        figure.draw(ctx, anim, t, time);
      }
    }
  }
  return { back: -left + EXTENT_SLACK, front: right + EXTENT_SLACK };
}

/** A deity's reach under the current graphics. Rig-measured, widened to a sprite frame if one may show. */
function extentFor(deity: Deity): Extent | undefined {
  const settings = getSettings();
  if (settings.unitGraphics === 'blocks') return undefined;
  const key = `${settings.unitGraphics}:${settings.egyptianRigVersion}:${deity.id}`;
  let extent = extents.get(key);
  if (extent === undefined) {
    const rig = figureFor(deity, 'rig');
    const measured = rig === undefined ? { back: SPRITE_HALF, front: SPRITE_HALF } : measure(rig);
    extent = settings.unitGraphics === 'sprites'
      ? { back: Math.max(measured.back, SPRITE_HALF), front: Math.max(measured.front, SPRITE_HALF) }
      : measured;
    extents.set(key, extent);
  }
  return extent;
}

/** Nudges a screen x inward just enough that this figure, facing its side's way, stays on screen. */
export function fitFigureX(deity: Deity | undefined, side: Side, sx: number): number {
  if (deity === undefined || currentFigure(deity) === undefined) return sx;
  const extent = extentFor(deity);
  if (extent === undefined) return sx;
  const scale = figureHeight(deity.tier) / 100;
  const leftReach = (side === 'player' ? extent.back : extent.front) * scale;
  const rightReach = (side === 'player' ? extent.front : extent.back) * scale;
  const min = 2 + leftReach;
  const max = CANVAS_WIDTH - 2 - rightReach;
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, sx));
}

// ---------------------------------------------------------------------------
// Rows, ranks and gaps
// ---------------------------------------------------------------------------

/** Rows of ground units stand on. Row 0 is the lane line the bases stand on. */
export const ROW_COUNT = 5;
/** Row spacing at the default unit size; larger figures get tighter rows so the front one fits. */
const ROW_STEP = 15;
const ROW_STEP_AT_SCALE = 1.45;

/** Screen px between rows under the current unit size. */
export function rowStep(): number {
  return ROW_STEP * Math.min(1, ROW_STEP_AT_SCALE / getSettings().unitScale);
}

/** Screen y of the lowest row's feet. */
export function maxFootY(): number {
  return LANE_Y + (ROW_COUNT - 1) * rowStep();
}

/** Furthest a unit is drawn behind its simulated position. */
const MAX_PUSH = 120;
/**
 * Opponents' centres stand at least this multiple of their combined half-widths apart: enough for a
 * strip of open ground between the bodies, where the strike effects land.
 */
const ENGAGE_GAP = 1.25;
/** Allies keep this fraction of their combined half-widths between them, by row distance. */
const RANK_GAP: readonly number[] = [0.95, 0.7, 0.35];

/**
 * The row for the k-th attacker of a target on `base`: the target's own row first, then alternating
 * below and above it. Rows past the edge are skipped rather than clamped, so attackers of a unit on
 * the front or back row still spread out instead of piling onto one row.
 */
function fanRow(base: number, k: number): number {
  const order: number[] = [base];
  for (let d = 1; order.length < ROW_COUNT; d++) {
    if (base + d < ROW_COUNT) order.push(base + d);
    if (base - d >= 0) order.push(base - d);
  }
  return order[k % ROW_COUNT] ?? base;
}
/** Same-side units within this many screen px count as crowding a row. */
const CROWD_RADIUS = 44;
/** How fast drawn positions chase their targets, per second. */
const X_RATE = 9;
const ROW_RATE = 7;

interface Slot {
  x: number;
  row: number;
  rowTarget: number;
}

const slots = new Map<number, Slot>();
/** Where recently removed units were last drawn, so a killing blow can still find its target. */
const departed = new Map<number, { x: number; footY: number; at: number }>();
let clock = 0;

const backDir = (side: Side): number => (side === 'player' ? -1 : 1);
/** Larger is further toward the enemy. */
const frontness = (side: Side, x: number): number => (side === 'player' ? x : -x);

/** Picks a spawn row: the least crowded among nearby allies, preferring one derived from the id. */
function spawnRow(unit: Unit, sx: number, live: readonly Unit[]): number {
  const counts = new Array<number>(ROW_COUNT).fill(0);
  for (const other of live) {
    const slot = slots.get(other.id);
    if (slot === undefined || other.side !== unit.side) continue;
    if (Math.abs(slot.x - sx) < CROWD_RADIUS * 2.5) counts[slot.rowTarget] = (counts[slot.rowTarget] ?? 0) + 1;
  }
  const preferred = (unit.id * 3) % ROW_COUNT;
  let best = preferred;
  for (let r = 0; r < ROW_COUNT; r++) {
    const c = counts[r] ?? 0;
    const b = counts[best] ?? 0;
    if (c < b || (c === b && Math.abs(r - preferred) < Math.abs(best - preferred))) best = r;
  }
  return best;
}

/** Eases `from` toward `to` at `rate` per second, frame-rate independent. */
function ease(from: number, to: number, rate: number, dt: number): number {
  return from + (to - from) * (1 - Math.exp(-rate * dt));
}

/**
 * Re-solves where every unit should be drawn and eases the drawn positions toward it. Call once
 * per frame before anything reads unitScreenX/unitFootY. `dt` is real frame time in seconds.
 */
export function updateLayout(world: World, deities: DeityIndex, dt: number): void {
  clock += dt;
  const live = world.units.filter((u) => !u.isBase && u.hp > 0);
  const byId = new Map(live.map((u) => [u.id, u]));
  const raw = new Map<number, number>();
  const half = new Map<number, number>();

  for (const unit of live) {
    const deity = deities.get(unit.deityId);
    raw.set(unit.id, worldToScreen(unit.x));
    half.set(unit.id, unitHalfWidth(deity));
  }
  for (const unit of live) {
    if (slots.has(unit.id)) continue;
    const sx = fitFigureX(deities.get(unit.deityId), unit.side, raw.get(unit.id) ?? 0);
    const row = spawnRow(unit, sx, live);
    slots.set(unit.id, { x: sx, row, rowTarget: row });
  }

  // Forget units that have left, keeping their last drawn spot for a moment.
  for (const [id, slot] of slots) {
    if (byId.has(id)) continue;
    departed.set(id, { x: slot.x, footY: LANE_Y + slot.row * rowStep(), at: clock });
    slots.delete(id);
  }
  for (const [id, gone] of departed) if (clock - gone.at > 3) departed.delete(id);

  const slotOf = (u: Unit): Slot => slots.get(u.id) as Slot;
  const targetOf = (u: Unit): Unit | undefined => (u.targetId === null ? undefined : byId.get(u.targetId));

  // --- rows -----------------------------------------------------------------
  const attackers = new Map<number, Unit[]>();
  for (const unit of live) {
    const target = targetOf(unit);
    if (target === undefined) continue;
    const list = attackers.get(target.id) ?? [];
    list.push(unit);
    attackers.set(target.id, list);
  }
  for (const [defenderId, list] of attackers) {
    const defender = byId.get(defenderId);
    if (defender === undefined) continue;
    const dx = raw.get(defender.id) ?? 0;
    // The defender's own opponent first (it shares the row), then nearest first.
    list.sort((a, b) => Number(defender.targetId === b.id) - Number(defender.targetId === a.id)
      || Math.abs((raw.get(a.id) ?? 0) - dx) - Math.abs((raw.get(b.id) ?? 0) - dx) || a.id - b.id);
  }

  for (const unit of live) {
    const slot = slotOf(unit);
    const target = targetOf(unit);
    if (target !== undefined) {
      // A duel's anchor (the lower id) keeps its row and its partner joins it.
      const mutual = target.targetId === unit.id;
      if (mutual && unit.id < target.id) continue;
      const k = (attackers.get(target.id) ?? []).indexOf(unit);
      slot.rowTarget = fanRow(slotOf(target).rowTarget, Math.max(0, k));
      continue;
    }
    // Walking or hitting a base: step aside if an ally ahead on this row is in the way.
    const sx = raw.get(unit.id) ?? 0;
    const counts = new Array<number>(ROW_COUNT).fill(0);
    let blocked = false;
    for (const other of live) {
      if (other === unit || other.side !== unit.side) continue;
      const os = slotOf(other);
      const ox = raw.get(other.id) ?? 0;
      if (Math.abs(ox - sx) > CROWD_RADIUS) continue;
      counts[os.rowTarget] = (counts[os.rowTarget] ?? 0) + 1;
      if (os.rowTarget === slot.rowTarget && frontness(unit.side, ox) > frontness(unit.side, sx)) blocked = true;
    }
    if (!blocked) continue;
    let best = slot.rowTarget;
    for (let r = 0; r < ROW_COUNT; r++) {
      const c = counts[r] ?? 0;
      const b = counts[best] ?? 0;
      if (c < b || (c === b && Math.abs(r - slot.rowTarget) < Math.abs(best - slot.rowTarget))) best = r;
    }
    if ((counts[best] ?? 0) < (counts[slot.rowTarget] ?? 0)) slot.rowTarget = best;
  }

  // --- x: engagement gaps, then ranks ----------------------------------------
  const push = new Map<number, number>();
  for (const unit of live) {
    const target = targetOf(unit);
    if (target === undefined) continue;
    const rows = Math.abs(slotOf(unit).rowTarget - slotOf(target).rowTarget);
    const need = ((half.get(unit.id) ?? 0) + (half.get(target.id) ?? 0)) * ENGAGE_GAP * (rows >= 2 ? 0.5 : 1);
    const deficit = need - Math.abs((raw.get(unit.id) ?? 0) - (raw.get(target.id) ?? 0));
    if (deficit <= 0) continue;
    push.set(unit.id, Math.max(push.get(unit.id) ?? 0, deficit / 2));
    push.set(target.id, Math.max(push.get(target.id) ?? 0, deficit / 2));
  }

  const desired = new Map<number, number>();
  for (const side of ['player', 'enemy'] as const) {
    const team = live.filter((u) => u.side === side)
      .sort((a, b) => frontness(side, raw.get(b.id) ?? 0) - frontness(side, raw.get(a.id) ?? 0) || a.id - b.id);
    const placed: Unit[] = [];
    for (const unit of team) {
      const base = (raw.get(unit.id) ?? 0) + backDir(side) * (push.get(unit.id) ?? 0);
      let front = frontness(side, base);
      for (const ahead of placed) {
        const rows = Math.abs(slotOf(ahead).rowTarget - slotOf(unit).rowTarget);
        const gap = RANK_GAP[rows];
        if (gap === undefined) continue;
        const spacing = ((half.get(ahead.id) ?? 0) + (half.get(unit.id) ?? 0)) * gap;
        front = Math.min(front, frontness(side, desired.get(ahead.id) ?? 0) - spacing);
      }
      // Never more than MAX_PUSH behind the simulated spot, and never ahead of it.
      const rawFront = frontness(side, raw.get(unit.id) ?? 0);
      front = Math.max(rawFront - MAX_PUSH, Math.min(rawFront, front));
      desired.set(unit.id, side === 'player' ? front : -front);
      placed.push(unit);
    }
  }

  for (const unit of live) {
    const slot = slotOf(unit);
    const want = fitFigureX(deities.get(unit.deityId), unit.side, desired.get(unit.id) ?? slot.x);
    slot.x = ease(slot.x, want, X_RATE, dt);
    slot.row = ease(slot.row, slot.rowTarget, ROW_RATE, dt);
  }
}

/** Screen x a unit is drawn at. Bases sit at their simulated spot. */
export function unitScreenX(unit: Unit): number {
  if (unit.isBase) return worldToScreen(unit.x);
  return slots.get(unit.id)?.x ?? worldToScreen(unit.x);
}

/** Screen y of a unit's feet, row included. Shared by every layer that anchors to a unit. */
export function unitFootY(unit: Unit): number {
  if (unit.isBase) return LANE_Y;
  const slot = slots.get(unit.id);
  return LANE_Y + (slot === undefined ? 0 : slot.row * rowStep());
}

/** Last drawn foot position of a live or just-removed unit, by id. */
export function screenPosById(id: number): { x: number; footY: number } | undefined {
  const slot = slots.get(id);
  if (slot !== undefined) return { x: slot.x, footY: LANE_Y + slot.row * rowStep() };
  return departed.get(id);
}

/** Test hook: forget all layout state. */
export function resetLayout(): void {
  slots.clear();
  departed.clear();
  clock = 0;
}

// ---------------------------------------------------------------------------
// Team identity
// ---------------------------------------------------------------------------

/**
 * Side colours. Blue against the existing blood red keeps the sides apart for the common forms of
 * colour blindness, and neither is gold, which stays reserved for relational effects.
 */
export const TEAM_COLOR: Readonly<Record<Side, string>> = {
  player: '#4C9BE8',
  enemy: '#D9502F',
};
