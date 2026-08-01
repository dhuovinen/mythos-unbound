/**
 * Scripted battle stage definitions — WP-8.
 *
 * Authors the reproducible, deterministic showcase timeline that demonstrates every relational
 * modifier in chronological sequence. Pure data.
 */

import type { Stage } from '../sim/types';

/** The Phase 1 scripted battle. Deterministic — no AI, no randomness. */
export const SHOWCASE_STAGE: Stage = {
  id: 'greek-showcase',
  name: 'Showcase: Theomachy',
  playerDeck: [
    'hoplite',
    'satyr',
    'heracles',
    'artemis',
    'asclepius',
    'aphrodite',
    'hephaestus',
    'zeus',
    'achilles',
  ],
  startingFaith: 100,
  faithMax: 500,
  faithRegen: 20,
  playerBaseHp: 3000,
  enemyBaseHp: 3000,
  waves: [
    // Beat 1: Baseline chaff combat (0s – 10s) — contrast baseline
    { at: 2, deityId: 'satyr', side: 'enemy' },
    { at: 5, deityId: 'hoplite', side: 'enemy' },
    { at: 10, deityId: 'harpy', side: 'enemy' },

    // Beat 2: Hera arrives (18s) — Wrath & Defiance vs Heracles
    { at: 18, deityId: 'hera', side: 'enemy' },

    // Beat 3: Apollo arrives (35s) — Rivalry between twin gods (Artemis)
    { at: 35, deityId: 'apollo', side: 'enemy' },

    // Beat 4: Zeus arrives (52s) — Vengeance (Asclepius armor-pen)
    { at: 52, deityId: 'zeus', side: 'enemy' },

    // Beat 5: Ares arrives (70s) — Entranced lovers (Aphrodite)
    { at: 70, deityId: 'ares', side: 'enemy' },

    // Beat 6: Enemy push (88s) — Jealousy debuff (Aphrodite + Hephaestus + Ares)
    { at: 88, deityId: 'hades', side: 'enemy' },

    // Beat 7: Cronus boss wave (108s) — Filicide & Usurpation vs Zeus
    { at: 108, deityId: 'cronus', side: 'enemy' },
  ],
};
