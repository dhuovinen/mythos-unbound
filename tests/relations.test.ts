/**
 * WP-1 tests — the relational engine.
 *
 * Fixtures are built in-file on purpose: src/data/greek.ts is authored by a different work package
 * and these tests must not depend on it.
 */

import { describe, expect, it } from 'vitest';
import { MAX_DAMAGE_MULT, MODIFIER_COLORS } from '../src/sim/constants';
import { buildGraph, combineModifiers, resolveAuras, resolveCombat } from '../src/sim/relations';
import type { Deity, Edge, Modifier, ModifierName } from '../src/sim/types';

function deity(id: string, over: Partial<Deity> = {}): Deity {
  return {
    id,
    name: id,
    pantheon: 'greek',
    tier: 'god',
    cost: 100,
    hp: 100,
    damage: 10,
    attackInterval: 1,
    range: 30,
    speed: 30,
    armor: 5,
    traits: [],
    ...over,
  };
}

const cronus = deity('cronus', { tier: 'titan', traits: ['devourer'] });
const rhea = deity('rhea', { tier: 'titan' }); // a parent WITHOUT the devourer trait
const zeus = deity('zeus');
const hera = deity('hera');
const poseidon = deity('poseidon');
const ares = deity('ares');
const aphrodite = deity('aphrodite');
const hephaestus = deity('hephaestus');
const heracles = deity('heracles', { tier: 'demigod' });
const asclepius = deity('asclepius', { tier: 'demigod' });
const typhon = deity('typhon', { tier: 'titan' });
const hoplite = deity('hoplite', { tier: 'chaff' });
const odin = deity('odin', { pantheon: 'norse' });

const EDGES: readonly Edge[] = [
  { from: 'cronus', to: 'zeus', kind: 'parent' },
  { from: 'rhea', to: 'zeus', kind: 'parent' },
  { from: 'zeus', to: 'ares', kind: 'parent' },
  { from: 'zeus', to: 'poseidon', kind: 'sibling' },
  { from: 'zeus', to: 'hera', kind: 'spouse' },
  { from: 'ares', to: 'aphrodite', kind: 'lover' },
  { from: 'aphrodite', to: 'hephaestus', kind: 'spouse' },
  { from: 'asclepius', to: 'zeus', kind: 'slain_by' },
  { from: 'hera', to: 'heracles', kind: 'persecutes' },
  { from: 'zeus', to: 'typhon', kind: 'rival' },
  // cross-pantheon edge: must never resolve
  { from: 'zeus', to: 'odin', kind: 'rival' },
];

const graph = buildGraph(EDGES);

const names = (mods: readonly Modifier[]): ModifierName[] => mods.map((m) => m.name);
const pick = (mods: readonly Modifier[], name: ModifierName): Modifier | undefined =>
  mods.find((m) => m.name === name);

describe('buildGraph', () => {
  it('indexes every edge in both directions', () => {
    expect(graph.byPair.get('cronus|zeus')).toHaveLength(1);
    expect(graph.byPair.get('zeus|cronus')).toHaveLength(1);
  });

  it('preserves the original edge list', () => {
    expect(graph.edges).toEqual(EDGES);
  });
});

describe('resolveCombat — combat table', () => {
  it('Reluctance: a parent without devourer holds back', () => {
    const mods = resolveCombat(rhea, zeus, graph);
    expect(names(mods)).toEqual(['Reluctance']);
    expect(pick(mods, 'Reluctance')?.damageMult).toBe(0.6);
  });

  it('Filicide: devourer replaces Reluctance rather than stacking with it', () => {
    const mods = resolveCombat(cronus, zeus, graph);
    expect(names(mods)).toEqual(['Filicide']);
    expect(names(mods)).not.toContain('Reluctance');
    expect(pick(mods, 'Filicide')?.damageMult).toBe(1.5);
  });

  it('Usurpation: the child strikes back harder (derived inverse of a stored parent edge)', () => {
    const mods = resolveCombat(zeus, cronus, graph);
    expect(names(mods)).toEqual(['Usurpation']);
    expect(pick(mods, 'Usurpation')?.damageMult).toBe(1.6);
  });

  it('Rivalry: siblings', () => {
    const mods = resolveCombat(zeus, poseidon, graph);
    expect(names(mods)).toEqual(['Rivalry']);
    expect(pick(mods, 'Rivalry')?.attackSpeedMult).toBe(1.2);
  });

  it('Rivalry: rivals map to the same modifier as siblings', () => {
    expect(names(resolveCombat(zeus, typhon, graph))).toEqual(['Rivalry']);
    expect(names(resolveCombat(typhon, zeus, graph))).toEqual(['Rivalry']);
  });

  it('Entranced: lovers will not fight, in either direction', () => {
    for (const mods of [resolveCombat(ares, aphrodite, graph), resolveCombat(aphrodite, ares, graph)]) {
      expect(names(mods)).toEqual(['Entranced']);
      expect(pick(mods, 'Entranced')?.suppress).toBe(true);
    }
  });

  it('Vengeance: only the victim carries the grudge, and it pierces armour', () => {
    const mods = resolveCombat(asclepius, zeus, graph);
    expect(names(mods)).toEqual(['Vengeance']);
    expect(pick(mods, 'Vengeance')?.damageMult).toBe(2);
    expect(pick(mods, 'Vengeance')?.armorPen).toBe(true);

    // the killer gains nothing from having killed
    expect(resolveCombat(zeus, asclepius, graph)).toEqual([]);
  });

  it('Bound: spouses pull their punches but guard each other, symmetrically', () => {
    for (const mods of [resolveCombat(zeus, hera, graph), resolveCombat(hera, zeus, graph)]) {
      expect(names(mods)).toEqual(['Bound']);
      expect(pick(mods, 'Bound')?.damageMult).toBe(0.75);
      expect(pick(mods, 'Bound')?.armorMult).toBe(1.25);
    }
  });

  it('Wrath and Defiance: persecution cuts both ways, asymmetrically', () => {
    const wrath = resolveCombat(hera, heracles, graph);
    expect(names(wrath)).toEqual(['Wrath']);
    expect(pick(wrath, 'Wrath')?.damageMult).toBe(1.5);

    const defiance = resolveCombat(heracles, hera, graph);
    expect(names(defiance)).toEqual(['Defiance']);
    expect(pick(defiance, 'Defiance')?.damageMult).toBe(1.3);
  });
});

describe('resolveCombat — rules', () => {
  it('returns nothing across pantheons, even when an edge exists', () => {
    expect(resolveCombat(zeus, odin, graph)).toEqual([]);
    expect(resolveCombat(odin, zeus, graph)).toEqual([]);
  });

  it('returns nothing for unrelated units', () => {
    expect(resolveCombat(hoplite, zeus, graph)).toEqual([]);
    expect(resolveCombat(zeus, hoplite, graph)).toEqual([]);
  });

  it('stacks multiple relations between the same pair', () => {
    // Zeus is both spouse and sibling to Hera in the real roster.
    const stacked = buildGraph([
      { from: 'zeus', to: 'hera', kind: 'spouse' },
      { from: 'zeus', to: 'hera', kind: 'sibling' },
    ]);
    expect(names(resolveCombat(zeus, hera, stacked)).sort()).toEqual(['Bound', 'Rivalry']);
  });

  it('is deterministic: repeated calls return identical results', () => {
    const a = resolveCombat(cronus, zeus, graph);
    const b = resolveCombat(cronus, zeus, graph);
    expect(a).toEqual(b);
  });

  it('colours every modifier from the canonical table', () => {
    const all = [
      ...resolveCombat(cronus, zeus, graph),
      ...resolveCombat(zeus, cronus, graph),
      ...resolveCombat(rhea, zeus, graph),
      ...resolveCombat(zeus, poseidon, graph),
      ...resolveCombat(ares, aphrodite, graph),
      ...resolveCombat(asclepius, zeus, graph),
      ...resolveCombat(zeus, hera, graph),
      ...resolveCombat(hera, heracles, graph),
      ...resolveCombat(heracles, hera, graph),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const mod of all) expect(mod.color).toBe(MODIFIER_COLORS[mod.name]);
  });
});

describe('resolveAuras', () => {
  it('Blessed: a nearby parent buffs the child, but not the reverse', () => {
    const blessed = resolveAuras(ares, [zeus], [ares, zeus], graph);
    expect(names(blessed)).toEqual(['Blessed']);
    expect(pick(blessed, 'Blessed')?.damageMult).toBe(1.25);

    expect(resolveAuras(zeus, [ares], [zeus, ares], graph)).toEqual([]);
  });

  it('Kinship: nearby siblings harden each other', () => {
    const mods = resolveAuras(zeus, [poseidon], [zeus, poseidon], graph);
    expect(names(mods)).toEqual(['Kinship']);
    expect(pick(mods, 'Kinship')?.armorMult).toBe(1.15);
  });

  it('Devoted: nearby spouses reinforce each other', () => {
    const mods = resolveAuras(zeus, [hera], [zeus, hera], graph);
    expect(names(mods)).toContain('Devoted');
    expect(pick(mods, 'Devoted')?.damageMult).toBe(1.1);
  });

  it('Resented: a nearby persecutor slows the victim', () => {
    const mods = resolveAuras(heracles, [hera], [heracles, hera], graph);
    expect(names(mods)).toEqual(['Resented']);
    expect(pick(mods, 'Resented')?.attackSpeedMult).toBe(0.8);
  });

  it('dedupes: two nearby siblings yield exactly one Kinship', () => {
    const many = buildGraph([
      { from: 'zeus', to: 'poseidon', kind: 'sibling' },
      { from: 'zeus', to: 'hera', kind: 'sibling' },
    ]);
    const mods = resolveAuras(zeus, [poseidon, hera], [zeus, poseidon, hera], many);
    expect(names(mods)).toEqual(['Kinship']);
  });

  it('ignores allies from another pantheon', () => {
    expect(resolveAuras(zeus, [odin], [zeus, odin], graph)).toEqual([]);
  });

  it('Jealousy: penalises the unfaithful unit when spouse AND lover are both fielded', () => {
    const field = [aphrodite, hephaestus, ares];
    const mods = resolveAuras(aphrodite, [], field, graph);
    expect(names(mods)).toEqual(['Jealousy']);
    expect(pick(mods, 'Jealousy')?.attackSpeedMult).toBe(0.7);
  });

  it('Jealousy: does not fire with only the spouse present', () => {
    expect(resolveAuras(aphrodite, [], [aphrodite, hephaestus], graph)).toEqual([]);
  });

  it('Jealousy: does not fire with only the lover present', () => {
    expect(resolveAuras(aphrodite, [], [aphrodite, ares], graph)).toEqual([]);
  });

  it('Jealousy is field-wide, not proximity-based', () => {
    // empty nearbyAllies, yet it still fires from the field list
    const mods = resolveAuras(aphrodite, [], [aphrodite, hephaestus, ares], graph);
    expect(names(mods)).toContain('Jealousy');
  });
});

describe('combineModifiers', () => {
  it('is neutral for an empty set', () => {
    expect(combineModifiers([])).toEqual({
      damageMult: 1,
      attackSpeedMult: 1,
      armorMult: 1,
      armorPen: false,
      suppress: false,
    });
  });

  it('multiplies damage across modifiers', () => {
    const mods = [...resolveCombat(zeus, cronus, graph), ...resolveAuras(ares, [zeus], [ares, zeus], graph)];
    // Usurpation 1.6 x Blessed 1.25 = 2.0
    expect(combineModifiers(mods).damageMult).toBeCloseTo(2, 10);
  });

  it('clamps damage at MAX_DAMAGE_MULT', () => {
    const huge: Modifier[] = [
      { name: 'Vengeance', damageMult: 2, attackSpeedMult: 1, armorMult: 1, armorPen: true, suppress: false, color: '#000' },
      { name: 'Usurpation', damageMult: 1.6, attackSpeedMult: 1, armorMult: 1, armorPen: false, suppress: false, color: '#000' },
      { name: 'Wrath', damageMult: 1.5, attackSpeedMult: 1, armorMult: 1, armorPen: false, suppress: false, color: '#000' },
    ];
    // 2 x 1.6 x 1.5 = 4.8, clamped
    expect(combineModifiers(huge).damageMult).toBe(MAX_DAMAGE_MULT);
  });

  it('ORs the boolean flags', () => {
    const mods = [
      ...resolveCombat(asclepius, zeus, graph), // armorPen
      ...resolveCombat(ares, aphrodite, graph), // suppress
    ];
    const combined = combineModifiers(mods);
    expect(combined.armorPen).toBe(true);
    expect(combined.suppress).toBe(true);
  });
});
