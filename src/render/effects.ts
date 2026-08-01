/**
 * Relational VFX — WP-5.
 *
 * This is the file that makes the relational engine visible. The sim can have Cronus hitting Zeus
 * for 1.5x and, without this layer, nothing on screen says why. Three things are drawn:
 *
 *   1. Tethers   — coloured links between units that currently have an active relation
 *   2. Proc tags — short-lived labels naming the modifier that just fired
 *   3. Damage numbers — tinted by the dominant modifier, sized by magnitude
 *
 * Runs after drawWorld on the same context. Reads the world; never mutates it.
 */

import { AURA_RADIUS, CANVAS_HEIGHT, CANVAS_WIDTH, LANE_Y, MODIFIER_COLORS } from '../sim/constants';
import { combineModifiers, resolveAuras, resolveCombat } from '../sim/relations';
import type {
  Deity,
  DeityIndex,
  DrawEffects,
  Modifier,
  ModifierName,
  RelationGraph,
  Unit,
  World,
} from '../sim/types';
import { unitBodyHeight, unitFootY, worldToScreen } from './draw';

/** Hard caps keep a thirty-unit brawl from turning into soup. Legibility beats spectacle. */
const MAX_FLOATERS = 36;
const MAX_TETHERS = 10;

/** Only units closer than this (world units) are considered for a tether. */
const TETHER_RANGE = AURA_RADIUS * 1.6;

/** Status pips drawn under each unit. Capped so a heavily-buffed unit stays a readable width. */
const MAX_STATUS_PIPS = 5;
const PIP_W = 6;
const PIP_H = 4;
const PIP_GAP = 2;

const TAG_LIFE = 1.1;
const DAMAGE_LIFE = 0.85;

const NEUTRAL_DAMAGE_COLOR = '#e8dcc4';

/** A rising, fading piece of text. Presentation-only state — it never feeds back into the sim. */
interface Floater {
  text: string;
  color: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  weight: 700 | 800;
}

/**
 * Module-scope animation state. This is the one place mutable module state is acceptable, because
 * it is purely visual and is never read by the simulation.
 */
const floaters: Floater[] = [];

/** Last known screen position per unit id, so a killing blow still shows a damage number. */
const lastPos = new Map<number, { x: number; y: number }>();

/** Advances with real frame time; drives pulsing effects. */
let clock = 0;

/** Screen y just above a unit's head. Uses the renderer's own footing so nothing drifts. */
function anchorY(unit: Unit, deity: Deity | undefined): number {
  if (unit.isBase) return LANE_Y - 116;
  return unitFootY(unit) - unitBodyHeight(deity) - 6;
}

/** Adds a floater, discarding the oldest if we are at the cap. */
function pushFloater(floater: Floater): void {
  if (floaters.length >= MAX_FLOATERS) floaters.shift();
  floaters.push(floater);
}

/** Keeps text inside the canvas so edge-of-lane labels are not clipped. */
function clampX(x: number, halfWidth: number): number {
  return Math.min(CANVAS_WIDTH - halfWidth - 2, Math.max(halfWidth + 2, x));
}

/** Damage numbers grow with magnitude, so a Filicide crit reads instantly. */
function damageSize(damage: number): number {
  return Math.min(30, 12 + Math.sqrt(damage) * 1.1);
}

/** Draws text with a dark halo so it stays legible over units and the lane. */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  alpha: number,
): void {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(10, 8, 8, 0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

/** Turns each 'hit' event into a proc tag over the attacker and a damage number over the defender. */
function spawnFromEvents(world: World): void {
  for (const event of world.events) {
    if (event.kind !== 'hit') continue;

    // WP-1 sorts by precedence, so element 0 is the dominant modifier.
    const dominant: ModifierName | undefined = event.modifiers[0];
    const tint = dominant === undefined ? NEUTRAL_DAMAGE_COLOR : MODIFIER_COLORS[dominant];

    if (dominant !== undefined) {
      const from = lastPos.get(event.attackerId);
      if (from !== undefined) {
        pushFloater({
          text: dominant.toUpperCase(),
          color: tint,
          x: from.x,
          y: from.y - 12,
          vy: -26,
          life: TAG_LIFE,
          maxLife: TAG_LIFE,
          size: 13,
          weight: 800,
        });
      }
    }

    // damage === 0 means the attack was prevented (Entranced). Keep the proc tag, drop the number:
    // a floating "0" reads as a miss rather than as a refusal to fight.
    const to = event.damage > 0 ? lastPos.get(event.defenderId) : undefined;
    if (to !== undefined) {
      pushFloater({
        text: `${Math.round(event.damage)}`,
        color: tint,
        x: to.x,
        y: to.y,
        vy: -38,
        life: DAMAGE_LIFE,
        maxLife: DAMAGE_LIFE,
        size: damageSize(event.damage),
        weight: 700,
      });
    }
  }
}

/** Every modifier currently acting on one unit, plus the net effect of them all. */
interface UnitStatus {
  readonly mods: readonly Modifier[];
  readonly power: number;
  readonly suppress: boolean;
}

/**
 * What is happening to this unit *right now* — both the relation to whoever it is fighting and the
 * auras from allies standing near it.
 *
 * Tethers and proc tags are transient: they announce that something fired. This is the persistent
 * counterpart, so a unit standing in a buff visibly reads as buffed for as long as it lasts.
 */
function computeStatus(
  unit: Unit,
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
  byId: ReadonlyMap<number, Unit>,
): UnitStatus | null {
  const self = deities.get(unit.deityId);
  if (self === undefined || unit.isBase) return null;

  const mods: Modifier[] = [];

  if (unit.targetId !== null) {
    const target = byId.get(unit.targetId);
    const targetDeity = target === undefined ? undefined : deities.get(target.deityId);
    if (targetDeity !== undefined) mods.push(...resolveCombat(self, targetDeity, graph));
  }

  const nearby: Deity[] = [];
  const field: Deity[] = [];
  for (const other of world.units) {
    if (other.isBase || other.id === unit.id || other.side !== unit.side || other.hp <= 0) continue;
    const deity = deities.get(other.deityId);
    if (deity === undefined) continue;
    field.push(deity);
    if (Math.abs(other.x - unit.x) <= AURA_RADIUS) nearby.push(deity);
  }
  mods.push(...resolveAuras(self, nearby, field, graph));

  if (mods.length === 0) return null;
  const combined = combineModifiers(mods);
  // Damage and rate of fire both matter; their product is a fair one-number read on "stronger".
  return {
    mods,
    power: combined.damageMult * combined.attackSpeedMult,
    suppress: combined.suppress,
  };
}

/**
 * Draws the status readout beneath a unit: one colour-coded pip per active modifier, and a caret
 * summarising whether the unit is currently stronger, weaker, or halted outright.
 */
function drawStatus(ctx: CanvasRenderingContext2D, unit: Unit, status: UnitStatus, sx: number): void {
  const mods = status.mods.slice(0, MAX_STATUS_PIPS);
  const totalWidth = mods.length * PIP_W + (mods.length - 1) * PIP_GAP;
  const startX = sx - totalWidth / 2;
  const y = unitFootY(unit) + 7;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 8, 0.72)';
  ctx.fillRect(startX - 3, y - 3, totalWidth + 6, PIP_H + 6);

  mods.forEach((mod, i) => {
    ctx.fillStyle = mod.color;
    ctx.fillRect(startX + i * (PIP_W + PIP_GAP), y, PIP_W, PIP_H);
  });

  const dominant = mods[0];
  const tint = dominant === undefined ? '#e8dcc4' : dominant.color;
  const cy = y + PIP_H + 7;
  ctx.fillStyle = tint;

  if (status.suppress) {
    // Halted — a pause mark, not an arrow. Entranced units are not weaker, they simply stop.
    ctx.fillRect(sx - 4, cy - 3, 2.5, 6);
    ctx.fillRect(sx + 1.5, cy - 3, 2.5, 6);
  } else if (status.power > 1.03 || status.power < 0.97) {
    const up = status.power > 1;
    ctx.beginPath();
    ctx.moveTo(sx, up ? cy - 4 : cy + 4);
    ctx.lineTo(sx - 4, up ? cy + 3 : cy - 3);
    ctx.lineTo(sx + 4, up ? cy + 3 : cy - 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A relation currently active between two on-field units. */
interface Tether {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  color: string;
  name: ModifierName;
  hostile: boolean;
}

/**
 * Finds active relations worth drawing. Enemy pairs use resolveCombat; allied pairs use a two-unit
 * slice of resolveAuras, which reuses WP-1's logic rather than reimplementing it (and naturally
 * excludes Jealousy, which needs a third unit on the field).
 */
function collectTethers(world: World, deities: DeityIndex, graph: RelationGraph): Tether[] {
  const found: Tether[] = [];
  const live = world.units.filter((u) => !u.isBase && u.hp > 0);

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (a === undefined || b === undefined) continue;
      if (Math.abs(a.x - b.x) > TETHER_RANGE) continue;

      const da = deities.get(a.deityId);
      const db = deities.get(b.deityId);
      if (da === undefined || db === undefined) continue;
      if (da.pantheon !== db.pantheon) continue;

      const hostile = a.side !== b.side;
      const mods = hostile
        ? [...resolveCombat(da, db, graph), ...resolveCombat(db, da, graph)]
        : [...resolveAuras(da, [db], [db], graph), ...resolveAuras(db, [da], [da], graph)];

      const top = mods[0];
      if (top === undefined) continue;

      const posA = lastPos.get(a.id);
      const posB = lastPos.get(b.id);
      if (posA === undefined || posB === undefined) continue;

      found.push({
        ax: posA.x,
        ay: posA.y,
        bx: posB.x,
        by: posB.y,
        color: top.color,
        name: top.name,
        hostile,
      });
    }
  }

  // Hostile relations are the dramatic ones — keep those when we hit the cap.
  found.sort((x, y) => Number(y.hostile) - Number(x.hostile));
  return found.slice(0, MAX_TETHERS);
}

/** Draws one tether as an upward arc, so overlapping links stay distinguishable. */
function drawTether(ctx: CanvasRenderingContext2D, tether: Tether): void {
  const midX = (tether.ax + tether.bx) / 2;
  const span = Math.abs(tether.ax - tether.bx);
  const lift = Math.min(52, 18 + span * 0.28);
  const midY = Math.min(tether.ay, tether.by) - lift;

  // Entranced is the most dramatic state in the game — two units frozen refusing to fight.
  const pulse = tether.name === 'Entranced' ? 0.72 + Math.sin(clock * 5) * 0.28 : 1;

  ctx.save();
  ctx.strokeStyle = tether.color;
  ctx.globalAlpha = (tether.hostile ? 0.85 : 0.45) * pulse;
  ctx.lineWidth = tether.hostile ? 2.4 : 1.4;
  ctx.setLineDash(tether.hostile ? [] : [4, 5]);
  ctx.beginPath();
  ctx.moveTo(tether.ax, tether.ay);
  ctx.quadraticCurveTo(midX, midY, tether.bx, tether.by);
  ctx.stroke();

  // A dot at the apex reads as "something is happening here" even at a glance.
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.9 * pulse;
  ctx.fillStyle = tether.color;
  ctx.beginPath();
  ctx.arc(midX, midY + lift * 0.25, tether.hostile ? 2.6 : 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws relational tethers, floating proc tags and damage numbers. */
export const drawEffects: DrawEffects = (ctx, world, deities, graph, dt) => {
  clock += dt;

  // Refresh positions before reading events, so a unit that died this tick still has a position.
  for (const unit of world.units) {
    const deity = deities.get(unit.deityId);
    lastPos.set(unit.id, { x: worldToScreen(unit.x), y: anchorY(unit, deity) });
  }

  spawnFromEvents(world);

  for (const tether of collectTethers(world, deities, graph)) {
    drawTether(ctx, tether);
  }

  // Persistent per-unit status, drawn beneath each unit.
  const byId = new Map(world.units.map((u) => [u.id, u]));
  for (const unit of world.units) {
    if (unit.isBase || unit.hp <= 0) continue;
    const status = computeStatus(unit, world, deities, graph, byId);
    if (status !== null) drawStatus(ctx, unit, status, worldToScreen(unit.x));
  }

  ctx.save();
  for (let i = floaters.length - 1; i >= 0; i--) {
    const floater = floaters[i];
    if (floater === undefined) continue;

    floater.life -= dt;
    if (floater.life <= 0) {
      floaters.splice(i, 1);
      continue;
    }

    floater.y += floater.vy * dt;

    const progress = floater.life / floater.maxLife;
    const alpha = progress > 0.7 ? 1 : progress / 0.7;
    const halfWidth = floater.text.length * floater.size * 0.32;

    drawText(
      ctx,
      floater.text,
      clampX(floater.x, halfWidth),
      Math.max(10, Math.min(CANVAS_HEIGHT - 10, floater.y)),
      floater.size,
      floater.weight,
      floater.color,
      alpha,
    );
  }
  ctx.restore();

  // Drop position records for units that have left the field, so the map cannot grow forever.
  if (lastPos.size > 256) {
    const alive = new Set(world.units.map((u) => u.id));
    for (const id of lastPos.keys()) {
      if (!alive.has(id)) lastPos.delete(id);
    }
  }
};
