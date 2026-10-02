import type { DeityId, Stage } from './types';

/** A draft replaces the showcase: its free demonstration units must never enter a roster battle. */
export function selectBattleStage(
  showcase: Stage,
  playerDraft: readonly DeityId[] | null,
  opponentDraft: readonly DeityId[] | null,
): Stage {
  if (playerDraft === null && opponentDraft === null) return showcase;
  return {
    ...showcase,
    id: 'roster-battle',
    name: 'Roster battle',
    playerDeck: [...(playerDraft ?? showcase.playerDeck)],
    waves: [],
  };
}
