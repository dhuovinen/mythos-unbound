/**
 * FROZEN CONTRACT — owned by WP-0 (integrator). No work package may edit this file.
 * Shared tuning values and the modifier colour table used by both WP-1 and WP-5.
 */

import type { ModifierName } from './types';

/** Lane runs from x=0 (player base) to x=LANE_LENGTH (enemy base), in world units. */
export const LANE_LENGTH = 1200;

/** Simulation runs at a fixed 60 Hz regardless of display refresh rate. */
export const TICK_RATE = 60;

/** Seconds per simulation step. */
export const TICK_DT = 1 / TICK_RATE;

/** Guard against runaway catch-up after a tab has been backgrounded, in seconds. */
export const MAX_FRAME_DT = 0.25;

/** Allied units within this many world units of each other exchange aura modifiers. */
export const AURA_RADIUS = 120;

/** Ceiling on stacked damage multipliers, so relation stacking cannot go degenerate. */
export const MAX_DAMAGE_MULT = 3;

/** Spawn positions for each side's base. */
export const PLAYER_BASE_X = 40;
export const ENEMY_BASE_X = LANE_LENGTH - 40;

/** Canvas dimensions; must match the <canvas> element in index.html. */
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

/** Screen-space y of the lane floor that units stand on. */
export const LANE_Y = 400;

/**
 * Colour per modifier, driving both the tether line (WP-5) and the Modifier.color field (WP-1).
 * Warm hues read as "advantage", cool/muted hues as "penalty".
 */
export const MODIFIER_COLORS: Readonly<Record<ModifierName, string>> = {
  // combat
  Reluctance: '#6E8CA0',
  Filicide: '#B03A2E',
  Usurpation: '#E0A93B',
  Rivalry: '#E07A3B',
  Entranced: '#E34FA8',
  Vengeance: '#D62828',
  Bound: '#8E6BBF',
  Wrath: '#E5502A',
  Defiance: '#2EC4B6',
  // aura
  Blessed: '#F0C674',
  Kinship: '#7BB661',
  Devoted: '#D98CA8',
  Jealousy: '#6B8E23',
  Resented: '#7A6E8C',
};
