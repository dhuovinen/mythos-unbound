/**
 * The cycling hand.
 *
 * Before this, every unit in your deck was available every moment you could afford it, so
 * counter-picking cost only money. Cycling makes availability itself a constraint: the god who
 * could answer what is in front of you may be three cards down the queue.
 *
 * That matters more here than in most games. A relational counter is a *specific* unit — only
 * Asclepius carries a grudge against Zeus — so "the answer exists but I cannot reach it yet" is a
 * far sharper tension than it is when any big unit will do.
 *
 * Pure and immutable: every operation returns a new hand, so the whole thing is trivially testable
 * and cannot desync from the simulation.
 */

import type { DeityId } from './types';

/** Visible slots. Deliberately equal to the opening reveal, so your opening IS your first hand. */
export const HAND_SIZE = 3;

export interface Hand {
  /** Currently summonable, left to right. */
  readonly slots: readonly DeityId[];
  /** Everything else, in the order it will arrive. */
  readonly queue: readonly DeityId[];
}

/**
 * Builds a hand from an ordered deck. Order is meaningful and comes from the draft: the first
 * HAND_SIZE entries are the opening the player revealed, and the rest are the reinforcements they
 * locked in afterwards.
 */
export function createHand(deck: readonly DeityId[]): Hand {
  return {
    slots: deck.slice(0, HAND_SIZE),
    queue: deck.slice(HAND_SIZE),
  };
}

/**
 * Plays the unit in `index`, cycling it to the back of the queue and drawing the next one into the
 * slot it vacated. Nothing is ever consumed — the deck is a loop, not a supply.
 *
 * Returns the hand unchanged if the index is out of range, so a stray input cannot corrupt state.
 */
export function playFrom(hand: Hand, index: number): Hand {
  const played = hand.slots[index];
  if (played === undefined) return hand;

  const incoming = hand.queue[0];
  if (incoming === undefined) {
    // Deck smaller than the hand: nothing to draw, so the slot simply keeps its card.
    return hand;
  }

  const slots = [...hand.slots];
  slots[index] = incoming;
  return {
    slots,
    queue: [...hand.queue.slice(1), played],
  };
}

/** How many summons until `deityId` becomes available, or null if it is not in the deck at all. */
export function turnsUntilAvailable(hand: Hand, deityId: DeityId): number | null {
  if (hand.slots.includes(deityId)) return 0;
  const position = hand.queue.indexOf(deityId);
  return position === -1 ? null : position + 1;
}
