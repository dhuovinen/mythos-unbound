/**
 * Egyptian pantheon roster and genealogy graph.
 *
 * Each pantheon is shaped by a different kind of family violence, and that is what makes them play
 * differently. Greek turns on filicide — a father who eats his children. Norse is mutual
 * destruction, pairs killing each other simultaneously at the end of the world. Egyptian is
 * **fratricide and revenge across a generation**: Set murders his brother Osiris, Isis restores
 * him, and their son Horus spends eighty years contending with his uncle for the throne.
 *
 * That makes the Osiris family the densest single cluster in the game — six figures bound as
 * siblings, spouses, parents and killer at once. It is the clearest example of the trade the deck
 * builder describes: enormous synergy, and an enormous surface for an opponent to attack.
 *
 * Like Norse, Egyptian has no `devourer`. Ammit devours the unworthy dead, not her own children,
 * so Reluctance applies normally here too — Cronus remains unique in the game.
 */

import type { Deity, Edge } from '../sim/types';

/** Full Egyptian roster. */
export const EGYPTIAN_DEITIES: readonly Deity[] = [
  // Tier 0 — chaff (zero relations)
  { id: 'medjay', name: 'Medjay', pantheon: 'egyptian', tier: 'chaff', cost: 30, hp: 115, damage: 14, attackInterval: 1.0, range: 32, speed: 48, armor: 2, traits: [] },
  { id: 'shabti', name: 'Shabti', pantheon: 'egyptian', tier: 'chaff', cost: 26, hp: 140, damage: 8, attackInterval: 1.2, range: 26, speed: 32, armor: 3, traits: [] },
  { id: 'ba', name: 'Ba', pantheon: 'egyptian', tier: 'chaff', cost: 42, hp: 85, damage: 19, attackInterval: 0.85, range: 34, speed: 62, armor: 0, traits: [] },

  // Tier 1 — lesser gods and deified mortals
  { id: 'anubis', name: 'Anubis', pantheon: 'egyptian', tier: 'demigod', cost: 125, hp: 520, damage: 52, attackInterval: 1.1, range: 32, speed: 40, armor: 8, traits: [] },
  { id: 'wepwawet', name: 'Wepwawet', pantheon: 'egyptian', tier: 'demigod', cost: 100, hp: 420, damage: 48, attackInterval: 1.0, range: 30, speed: 50, armor: 5, traits: [] },
  { id: 'imhotep', name: 'Imhotep', pantheon: 'egyptian', tier: 'demigod', cost: 85, hp: 340, damage: 24, attackInterval: 1.5, range: 50, speed: 32, armor: 4, traits: ['healer'] },
  { id: 'nefertem', name: 'Nefertem', pantheon: 'egyptian', tier: 'demigod', cost: 95, hp: 380, damage: 40, attackInterval: 1.3, range: 44, speed: 36, armor: 5, traits: ['charmer'] },
  { id: 'maahes', name: 'Maahes', pantheon: 'egyptian', tier: 'demigod', cost: 135, hp: 470, damage: 62, attackInterval: 1.0, range: 30, speed: 46, armor: 6, traits: [] },
  { id: 'bes', name: 'Bes', pantheon: 'egyptian', tier: 'demigod', cost: 110, hp: 580, damage: 30, attackInterval: 1.4, range: 28, speed: 30, armor: 10, traits: ['shielder'] },
  { id: 'khonsu', name: 'Khonsu', pantheon: 'egyptian', tier: 'demigod', cost: 120, hp: 400, damage: 55, attackInterval: 1.2, range: 58, speed: 38, armor: 4, traits: [] },

  // Tier 2 — the great gods
  { id: 'ra', name: 'Ra', pantheon: 'egyptian', tier: 'god', cost: 385, hp: 1080, damage: 142, attackInterval: 1.5, range: 62, speed: 28, armor: 12, traits: [] },
  { id: 'osiris', name: 'Osiris', pantheon: 'egyptian', tier: 'god', cost: 340, hp: 1250, damage: 104, attackInterval: 1.7, range: 38, speed: 24, armor: 16, traits: [] },
  { id: 'isis', name: 'Isis', pantheon: 'egyptian', tier: 'god', cost: 315, hp: 900, damage: 88, attackInterval: 1.6, range: 64, speed: 30, armor: 10, traits: ['healer'] },
  { id: 'set', name: 'Set', pantheon: 'egyptian', tier: 'god', cost: 355, hp: 1000, damage: 148, attackInterval: 1.4, range: 36, speed: 36, armor: 9, traits: [] },
  { id: 'horus', name: 'Horus', pantheon: 'egyptian', tier: 'god', cost: 345, hp: 1020, damage: 128, attackInterval: 1.4, range: 48, speed: 34, armor: 13, traits: [] },
  { id: 'nephthys', name: 'Nephthys', pantheon: 'egyptian', tier: 'god', cost: 270, hp: 860, damage: 78, attackInterval: 1.6, range: 54, speed: 30, armor: 11, traits: ['healer'] },
  { id: 'thoth', name: 'Thoth', pantheon: 'egyptian', tier: 'god', cost: 300, hp: 880, damage: 96, attackInterval: 1.5, range: 72, speed: 29, armor: 10, traits: ['healer'] },
  { id: 'hathor', name: 'Hathor', pantheon: 'egyptian', tier: 'god', cost: 285, hp: 940, damage: 84, attackInterval: 1.6, range: 46, speed: 31, armor: 12, traits: ['charmer'] },
  { id: 'sekhmet', name: 'Sekhmet', pantheon: 'egyptian', tier: 'god', cost: 370, hp: 950, damage: 155, attackInterval: 1.3, range: 34, speed: 35, armor: 8, traits: [] },
  { id: 'ptah', name: 'Ptah', pantheon: 'egyptian', tier: 'god', cost: 295, hp: 1180, damage: 90, attackInterval: 1.9, range: 36, speed: 23, armor: 18, traits: ['shielder'] },

  // Tier 3 — the devourers
  { id: 'apep', name: 'Apep', pantheon: 'egyptian', tier: 'titan', cost: 610, hp: 2800, damage: 245, attackInterval: 2.4, range: 52, speed: 20, armor: 22, traits: [] },
  { id: 'ammit', name: 'Ammit', pantheon: 'egyptian', tier: 'titan', cost: 575, hp: 2500, damage: 260, attackInterval: 2.2, range: 40, speed: 24, armor: 20, traits: [] },
];

/**
 * Genealogy edges. `parent` is parent -> child, `slain_by` is victim -> killer, `persecutes` is
 * persecutor -> victim. Symmetric kinds are stored once.
 */
export const EGYPTIAN_EDGES: readonly Edge[] = [
  // The Osiris family — four siblings, two marriages inside it, and one murder.
  { from: 'osiris', to: 'isis', kind: 'sibling' },
  { from: 'osiris', to: 'set', kind: 'sibling' },
  { from: 'osiris', to: 'nephthys', kind: 'sibling' },
  { from: 'isis', to: 'set', kind: 'sibling' },
  { from: 'isis', to: 'nephthys', kind: 'sibling' },
  { from: 'set', to: 'nephthys', kind: 'sibling' },
  { from: 'osiris', to: 'isis', kind: 'spouse' },
  { from: 'set', to: 'nephthys', kind: 'spouse' },
  // The murder the whole pantheon turns on.
  { from: 'osiris', to: 'set', kind: 'slain_by' },

  // The next generation, and the eighty-year contest for the throne.
  { from: 'osiris', to: 'horus', kind: 'parent' },
  { from: 'isis', to: 'horus', kind: 'parent' },
  { from: 'nephthys', to: 'anubis', kind: 'parent' },
  { from: 'osiris', to: 'anubis', kind: 'parent' },
  { from: 'set', to: 'horus', kind: 'persecutes' },
  { from: 'horus', to: 'set', kind: 'rival' },
  { from: 'anubis', to: 'wepwawet', kind: 'sibling' },

  // Ra's line. Sekhmet and Hathor are the same Eye in two moods, which is closer to sibling
  // than to anything else the schema offers.
  { from: 'ra', to: 'sekhmet', kind: 'parent' },
  { from: 'ra', to: 'hathor', kind: 'parent' },
  { from: 'ra', to: 'thoth', kind: 'parent' },
  { from: 'sekhmet', to: 'hathor', kind: 'sibling' },
  { from: 'ra', to: 'osiris', kind: 'parent' },

  // Ptah's household.
  { from: 'ptah', to: 'sekhmet', kind: 'spouse' },
  { from: 'ptah', to: 'nefertem', kind: 'parent' },
  { from: 'sekhmet', to: 'nefertem', kind: 'parent' },
  { from: 'ptah', to: 'maahes', kind: 'parent' },
  { from: 'sekhmet', to: 'maahes', kind: 'parent' },
  { from: 'nefertem', to: 'maahes', kind: 'sibling' },
  { from: 'ptah', to: 'imhotep', kind: 'parent' },

  // Chaos, and the things that hold it back.
  { from: 'ra', to: 'apep', kind: 'rival' },
  { from: 'set', to: 'apep', kind: 'rival' },
  { from: 'apep', to: 'ammit', kind: 'sibling' },
  { from: 'thoth', to: 'apep', kind: 'rival' },
  { from: 'anubis', to: 'ammit', kind: 'rival' },
  { from: 'thoth', to: 'ammit', kind: 'rival' },
  { from: 'khonsu', to: 'thoth', kind: 'rival' },
  { from: 'isis', to: 'set', kind: 'persecutes' },
  { from: 'hathor', to: 'sekhmet', kind: 'rival' },
];
