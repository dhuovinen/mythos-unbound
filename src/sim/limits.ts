/**
 * Field limits: how many units a side may have in play at once.
 *
 * Two gates, both per side. A hard cap on bodies keeps the lane readable and stops a faith bank from
 * being poured into a wall of chaff; a tighter cap on gods and titans keeps the big units meaningful,
 * so a late summon is a decision rather than a reflex. The limits apply identically to the player
 * and the opponent, so neither can out-crowd the other.
 *
 * Scripted stage waves are exempt — they are authored timelines, and the regression tests depend on
 * them — but the units they put on the field still count against what either side may add.
 *
 * Pure: reads the world, never writes it.
 */

import type { Deity, DeityIndex, Side, World } from './types';

/** Most units (not counting the base) one side may have alive at once. */
export const MAX_FIELD_UNITS = 8;

/** Most gods and titans combined one side may have alive at once. */
export const MAX_HEAVY_UNITS = 2;

/** Why a summon is refused. */
export type DeployBlock = 'field' | 'heavy';

export interface FieldCounts {
  readonly units: number;
  readonly heavy: number;
}

const isHeavy = (deity: Deity | undefined): boolean => deity?.tier === 'god' || deity?.tier === 'titan';

/** What a side currently has in play. */
export function fieldCounts(world: World, deities: DeityIndex, side: Side): FieldCounts {
  let units = 0;
  let heavy = 0;
  for (const unit of world.units) {
    if (unit.isBase || unit.side !== side) continue;
    units++;
    if (isHeavy(deities.get(unit.deityId))) heavy++;
  }
  return { units, heavy };
}

/** Null if the side may summon this deity right now; otherwise the limit that stops it. */
export function deployBlock(world: World, deities: DeityIndex, deity: Deity, side: Side): DeployBlock | null {
  const counts = fieldCounts(world, deities, side);
  if (counts.units >= MAX_FIELD_UNITS) return 'field';
  if (isHeavy(deity) && counts.heavy >= MAX_HEAVY_UNITS) return 'heavy';
  return null;
}

/** Short wording for the reason, for the summon cards. */
export const BLOCK_LABEL: Readonly<Record<DeployBlock, string>> = {
  field: 'Field full',
  heavy: 'God limit',
};
