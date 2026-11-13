/**
 * Attack traces — the line from "who swung" to "who got hit".
 *
 * Every damaging hit draws something that physically connects the two units: a projectile for
 * anything with real reach, a slash and spark where a melee blow lands. Without it, a crowded fight
 * shows damage numbers appearing over units with no visible source.
 *
 * Timing: the simulation applies damage the instant an attack fires, but a figure's attack
 * animation only reaches its strike frame about 0.3 s later. So a hit is *shown* landing at the
 * strike frame (plus flight time for projectiles), and the defender's flinch, the damage number and
 * a dying unit's fall all wait for that moment via dueImpacts() and pendingImpactUntil().
 *
 * Render-only. Reads the world and the layout; never mutates the simulation.
 */

import { LANE_Y, MODIFIER_COLORS } from '../sim/constants';
import type { Deity, DeityIndex, SimEvent, Side, World } from '../sim/types';
import { BASE_HEIGHT } from './backdrops';
import { TEAM_COLOR, drawsAsFigure, screenPosById, unitBodyHeight, unitHalfWidth, worldToScreen } from './layout';
import { ANIM_SECONDS } from './rig/figure';

export type HitEvent = Extract<SimEvent, { kind: 'hit' }>;

/** Reach (world units) from which an attack is drawn as a projectile rather than a melee blow. */
export const RANGED_REACH = 44;

/** Seconds from the start of a figure's attack animation to its strike frame. */
const FIGURE_SWING = ANIM_SECONDS.attack * 0.44;
/** Blocks have no wind-up to wait for. */
const BLOCK_SWING = 0.05;
/** How long a slash or impact spark stays on screen after landing. */
const AFTERGLOW = 0.24;
/** Projectile speed in screen px per second, with a floor and ceiling on flight time. */
const FLIGHT_SPEED = 720;
const MIN_FLIGHT = 0.08;
const MAX_FLIGHT = 0.3;

interface Known {
  side: Side;
  isBase: boolean;
  deity: Deity | undefined;
  x: number;
}

interface Strike {
  hit: HitEvent;
  side: Side;
  ranged: boolean;
  burst: string;
  size: number;
  launchAt: number;
  impactAt: number;
  released: boolean;
}

const strikes: Strike[] = [];
const known = new Map<number, Known>();
let due: HitEvent[] = [];

/** Where a unit is drawn, how tall it is and how wide, live or recently gone. */
function anchor(id: number): { x: number; footY: number; height: number; half: number; isBase: boolean } | undefined {
  const info = known.get(id);
  if (info === undefined) return undefined;
  if (info.isBase) return { x: worldToScreen(info.x), footY: LANE_Y, height: BASE_HEIGHT * 0.9, half: 26, isBase: true };
  const pos = screenPosById(id);
  if (pos === undefined) return undefined;
  return { x: pos.x, footY: pos.footY, height: unitBodyHeight(info.deity), half: unitHalfWidth(info.deity), isBase: false };
}

/**
 * Turns this frame's hit events into scheduled strikes and releases those whose moment has come.
 * Call once per frame, after updateLayout and before updateRigs and drawEffects.
 */
export function scheduleStrikes(world: World, deities: DeityIndex, now: number): void {
  for (const unit of world.units) {
    known.set(unit.id, { side: unit.side, isBase: unit.isBase, deity: deities.get(unit.deityId), x: unit.x });
  }

  for (const event of world.events) {
    if (event.kind !== 'hit' || event.damage <= 0) continue;
    const attacker = known.get(event.attackerId);
    const deity = attacker?.deity;
    const ranged = deity !== undefined && deity.range >= RANGED_REACH;
    const swing = deity !== undefined && drawsAsFigure(deity) ? FIGURE_SWING : BLOCK_SWING;
    const from = anchor(event.attackerId);
    const to = anchor(event.defenderId);
    const distance = from !== undefined && to !== undefined ? Math.abs(from.x - to.x) : 0;
    const flight = ranged ? Math.min(MAX_FLIGHT, Math.max(MIN_FLIGHT, distance / FLIGHT_SPEED)) : 0;
    const dominant = event.modifiers[0];
    const side = attacker?.side ?? 'player';
    strikes.push({
      hit: event,
      side,
      ranged,
      burst: dominant === undefined ? TEAM_COLOR[side] : MODIFIER_COLORS[dominant],
      size: Math.min(1.9, 0.75 + Math.sqrt(event.damage) / 13),
      launchAt: now + swing,
      impactAt: now + swing + flight,
      released: false,
    });
  }

  due = [];
  for (const strike of strikes) {
    if (strike.released || strike.impactAt > now) continue;
    strike.released = true;
    due.push(strike.hit);
  }
  while (strikes.length > 0 && now - (strikes[0] as Strike).impactAt > AFTERGLOW) strikes.shift();

  if (known.size > 512) {
    const present = new Set(world.units.map((u) => u.id));
    const pending = new Set(strikes.flatMap((s) => [s.hit.attackerId, s.hit.defenderId]));
    for (const id of known.keys()) if (!present.has(id) && !pending.has(id)) known.delete(id);
  }
}

/** Hits whose blow lands this frame: time for the flinch and the damage number. */
export function dueImpacts(): readonly HitEvent[] {
  return due;
}

/** When the last blow still in flight toward this unit lands, or 0 if none is. */
export function pendingImpactUntil(unitId: number): number {
  let latest = 0;
  for (const strike of strikes) {
    if (!strike.released && strike.hit.defenderId === unitId) latest = Math.max(latest, strike.impactAt);
  }
  return latest;
}

/** Test hook: drop all scheduled strikes. */
export function resetStrikes(): void {
  strikes.length = 0;
  known.clear();
  due = [];
}

const quad = (a: number, c: number, b: number, u: number): number => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

/** Draws projectiles in flight, melee slashes and impact sparks. */
export function drawStrikes(ctx: CanvasRenderingContext2D, now: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  for (const strike of strikes) {
    if (now < strike.launchAt) continue;
    const from = anchor(strike.hit.attackerId);
    const to = anchor(strike.hit.defenderId);
    if (to === undefined) continue;
    const facing = strike.side === 'player' ? 1 : -1;
    const tx = to.x - facing * to.half * (to.isBase ? 1 : 0.35);
    const ty = to.footY - to.height * 0.55;

    if (strike.ranged && from !== undefined && now < strike.impactAt) {
      const sx = from.x + facing * from.half * 0.7;
      const sy = from.footY - from.height * 0.66;
      const lift = Math.min(30, Math.abs(tx - sx) * 0.18);
      const cx = (sx + tx) / 2;
      const cy = Math.min(sy, ty) - lift;
      const u = (now - strike.launchAt) / Math.max(0.001, strike.impactAt - strike.launchAt);
      const tail = Math.max(0, u - 0.28);
      const team = TEAM_COLOR[strike.side];

      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = team;
      ctx.lineWidth = 6 * strike.size;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const v = tail + (u - tail) * (i / 6);
        const px = quad(sx, cx, tx, v);
        const py = quad(sy, cy, ty, v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2 * strike.size;
      ctx.stroke();
      ctx.fillStyle = '#FFF7E6';
      ctx.beginPath();
      ctx.arc(quad(sx, cx, tx, u), quad(sy, cy, ty, u), 2.4 * strike.size, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (now < strike.impactAt) continue;
    const age = (now - strike.impactAt) / AFTERGLOW;
    if (age > 1) continue;
    const fade = 1 - age;

    if (!strike.ranged) {
      // A crescent swept across the defender, on the side the blow came from.
      const r = (11 + 5 * strike.size) * (0.85 + age * 0.3);
      const mid = facing > 0 ? Math.PI : 0;
      const sweep = 1.5 * Math.min(1, age * 3 + 0.35);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = TEAM_COLOR[strike.side];
      ctx.lineWidth = 4.2 * strike.size * fade + 1;
      ctx.beginPath();
      ctx.arc(tx + facing * r * 0.55, ty, r, mid - sweep / 2 * facing, mid + sweep / 2 * facing, facing < 0);
      ctx.stroke();
      ctx.strokeStyle = '#FFF7E6';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Impact spark: short rays bursting from the point of contact.
    ctx.globalAlpha = fade;
    ctx.strokeStyle = strike.burst;
    ctx.lineWidth = 2;
    const reach = (5 + 9 * age) * strike.size;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + strike.hit.attackerId;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a) * reach * 0.45, ty + Math.sin(a) * reach * 0.45);
      ctx.lineTo(tx + Math.cos(a) * reach, ty + Math.sin(a) * reach);
      ctx.stroke();
    }
  }
  ctx.restore();
}
