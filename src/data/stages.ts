/**
 * STUB — owned by WP-8. Replace this file wholesale.
 *
 * WP-8 delivers the scripted showcase wave that demonstrates every modifier in turn, keeping
 * this export name.
 */

import type { Stage } from '../sim/types';

/** The Phase 1 scripted battle. Deterministic — no AI, no randomness. */
export const SHOWCASE_STAGE: Stage = {
  id: 'showcase',
  name: 'Showcase',
  playerDeck: ['hoplite', 'zeus'],
  waves: [
    { at: 3, deityId: 'hoplite', side: 'enemy' },
    { at: 8, deityId: 'hoplite', side: 'enemy' },
  ],
  startingFaith: 150,
  faithMax: 900,
  faithRegen: 22,
  playerBaseHp: 4000,
  enemyBaseHp: 4000,
};
