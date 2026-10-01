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
import { getSettings } from '../ui/settings';
import { BASE_HEIGHT, drawBackdropScene, drawBaseStructure } from './backdrops';
import type { BackdropId } from './backdrops';
import { drawFigureUnit, drawGhosts, hasFigure, updateRigs } from './rig/animator';

const INK = '#1A1A1E';
const BONE = '#EDE6D6';
const BLOOD = '#C4442E';

/** Screen footprint per tier. Size is the primary signal for cost — it must read at a glance. */
const TIER_SIZE: Readonly<Record<Tier, { w: number; h: number }>> = {
  chaff: { w: 13, h: 19 },
  demigod: { w: 17, h: 27 },
  god: { w: 21, h: 35 },
  titan: { w: 29, h: 47 },
};

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

/**
 * Screen y of a unit's feet, jitter included. Exported so the effects layer can anchor to exactly
 * the same spot — otherwise tags and status pips drift a few pixels off their unit.
 */
export function unitFootY(unit: Unit): number {
  return unit.isBase ? LANE_Y : LANE_Y + jitter(unit.id);
}

/** Screen height of a unit's body, by tier. */
export function unitBodyHeight(deity: Deity | undefined): number {
  const tier = deity?.tier ?? 'chaff';
  // Figures (sprites, rigs) stand far taller than the placeholder blocks, and everything anchored
  // above a unit — health bar, tags, pips — has to clear the body actually on screen.
  if (deity !== undefined && drawnAsFigure(deity)) return SPRITE_BASE * SPRITE_TIER_SCALE[tier];
  return TIER_SIZE[tier].h;
}

/** True when this deity is currently drawn as a full figure rather than a placeholder block. */
function drawnAsFigure(deity: Deity): boolean {
  return hasFigure(deity);
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

/** On-screen height of a titan's sprite frame; every other tier is a fraction of this. */
const SPRITE_BASE = 98;

/**
 * Per-tier sprite scale.
 *
 * WP-9 asked for tier to be encoded in the art — chaff filling ~55% of its frame, titans 100% — so
 * that drawing every frame at one size would reproduce the cost curve for free. The delivered art
 * does not do that: measured figure heights run 86–100% of frame regardless of tier, which would
 * render a Satyr at very nearly the size of Cronus and destroy the most important read on the
 * battlefield. So the renderer imposes the scale itself rather than trusting 22 separate images to
 * agree on a ratio. This stays correct even if the art is later regenerated to spec.
 */
const SPRITE_TIER_SCALE: Readonly<Record<Tier, number>> = {
  chaff: 0.55,
  demigod: 0.7,
  god: 0.85,
  titan: 1,
};

/** A unit: tier-sized body, ink outline, facing notch, and its initial for identity. */
function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, deity: Deity | undefined): void {
  const sx = worldToScreen(unit.x);

  // Figure modes fall back per unit, not globally, so a half-delivered roster still renders.
  if (deity !== undefined && hasFigure(deity)) {
    const scale = (SPRITE_BASE * SPRITE_TIER_SCALE[deity.tier]) / 100;
    drawFigureUnit(ctx, unit, deity, sx, unitFootY(unit), scale, performance.now() / 1000);
    return;
  }

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
  const y = unit.isBase ? LANE_Y - BASE_HEIGHT - 22 : LANE_Y + jitter(unit.id) - unitBodyHeight(deity) - 9;

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
  drawBackdropScene(ctx, activeBackdrop(), performance.now() / 1000);

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

  const realm = activeBackdrop();
  for (const base of bases) drawBaseStructure(ctx, realm, worldToScreen(base.x), base.side);
  updateRigs(world, performance.now() / 1000);
  for (const unit of mobile) drawUnit(ctx, unit, deities.get(unit.deityId));
  drawGhosts(ctx, performance.now() / 1000);
  for (const base of bases) drawHealth(ctx, base, undefined);
  for (const unit of mobile) drawHealth(ctx, unit, deities.get(unit.deityId));

  ctx.restore();
};
