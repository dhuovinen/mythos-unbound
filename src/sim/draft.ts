/**
 * The draft.
 *
 * Both sides commit an opening of OPENING_SIZE units and reveal them simultaneously. Only then does
 * each side lock in reinforcements, knowing what the other opened with.
 *
 * This exists to fix a specific flaw. Relations resolve only within a pantheon, so whether combat
 * modifiers fire at all is a *joint* outcome of both decks — neither player can decide it alone.
 * Choosing blind made that a coin toss, and made mixed decks strictly worse than pure ones. Showing
 * the opening turns it into a read: meet them on the family battlefield where the graph cuts both
 * ways, or go foreign and force a fight decided by raw statistics.
 *
 * It also creates the bluff. What you choose to show first is itself a decision.
 *
 * Pure and deterministic — the opponent's choices are seeded, never random at call time.
 */

import { combineModifiers, resolveAuras, resolveCombat } from './relations';
import type { Deity, DeityId, Pantheon, RelationGraph, Rng, Tier } from './types';

/** Units revealed up front. Equal to HAND_SIZE, so your opening is literally your opening hand. */
export const OPENING_SIZE = 3;

/** Total deck size. The remainder after the opening is locked in after the reveal. */
export const DRAFT_DECK_SIZE = 9;

/** How many units are chosen with knowledge of the opponent's opening. */
export const REINFORCEMENT_SIZE = DRAFT_DECK_SIZE - OPENING_SIZE;

/** Cost brackets an opening should spread across, so a side is not broke or top-heavy at the start. */
const OPENING_TIERS: readonly Tier[] = ['chaff', 'demigod', 'god'];

/** Bonds a candidate would form with units already chosen on its own side. */
function synergyScore(candidate: Deity, allies: readonly Deity[], graph: RelationGraph): number {
  let score = 0;
  for (const ally of allies) {
    for (const mod of [
      ...resolveAuras(candidate, [ally], [ally], graph),
      ...resolveAuras(ally, [candidate], [candidate], graph),
    ]) {
      const net = combineModifiers([mod]);
      score += (net.damageMult - 1) + (net.armorMult - 1) + (net.attackSpeedMult - 1);
    }
  }
  return score * 100;
}

/** Leverage a candidate would have over the opposition, minus what they get back. */
function leverageScore(
  candidate: Deity,
  opposition: readonly Deity[],
  graph: RelationGraph,
): number {
  let score = 0;
  for (const enemy of opposition) {
    for (const mod of resolveCombat(candidate, enemy, graph)) {
      if (mod.suppress) {
        score += enemy.cost * 0.4;
        continue;
      }
      const net = combineModifiers([mod]);
      score += (net.damageMult - 1) * 90 + (net.attackSpeedMult - 1) * 60;
    }
    for (const mod of resolveCombat(enemy, candidate, graph)) {
      if (mod.suppress) continue;
      const net = combineModifiers([mod]);
      score -= (net.damageMult - 1) * 70;
    }
  }
  return score;
}

/**
 * An opening chosen without seeing anything. Commits to one pantheon and spreads across cost
 * brackets, preferring units that already bond with each other — an opening is a statement about
 * which family you intend to fight as.
 */
export function draftOpening(roster: readonly Deity[], graph: RelationGraph, rng: Rng): DeityId[] {
  const pantheons: Pantheon[] = [...new Set(roster.map((d) => d.pantheon))].sort();
  const chosenPantheon = pantheons[Math.floor(rng.next() * pantheons.length)] ?? pantheons[0];
  if (chosenPantheon === undefined) return [];

  const pool = roster.filter((d) => d.pantheon === chosenPantheon);
  const opening: Deity[] = [];

  for (const tier of OPENING_TIERS) {
    const candidates = pool.filter((d) => d.tier === tier && !opening.includes(d));
    if (candidates.length === 0) continue;

    let best = candidates[0];
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      // Deterministic tie-break jitter keeps openings varied without becoming unpredictable.
      const score = synergyScore(candidate, opening, graph) + rng.next() * 12;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (best !== undefined) opening.push(best);
  }

  return opening.slice(0, OPENING_SIZE).map((d) => d.id);
}

/**
 * Reinforcements chosen with the opponent's opening on the table.
 *
 * This is where the read happens: leverage against what they revealed is weighted above synergy
 * with your own units, because a bond that never fires is worth nothing while a counter that fires
 * every exchange decides the battle.
 */
export function draftReinforcements(
  roster: readonly Deity[],
  graph: RelationGraph,
  ownOpening: readonly DeityId[],
  revealedOpposition: readonly DeityId[],
  count: number = REINFORCEMENT_SIZE,
): DeityId[] {
  const byId = new Map(roster.map((d) => [d.id, d]));
  const own = ownOpening.map((id) => byId.get(id)).filter((d): d is Deity => d !== undefined);
  const enemy = revealedOpposition
    .map((id) => byId.get(id))
    .filter((d): d is Deity => d !== undefined);

  const picked: Deity[] = [];
  const taken = new Set<DeityId>(ownOpening);

  for (let slot = 0; slot < count; slot++) {
    let best: Deity | undefined;
    let bestScore = -Infinity;

    for (const candidate of roster) {
      if (taken.has(candidate.id)) continue;

      const allies = [...own, ...picked];
      const score =
        leverageScore(candidate, enemy, graph) * 1.4 +
        synergyScore(candidate, allies, graph) -
        candidate.cost * 0.05;

      // Stable tie-break on id so the same board always drafts the same deck.
      if (score > bestScore || (score === bestScore && best !== undefined && candidate.id < best.id)) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best === undefined) break;
    picked.push(best);
    taken.add(best.id);
  }

  return picked.map((d) => d.id);
}

/** Pantheons represented in a set of ids, for describing a reveal. */
export function pantheonsOf(ids: readonly DeityId[], roster: readonly Deity[]): Pantheon[] {
  const byId = new Map(roster.map((d) => [d.id, d]));
  const found = new Set<Pantheon>();
  for (const id of ids) {
    const deity = byId.get(id);
    if (deity !== undefined) found.add(deity.pantheon);
  }
  return [...found].sort();
}
