/**
 * Summoning from a deck.
 *
 * Every member of a side's deck can be summoned at any moment. The player picks by deck position
 * (number keys 1–9 follow draft order), and the only gates are faith and the field limits in
 * limits.ts. Picking the right counter is a decision about money and space, not about waiting for a
 * card to come round.
 *
 * Pure: reads the world, never writes it.
 */

import { deployBlock, type DeployBlock } from './limits';
import type { Deity, DeityId, DeityIndex, Side, World } from './types';

/** Why a summon request is refused. */
export type SummonRefusal = 'invalid-index' | 'insufficient-faith' | DeployBlock;

export interface SummonCheck {
  /** The deity at that deck position, if there is one. */
  readonly deity: Deity | undefined;
  /** Null when the summon may go ahead. */
  readonly reason: SummonRefusal | null;
}

/** Whether `side` may summon the deck member at `index` right now with `faith` to spend. */
export function checkSummon(
  world: World,
  deities: DeityIndex,
  deck: readonly DeityId[],
  index: number,
  side: Side,
  faith: number,
): SummonCheck {
  const id = deck[index];
  const deity = id === undefined ? undefined : deities.get(id);
  if (deity === undefined) return { deity, reason: 'invalid-index' };
  if (faith < deity.cost) return { deity, reason: 'insufficient-faith' };
  return { deity, reason: deployBlock(world, deities, deity, side) };
}

/**
 * Deck members the field limits currently allow, regardless of faith. The rule engine weighs
 * affordability itself (it may choose to save up), so the AI players are handed this list.
 */
export function fieldAllowed(world: World, deities: DeityIndex, deck: readonly DeityId[], side: Side): DeityId[] {
  return deck.filter((id) => {
    const deity = deities.get(id);
    return deity !== undefined && deployBlock(world, deities, deity, side) === null;
  });
}
