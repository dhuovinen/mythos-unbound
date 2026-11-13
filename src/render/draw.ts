/**
 * Battlefield renderer — WP-4.
 *
 * Placeholder geometry until production sprites land, but built in the chosen Style C-B palette
 * (bone / ink / blood) with heavy woodcut outlines, so it already reads like the intended game.
 *
 * One rule inherited from the art direction: **no gold anywhere in this file.** Oxidized gold is
 * reserved exclusively for relational VFX in render/effects.ts, so any gold on screen always means
 * the genealogy graph is firing. Keeping units tonally neutral is also what lets the modifier
 * colours pop as the only saturated thing in the frame.
 *
 * Reads the world; never mutates it. Never calls Math.random() — anything that varies per unit is
 * derived from unit.id, or it would shimmer every frame.
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH, LANE_Y } from '../sim/constants';
import type { Deity, DrawWorld, Side, Tier, Unit } from '../sim/types';
import { getSettings } from '../ui/settings';
import { BASE_HEIGHT, drawBackdropScene, drawBaseStructure } from './backdrops';
import type { BackdropId } from './backdrops';
import {
  TEAM_COLOR, TIER_SIZE, drawsAsFigure, figureHeight, unitBodyHeight, unitFootY, unitHalfWidth, unitScreenX,
  updateLayout, worldToScreen,
} from './layout';
import { drawFigureUnit, drawGhosts, updateRigs } from './rig/animator';
import { drawStrikes, scheduleStrikes } from './strikes';

const INK = '#1A1A1E';
const BONE = '#EDE6D6';
const BLOOD = '#C4442E';

/** Draws a filled shape with the heavy ink outline the woodcut direction calls for. */
function inked(ctx: CanvasRenderingContext2D, fill: string, lineWidth: number, path: () => void): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** The realm a deck resolves to, set once at boot. Only consulted when the setting is 'auto'. */
let autoBackdrop: BackdropId = 'greek';

export function setAutoBackdrop(id: BackdropId): void {
  autoBackdrop = id;
}

/** The scene actually on screen: the explicit setting, or the one the deck implies. */
export function activeBackdrop(): BackdropId {
  const choice = getSettings().backdrop;
  return choice === 'auto' ? autoBackdrop : choice;
}

/** A unit: tier-sized body, ink outline, facing notch, and its initial for identity. */
function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, deity: Deity | undefined): void {
  const sx = unitScreenX(unit);

  // Figure modes fall back per unit, not globally, so a half-delivered roster still renders.
  if (deity !== undefined && drawsAsFigure(deity)) {
    const scale = figureHeight(deity.tier) / 100;
    drawFigureUnit(ctx, unit, deity, sx, unitFootY(unit), scale, performance.now() / 1000);
    return;
  }

  const size = TIER_SIZE[deity?.tier ?? 'chaff'];
  const isPlayer = unit.side === 'player';
  const fill = isPlayer ? BONE : BLOOD;
  const facing = isPlayer ? 1 : -1;
  const baseY = unitFootY(unit);
  const top = baseY - size.h;

  // Body — a tapered slab, wider at the shoulders, which keeps tiers distinguishable in silhouette.
  inked(ctx, fill, 2.5, () => {
    ctx.moveTo(sx - size.w / 2, baseY);
    ctx.lineTo(sx - size.w / 2 + 1.5, top + size.h * 0.28);
    ctx.lineTo(sx - size.w / 2 - 1, top + size.h * 0.2);
    ctx.lineTo(sx, top);
    ctx.lineTo(sx + size.w / 2 + 1, top + size.h * 0.2);
    ctx.lineTo(sx + size.w / 2 - 1.5, top + size.h * 0.28);
    ctx.lineTo(sx + size.w / 2, baseY);
    ctx.closePath();
  });

  // Facing notch — a spear angled the way the unit advances.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + facing * (size.w / 2), top + size.h * 0.45);
  ctx.lineTo(sx + facing * (size.w / 2 + 7), top + size.h * 0.2);
  ctx.stroke();

  // Titans get a second mass so they read as monstrous rather than merely large.
  if (deity?.tier === 'titan') {
    inked(ctx, fill, 2, () => {
      ctx.ellipse(sx, top - 3, size.w * 0.36, 6, 0, 0, Math.PI * 2);
    });
  }

  if (deity !== undefined && size.h >= 19) {
    ctx.font = `800 ${Math.round(size.h * 0.38)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isPlayer ? INK : BONE;
    ctx.fillText(deity.name.charAt(0).toUpperCase(), sx, top + size.h * 0.5);
  }
}

/**
 * Team ring: a coloured disc on the ground under every unit with a chevron pointing the way it
 * fights. In a same-pantheon battle both sides use identical art, so this is what tells them apart.
 */
function drawTeamRing(ctx: CanvasRenderingContext2D, sx: number, footY: number, half: number, side: Side): void {
  const y = footY + 1;
  const rx = half * 1.15 + 4;
  const ry = Math.max(3.5, rx * 0.2);
  const color = TEAM_COLOR[side];
  const facing = side === 'player' ? 1 : -1;

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(sx, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + facing * (rx + 7), y);
  ctx.lineTo(sx + facing * (rx + 1), y - 3.5);
  ctx.lineTo(sx + facing * (rx + 1), y + 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Per-unit health bar state: the trailing "chip" of recently lost health. */
interface BarState {
  chip: number;
  holdUntil: number;
  shownSince: number;
}
const bars = new Map<number, BarState>();
/** The chip waits this long, then drains at CHIP_DRAIN of full health per second. */
const CHIP_HOLD = 0.35;
const CHIP_DRAIN = 0.9;
const BAR_FADE_IN = 0.18;
/** At or below this fraction of health a bar gets a warning frame. */
const LOW_HEALTH = 0.35;
const LOW_HEALTH_FRAME = '#FF3B2F';

interface BarRect {
  unit: Unit;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
}

/** Where each visible health bar goes. Unhurt units show none unless the setting asks for it. */
function layoutBars(units: readonly Unit[], deities: ReadonlyMap<string, Deity>, now: number): BarRect[] {
  const showFull = getSettings().showFullHealthBars;
  const rects: BarRect[] = [];
  for (const unit of units) {
    const deity = unit.isBase ? undefined : deities.get(unit.deityId);
    const hurt = unit.hp < unit.maxHp;
    let state = bars.get(unit.id);
    if (!unit.isBase && !hurt && !showFull) continue;
    if (state === undefined) {
      // Units start at full health, so a bar first shown by damage still trails that first hit.
      state = { chip: 1, holdUntil: 0, shownSince: now };
      bars.set(unit.id, state);
    }
    const figure = deity !== undefined && drawsAsFigure(deity);
    const w = unit.isBase ? 46 : figure ? Math.max(30, unitBodyHeight(deity) * 0.38) : Math.max(20, TIER_SIZE[deity?.tier ?? 'chaff'].w + 8);
    const h = unit.isBase ? 6 : 3;
    const y = unit.isBase ? LANE_Y - BASE_HEIGHT - 22 : unitFootY(unit) - unitBodyHeight(deity) - 9;
    const alpha = unit.isBase ? 1 : Math.min(1, (now - state.shownSince) / BAR_FADE_IN);
    rects.push({ unit, x: unitScreenX(unit) - w / 2, y, w, h, alpha });
  }

  // Lift any bar that would sit on top of one already placed, nearest the ground first.
  rects.sort((a, b) => b.y - a.y || a.x - b.x);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i] as BarRect;
    for (let pass = 0; pass < 6; pass++) {
      let clash = false;
      for (let j = 0; j < i && !clash; j++) {
        const o = rects[j] as BarRect;
        clash = r.x < o.x + o.w + 2 && o.x < r.x + r.w + 2 && Math.abs(r.y - o.y) < o.h + 3;
      }
      if (!clash) break;
      r.y -= r.h + 3;
    }
  }
  return rects;
}

/** Health bar in the unit's team colour, with a pale chip showing what was just lost. */
function drawHealth(ctx: CanvasRenderingContext2D, r: BarRect, now: number, dt: number): void {
  const unit = r.unit;
  const frac = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
  const state = bars.get(unit.id);
  if (state === undefined) return;
  if (frac < state.chip) {
    if (state.holdUntil === 0) state.holdUntil = now + CHIP_HOLD;
    if (now >= state.holdUntil) state.chip = Math.max(frac, state.chip - CHIP_DRAIN * dt);
  } else {
    state.chip = frac;
  }
  if (state.chip <= frac) state.holdUntil = 0;

  ctx.save();
  ctx.globalAlpha = r.alpha;
  // The frame turns warning red when a unit is nearly dead; the fill keeps its team colour.
  ctx.fillStyle = frac <= LOW_HEALTH ? LOW_HEALTH_FRAME : INK;
  ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  ctx.fillStyle = '#0d0b0b';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#F4ECD8';
  ctx.fillRect(r.x + r.w * frac, r.y, r.w * (state.chip - frac), r.h);
  ctx.fillStyle = TEAM_COLOR[unit.side];
  ctx.fillRect(r.x, r.y, r.w * frac, r.h);
  ctx.restore();
}

let lastFrame = 0;

/** Draws lane, bases, units, attack traces and health bars. */
export const drawWorld: DrawWorld = (ctx, world, deities) => {
  const now = performance.now() / 1000;
  const dt = lastFrame === 0 ? 0 : Math.min(0.25, now - lastFrame);
  lastFrame = now;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.save();
  drawBackdropScene(ctx, activeBackdrop(), now);

  updateLayout(world, deities, dt);
  scheduleStrikes(world, deities, now);

  // Bases first so units read as standing in front of them. Units further back (higher on screen)
  // draw first so nearer rows overlap them; within a row, descending tier so a big unit never hides
  // behind a chaff body it is standing on top of.
  const bases = world.units.filter((u) => u.isBase);
  const mobile = world.units.filter((u) => !u.isBase);
  const order: Record<Tier, number> = { titan: 0, god: 1, demigod: 2, chaff: 3 };
  mobile.sort((a, b) => {
    const ta = deities.get(a.deityId)?.tier ?? 'chaff';
    const tb = deities.get(b.deityId)?.tier ?? 'chaff';
    return unitFootY(a) - unitFootY(b) || order[ta] - order[tb] || a.id - b.id;
  });

  const realm = activeBackdrop();
  for (const base of bases) drawBaseStructure(ctx, realm, worldToScreen(base.x), base.side);
  updateRigs(world, now);
  for (const unit of mobile) drawTeamRing(ctx, unitScreenX(unit), unitFootY(unit), unitHalfWidth(deities.get(unit.deityId)), unit.side);
  for (const unit of mobile) drawUnit(ctx, unit, deities.get(unit.deityId));
  // A unit whose killing blow is still in flight stays marked until it falls (biped body width).
  drawGhosts(ctx, now, (sx, footY, scale, side) => drawTeamRing(ctx, sx, footY, 21 * scale, side));
  drawStrikes(ctx, now);
  for (const rect of layoutBars([...bases, ...mobile], deities, now)) drawHealth(ctx, rect, now, dt);

  // Forget bars of units that have left the field.
  if (bars.size > 128) {
    const alive = new Set(world.units.map((u) => u.id));
    for (const id of bars.keys()) if (!alive.has(id)) bars.delete(id);
  }
  ctx.restore();
};
