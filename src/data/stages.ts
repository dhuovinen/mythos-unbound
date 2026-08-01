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
  // Ares is in the PLAYER deck deliberately: Jealousy needs Aphrodite, her spouse Hephaestus and
  // her lover Ares all fielded on the SAME side. Without him beat 6 can never fire.
  playerDeck: [
    'hoplite',
    'heracles',
    'artemis',
    'asclepius',
    'aphrodite',
    'hephaestus',
    'ares',
    'zeus',
    'achilles',
  ],
  startingFaith: 200,
  faithMax: 900,
  faithRegen: 30,
  playerBaseHp: 9000,
  // Deliberately fat. The enemy base must outlast Cronus's walk down the lane — he moves at 18
  // units/s and needs roughly 30s just to reach midfield, so a thinner base ends the battle
  // before the flagship Filicide pairing ever happens.
  enemyBaseHp: 13000,
  // Chaff is kept sparse on purpose. Every extra body clogs the lane, and a clogged lane means the
  // beat units never reach each other — which is exactly how the earlier tuning stalled out.
  waves: [
    // Beat 1 — baseline. No relations at all, so later procs read as special by contrast.
    { at: 3, deityId: 'satyr', side: 'enemy' },
    { at: 9, deityId: 'hoplite', side: 'enemy' },

    // Beat 2 — Hera vs Heracles: Wrath one way, Defiance the other.
    { at: 22, deityId: 'hera', side: 'enemy' },
    // An enemy-side Heracles marching beside his tormentor: Hera persecutes him, so he takes the
    // Resented aura from his own ally. The only way that modifier can surface at all.
    { at: 26, deityId: 'heracles', side: 'enemy' },

    // Beat 3 — Apollo vs Artemis: Rivalry between twins.
    { at: 44, deityId: 'apollo', side: 'enemy' },
    // Achilles was slain by Apollo, so he carries Vengeance into this beat. Scripted as a PLAYER
    // reinforcement rather than left to the player: Asclepius and Achilles are fragile enough that
    // in a free-form lane they usually die to chaff before their nemesis ever arrives.
    { at: 46, deityId: 'achilles', side: 'player' },

    // Beat 4 — Zeus vs Asclepius: Vengeance, armour-piercing, from the man Zeus struck down.
    { at: 66, deityId: 'zeus', side: 'enemy' },
    { at: 66, deityId: 'asclepius', side: 'player' },

    // Beat 5 — Ares vs Aphrodite: Entranced. Both halt and refuse to fight.
    { at: 88, deityId: 'ares', side: 'enemy' },
    { at: 86, deityId: 'aphrodite', side: 'player' },

    // Beat 7 — Cronus vs Zeus: Filicide and Usurpation in a single pairing. The flagship moment.
    // Spawned early because he is the slowest unit in the game and has the furthest to walk.
    { at: 104, deityId: 'cronus', side: 'enemy' },
    { at: 112, deityId: 'zeus', side: 'player' },
    // Hera returns opposite the player's Zeus so the pair can trade Bound — spouses pulling their
    // punches. She has to arrive late; the beat-2 Hera is long dead by the time Zeus is fielded.
    { at: 118, deityId: 'hera', side: 'enemy' },

    // Beat 6 — a body to fight while the player fields Aphrodite + Hephaestus + Ares for Jealousy.
    { at: 126, deityId: 'hades', side: 'enemy' },
  ],
};
