/**
 * STUB — owned by WP-3. Replace this file wholesale.
 *
 * Two placeholder entries so the scaffold runs. WP-3 delivers the full 22-unit roster and the
 * complete edge list, keeping these two export names.
 */

import type { Deity, Edge } from '../sim/types';

/** Full Greek roster. */
export const GREEK_DEITIES: readonly Deity[] = [
  {
    id: 'hoplite',
    name: 'Hoplite',
    pantheon: 'greek',
    tier: 'chaff',
    cost: 30,
    hp: 120,
    damage: 12,
    attackInterval: 1.2,
    range: 28,
    speed: 42,
    armor: 2,
    traits: [],
  },
  {
    id: 'zeus',
    name: 'Zeus',
    pantheon: 'greek',
    tier: 'god',
    cost: 320,
    hp: 900,
    damage: 90,
    attackInterval: 1.8,
    range: 46,
    speed: 30,
    armor: 12,
    traits: [],
  },
];

/** Genealogy edges between Greek roster entries. */
export const GREEK_EDGES: readonly Edge[] = [];
