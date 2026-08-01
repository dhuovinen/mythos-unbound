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

import { CANVAS_HEIGHT, CANVAS_WIDTH, LANE_LENGTH, LANE_Y } from '../sim/constants';
import type { Deity, DrawWorld, Tier, Unit } from '../sim/types';

const INK = '#1A1A1E';
const BONE = '#EDE6D6';
const BLOOD = '#C4442E';
const BLOOD_DARK = '#8C2F20';
const GROUND = '#241f1c';
const SKY_TOP = '#15131a';
const SKY_BOTTOM = '#221d22';

/** Screen footprint per tier. Size is the primary signal for cost — it must read at a glance. */
const TIER_SIZE: Readonly<Record<Tier, { w: number; h: number }>> = {
  chaff: { w: 13, h: 19 },
  demigod: { w: 17, h: 27 },
  god: { w: 21, h: 35 },
  titan: { w: 29, h: 47 },
};

const BASE_WIDTH = 34;
const BASE_HEIGHT = 104;

/** World-space x to screen-space x. */
export function worldToScreen(x: number): number {
  return (x / LANE_LENGTH) * CANVAS_WIDTH;
}

/**
 * Deterministic per-unit vertical offset so a stack of units on the same lane position stays
 * countable. Derived from the id — never random, which would shimmer frame to frame.
 */
function jitter(id: number): number {
  return ((Math.imul(id, 2654435761) >>> 28) % 7) - 3;
}

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

/** Sky gradient and the ground the lane sits on. */
function drawBackdrop(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, LANE_Y);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, LANE_Y);

  ctx.fillStyle = GROUND;
  ctx.fillRect(0, LANE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - LANE_Y);

  ctx.strokeStyle = '#3a3229';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y);
  ctx.lineTo(CANVAS_WIDTH, LANE_Y);
  ctx.stroke();

  // Sparse ground ticks give the lane a sense of distance without competing for attention.
  ctx.strokeStyle = '#2e2721';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, LANE_Y + 6);
    ctx.lineTo(x, LANE_Y + 14);
    ctx.stroke();
  }
}

/** A base reads as a structure, not a unit: wider, taller, crenellated. */
function drawBase(ctx: CanvasRenderingContext2D, unit: Unit): void {
  const sx = worldToScreen(unit.x);
  const fill = unit.side === 'player' ? BONE : BLOOD_DARK;
  const top = LANE_Y - BASE_HEIGHT;

  inked(ctx, fill, 3, () => {
    ctx.rect(sx - BASE_WIDTH / 2, top, BASE_WIDTH, BASE_HEIGHT);
  });

  // Crenellations along the top edge.
  const merlon = BASE_WIDTH / 5;
  for (let i = 0; i < 3; i++) {
    inked(ctx, fill, 2, () => {
      ctx.rect(sx - BASE_WIDTH / 2 + i * 2 * merlon, top - 7, merlon, 8);
    });
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    const y = top + (BASE_HEIGHT / 4) * i;
    ctx.beginPath();
    ctx.moveTo(sx - BASE_WIDTH / 2, y);
    ctx.lineTo(sx + BASE_WIDTH / 2, y);
    ctx.stroke();
  }
}

/** A unit: tier-sized body, ink outline, facing notch, and its initial for identity. */
function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, deity: Deity | undefined): void {
  const sx = worldToScreen(unit.x);
  const size = TIER_SIZE[deity?.tier ?? 'chaff'];
  const isPlayer = unit.side === 'player';
  const fill = isPlayer ? BONE : BLOOD;
  const facing = isPlayer ? 1 : -1;
  const baseY = LANE_Y + jitter(unit.id);
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

/** Health bar. Bases get a wider one, since their health is the win condition. */
function drawHealth(ctx: CanvasRenderingContext2D, unit: Unit, deity: Deity | undefined): void {
  const sx = worldToScreen(unit.x);
  const frac = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
  const width = unit.isBase ? 46 : Math.max(20, TIER_SIZE[deity?.tier ?? 'chaff'].w + 8);
  const height = unit.isBase ? 6 : 4;
  const size = TIER_SIZE[deity?.tier ?? 'chaff'];
  const y = unit.isBase ? LANE_Y - BASE_HEIGHT - 22 : LANE_Y + jitter(unit.id) - size.h - 9;

  ctx.fillStyle = INK;
  ctx.fillRect(sx - width / 2 - 1, y - 1, width + 2, height + 2);
  ctx.fillStyle = '#0d0b0b';
  ctx.fillRect(sx - width / 2, y, width, height);
  ctx.fillStyle = frac > 0.35 ? (unit.side === 'player' ? BONE : BLOOD) : '#D62828';
  ctx.fillRect(sx - width / 2, y, width * frac, height);
}

/** Draws lane, bases, units and health bars. */
export const drawWorld: DrawWorld = (ctx, world, deities) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.save();
  drawBackdrop(ctx);

  // Bases first so units read as standing in front of them. Within units, draw by descending tier
  // so a big unit never hides behind a chaff body it is standing on top of.
  const bases = world.units.filter((u) => u.isBase);
  const mobile = world.units.filter((u) => !u.isBase);
  const order: Record<Tier, number> = { titan: 0, god: 1, demigod: 2, chaff: 3 };
  mobile.sort((a, b) => {
    const ta = deities.get(a.deityId)?.tier ?? 'chaff';
    const tb = deities.get(b.deityId)?.tier ?? 'chaff';
    return order[ta] - order[tb] || a.id - b.id;
  });

  for (const base of bases) drawBase(ctx, base);
  for (const unit of mobile) drawUnit(ctx, unit, deities.get(unit.deityId));
  for (const base of bases) drawHealth(ctx, base, undefined);
  for (const unit of mobile) drawHealth(ctx, unit, deities.get(unit.deityId));

  ctx.restore();
};
