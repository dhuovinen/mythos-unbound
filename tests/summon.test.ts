/**
 * Summoning from the full deck: any member, any order, gated only by faith and field limits.
 */

import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES } from '../src/data/greek';
import { SHOWCASE_STAGE } from '../src/data/stages';
import { MAX_FIELD_UNITS } from '../src/sim/limits';
import { checkSummon, fieldAllowed } from '../src/sim/summon';
import type { World } from '../src/sim/types';
import { createWorld, spawnUnit } from '../src/sim/world';

const deities = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
const DECK = SHOWCASE_STAGE.playerDeck;
const RICH = 10_000;

/** Applies an accepted summon the way main.ts does: pay, then spawn. */
function summon(world: World, index: number, faith = RICH): ReturnType<typeof checkSummon> {
  const check = checkSummon(world, deities, DECK, index, 'player', faith);
  if (check.reason === null && check.deity !== undefined) spawnUnit(world, check.deity, 'player');
  return check;
}

describe('summoning from the full deck', () => {
  it('offers every deck member from the first moment, including the last one drafted', () => {
    expect(DECK).toHaveLength(9);
    DECK.forEach((id, index) => {
      const world = createWorld(SHOWCASE_STAGE, deities);
      const check = checkSummon(world, deities, DECK, index, 'player', RICH);
      expect(check.reason).toBeNull();
      expect(check.deity?.id).toBe(id);
    });
  });

  it('accepts summons in any order, and the same card again straight away', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    // Last, first, middle, first again, then two gods from the back of the deck.
    for (const index of [8, 0, 3, 0, 7, 2]) expect(summon(world, index).reason).toBeNull();
    const fielded = world.units.filter((u) => !u.isBase && u.side === 'player').map((u) => u.deityId);
    expect(fielded).toEqual(['achilles', 'hoplite', 'asclepius', 'hoplite', 'zeus', 'artemis']);
  });

  it('refuses only for faith or field limits, naming which', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    expect(checkSummon(world, deities, DECK, 7, 'player', 379).reason).toBe('insufficient-faith');
    expect(checkSummon(world, deities, DECK, 7, 'player', 380).reason).toBeNull();

    summon(world, 7); // Zeus
    summon(world, 6); // Ares — two gods now on the field
    expect(checkSummon(world, deities, DECK, 2, 'player', RICH).reason).toBe('heavy');
    expect(checkSummon(world, deities, DECK, 1, 'player', RICH).reason).toBeNull();

    while (world.units.filter((u) => !u.isBase && u.side === 'player').length < MAX_FIELD_UNITS) summon(world, 0);
    expect(checkSummon(world, deities, DECK, 0, 'player', RICH).reason).toBe('field');
  });

  it('rejects positions outside the deck without throwing', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    expect(checkSummon(world, deities, DECK, 9, 'player', RICH)).toEqual({ deity: undefined, reason: 'invalid-index' });
    expect(checkSummon(world, deities, DECK, -1, 'player', RICH).reason).toBe('invalid-index');
  });

  it('hands the AI players the whole deck, minus anything the field limits block', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    expect(fieldAllowed(world, deities, DECK, 'player')).toEqual([...DECK]);
    summon(world, 7);
    summon(world, 6);
    expect(fieldAllowed(world, deities, DECK, 'player')).toEqual(['hoplite', 'heracles', 'asclepius', 'achilles']);
  });
});
