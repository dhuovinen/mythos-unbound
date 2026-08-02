/**
 * Tests for the cycling hand and the two-phase draft.
 */

import { describe, expect, it } from 'vitest';
import { EGYPTIAN_DEITIES, EGYPTIAN_EDGES } from '../src/data/egyptian';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { NORSE_DEITIES, NORSE_EDGES } from '../src/data/norse';
import {
  DRAFT_DECK_SIZE,
  OPENING_SIZE,
  REINFORCEMENT_SIZE,
  draftOpening,
  draftReinforcements,
  pantheonsOf,
} from '../src/sim/draft';
import { HAND_SIZE, createHand, playFrom, turnsUntilAvailable } from '../src/sim/hand';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';

const ROSTER = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES];
const GRAPH = buildGraph([...GREEK_EDGES, ...NORSE_EDGES, ...EGYPTIAN_EDGES]);

const DECK = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('the cycling hand', () => {
  it('opens with the first HAND_SIZE of the deck, in draft order', () => {
    const hand = createHand(DECK);
    expect(hand.slots).toEqual(['a', 'b', 'c']);
    expect(hand.queue).toEqual(['d', 'e', 'f']);
  });

  it('cycles a played unit to the back and draws the next into its slot', () => {
    const hand = playFrom(createHand(DECK), 1);
    expect(hand.slots).toEqual(['a', 'd', 'c']);
    expect(hand.queue).toEqual(['e', 'f', 'b']);
  });

  it('never consumes a unit — the deck is a loop, not a supply', () => {
    let hand = createHand(DECK);
    for (let i = 0; i < 40; i++) hand = playFrom(hand, i % HAND_SIZE);
    const all = [...hand.slots, ...hand.queue].sort();
    expect(all).toEqual([...DECK].sort());
  });

  it('returns the hand untouched on an out-of-range index', () => {
    const hand = createHand(DECK);
    expect(playFrom(hand, 9)).toBe(hand);
    expect(playFrom(hand, -1)).toBe(hand);
  });

  it('reports how far away a unit is, which is the whole point of cycling', () => {
    const hand = createHand(DECK);
    expect(turnsUntilAvailable(hand, 'a')).toBe(0);
    expect(turnsUntilAvailable(hand, 'd')).toBe(1);
    expect(turnsUntilAvailable(hand, 'f')).toBe(3);
    expect(turnsUntilAvailable(hand, 'zeus')).toBeNull();
  });

  it('is immutable — playing returns a new hand and leaves the old one alone', () => {
    const before = createHand(DECK);
    const after = playFrom(before, 0);
    expect(before.slots).toEqual(['a', 'b', 'c']);
    expect(after).not.toBe(before);
  });
});

describe('the blind opening', () => {
  it('commits to a single pantheon', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const opening = draftOpening(ROSTER, GRAPH, createRng(seed));
      expect(opening).toHaveLength(OPENING_SIZE);
      expect(pantheonsOf(opening, ROSTER)).toHaveLength(1);
    }
  });

  it('spreads across cost brackets rather than opening on three titans', () => {
    const byId = new Map(ROSTER.map((d) => [d.id, d]));
    const opening = draftOpening(ROSTER, GRAPH, createRng(7));
    const tiers = opening.map((id) => byId.get(id)?.tier);
    expect(new Set(tiers).size).toBe(OPENING_SIZE);
  });

  it('is deterministic for a given seed, and varies across seeds', () => {
    expect(draftOpening(ROSTER, GRAPH, createRng(3))).toEqual(
      draftOpening(ROSTER, GRAPH, createRng(3)),
    );
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      seen.add(draftOpening(ROSTER, GRAPH, createRng(seed)).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('informed reinforcements', () => {
  it('fills the deck to exactly DRAFT_DECK_SIZE without repeats', () => {
    const opening = draftOpening(ROSTER, GRAPH, createRng(5));
    const reinforcements = draftReinforcements(ROSTER, GRAPH, opening, ['zeus', 'hera', 'cronus']);
    expect(reinforcements).toHaveLength(REINFORCEMENT_SIZE);
    const deck = [...opening, ...reinforcements];
    expect(deck).toHaveLength(DRAFT_DECK_SIZE);
    expect(new Set(deck).size).toBe(DRAFT_DECK_SIZE);
  });

  it('answers a revealed Greek opening with units that have leverage over it', () => {
    // Facing Cronus, the counter is one of his children — Usurpation is the strongest read here.
    const picks = draftReinforcements(ROSTER, GRAPH, [], ['cronus'], 4);
    expect(picks.some((id) => ['zeus', 'hera', 'poseidon', 'hades'].includes(id))).toBe(true);
  });

  it('brings the avenger when the reveal shows the god who killed him', () => {
    const picks = draftReinforcements(ROSTER, GRAPH, [], ['zeus'], 6);
    expect(picks).toContain('asclepius');
  });

  it('reads across pantheons — an Egyptian reveal draws Egyptian counters', () => {
    // Set murdered Osiris, so Osiris carries Vengeance and Horus carries Defiance against him.
    const picks = draftReinforcements(ROSTER, GRAPH, [], ['set'], 5);
    expect(picks.some((id) => ['osiris', 'horus', 'isis'].includes(id))).toBe(true);
  });

  it('is deterministic for the same reveal', () => {
    const a = draftReinforcements(ROSTER, GRAPH, ['zeus'], ['odin', 'thor']);
    const b = draftReinforcements(ROSTER, GRAPH, ['zeus'], ['odin', 'thor']);
    expect(a).toEqual(b);
  });

  it('never picks a unit already in the opening', () => {
    const opening = ['zeus', 'hera', 'ares'];
    const picks = draftReinforcements(ROSTER, GRAPH, opening, ['cronus']);
    for (const id of opening) expect(picks).not.toContain(id);
  });
});
