/**
 * The relational engine — WP-1.
 *
 * Reads the genealogy graph and returns the modifiers active between two units. This is the whole
 * game concept: a father hesitates against his son, a son fights his father harder, lovers refuse
 * to fight at all. Pure functions only — no state, no randomness, no I/O.
 *
 * Relations resolve ONLY within a pantheon. Fighting cross-pantheon switches the engine off
 * entirely, which is a deliberate strategic choice available to the player.
 */

import { MAX_DAMAGE_MULT, MODIFIER_COLORS } from './constants';
import type {
  BuildGraph,
  Deity,
  DeityId,
  Edge,
  Modifier,
  ModifierName,
  RelationGraph,
  RelationKind,
  ResolveAuras,
  ResolveCombat,
} from './types';

/**
 * Stable output order, most dramatic first. Guarantees determinism and lets the render layer treat
 * element 0 as the dominant modifier when choosing a tint.
 */
const MODIFIER_PRECEDENCE: readonly ModifierName[] = [
  'Entranced',
  'Vengeance',
  'Filicide',
  'Usurpation',
  'Wrath',
  'Defiance',
  'Rivalry',
  'Bound',
  'Reluctance',
  'Jealousy',
  'Resented',
  'Blessed',
  'Devoted',
  'Kinship',
];

/** Non-neutral fields of a modifier; anything omitted defaults to neutral. */
interface ModifierShape {
  damageMult?: number;
  attackSpeedMult?: number;
  armorMult?: number;
  armorPen?: boolean;
  suppress?: boolean;
}

/** The net effect of a set of modifiers, ready for the combat maths to consume. */
export interface CombinedModifiers {
  damageMult: number;
  attackSpeedMult: number;
  armorMult: number;
  armorPen: boolean;
  suppress: boolean;
}

/** Builds a modifier with neutral defaults and the canonical colour for its name. */
function modifier(name: ModifierName, shape: ModifierShape = {}): Modifier {
  return {
    name,
    damageMult: shape.damageMult ?? 1,
    attackSpeedMult: shape.attackSpeedMult ?? 1,
    armorMult: shape.armorMult ?? 1,
    armorPen: shape.armorPen ?? false,
    suppress: shape.suppress ?? false,
    color: MODIFIER_COLORS[name],
  };
}

/** Index key for the unordered pair (a, b). */
function pairKey(a: DeityId, b: DeityId): string {
  return `${a}|${b}`;
}

/** Deduplicates by name and sorts into MODIFIER_PRECEDENCE order. */
function finalize(mods: readonly Modifier[]): Modifier[] {
  const seen = new Map<ModifierName, Modifier>();
  for (const mod of mods) {
    if (!seen.has(mod.name)) seen.set(mod.name, mod);
  }
  return [...seen.values()].sort(
    (a, b) => MODIFIER_PRECEDENCE.indexOf(a.name) - MODIFIER_PRECEDENCE.indexOf(b.name),
  );
}

/** True when `subject` has an edge of `kind` to any same-pantheon member of `others`. */
function relatedByKind(
  subject: Deity,
  others: readonly Deity[],
  kind: RelationKind,
  graph: RelationGraph,
): boolean {
  for (const other of others) {
    if (other.pantheon !== subject.pantheon) continue;
    const edges = graph.byPair.get(pairKey(subject.id, other.id));
    if (edges === undefined) continue;
    for (const edge of edges) {
      if (edge.kind === kind) return true;
    }
  }
  return false;
}

/**
 * Builds the indexed genealogy graph.
 *
 * Each stored edge is indexed under BOTH `from|to` and `to|from`, so a lookup for any pair returns
 * every edge between them regardless of which direction it was authored in. Inverse relations
 * (child, slew, persecuted-by) are therefore derived at resolve time by checking which end of the
 * edge the subject sits on — they are never stored as separate edges, which is why RelationKind has
 * no 'child' member.
 */
export const buildGraph: BuildGraph = (edges) => {
  const byPair = new Map<string, Edge[]>();

  const add = (a: DeityId, b: DeityId, edge: Edge): void => {
    const key = pairKey(a, b);
    const existing = byPair.get(key);
    if (existing === undefined) byPair.set(key, [edge]);
    else existing.push(edge);
  };

  for (const edge of edges) {
    add(edge.from, edge.to, edge);
    if (edge.from !== edge.to) add(edge.to, edge.from, edge);
  }

  return { edges, byPair };
};

/**
 * Modifiers applying to `attacker` when it attacks enemy `defender`.
 *
 * Called for every attacking unit every tick, so the graph lookup is a single O(1) map read.
 */
export const resolveCombat: ResolveCombat = (attacker, defender, graph) => {
  if (attacker.pantheon !== defender.pantheon) return [];

  const edges = graph.byPair.get(pairKey(attacker.id, defender.id));
  if (edges === undefined) return [];

  const found: Modifier[] = [];

  for (const edge of edges) {
    // The edge is stored in one direction only; which end the attacker occupies decides meaning.
    const attackerIsFrom = edge.from === attacker.id;

    switch (edge.kind) {
      case 'parent':
        if (attackerIsFrom) {
          // Cronus does not hesitate; he devours. The trait replaces Reluctance, never stacks with it.
          found.push(
            attacker.traits.includes('devourer')
              ? modifier('Filicide', { damageMult: 1.5 })
              : modifier('Reluctance', { damageMult: 0.6 }),
          );
        } else {
          found.push(modifier('Usurpation', { damageMult: 1.6 }));
        }
        break;

      case 'sibling':
      case 'rival':
        found.push(modifier('Rivalry', { attackSpeedMult: 1.2 }));
        break;

      case 'spouse':
        found.push(modifier('Bound', { damageMult: 0.75, armorMult: 1.25 }));
        break;

      case 'lover':
        found.push(modifier('Entranced', { suppress: true }));
        break;

      case 'slain_by':
        // Stored victim -> killer. Only the victim carries a grudge; the killer gains nothing.
        if (attackerIsFrom) found.push(modifier('Vengeance', { damageMult: 2, armorPen: true }));
        break;

      case 'persecutes':
        found.push(
          attackerIsFrom
            ? modifier('Wrath', { damageMult: 1.5 })
            : modifier('Defiance', { damageMult: 1.3 }),
        );
        break;
    }
  }

  return finalize(found);
};

/**
 * Modifiers applying to `subject` from allies around it.
 *
 * `nearbyAllies` are within AURA_RADIUS; `fieldAllies` is every living ally. Jealousy is the one
 * field-wide effect — it does not care about proximity.
 */
export const resolveAuras: ResolveAuras = (subject, nearbyAllies, fieldAllies, graph) => {
  const found: Modifier[] = [];

  for (const ally of nearbyAllies) {
    if (ally.pantheon !== subject.pantheon) continue;

    const edges = graph.byPair.get(pairKey(subject.id, ally.id));
    if (edges === undefined) continue;

    for (const edge of edges) {
      const allyIsFrom = edge.from === ally.id;

      switch (edge.kind) {
        case 'parent':
          // Only a parent blesses a child, not the reverse.
          if (allyIsFrom) found.push(modifier('Blessed', { damageMult: 1.25 }));
          break;

        case 'sibling':
          found.push(modifier('Kinship', { armorMult: 1.15 }));
          break;

        case 'spouse':
          found.push(modifier('Devoted', { damageMult: 1.1, armorMult: 1.1 }));
          break;

        case 'persecutes':
          if (allyIsFrom) found.push(modifier('Resented', { attackSpeedMult: 0.8 }));
          break;

        case 'lover':
        case 'slain_by':
        case 'rival':
          break;
      }
    }
  }

  // The unfaithful party is the one penalised, and only when spouse and lover are both fielded.
  if (
    relatedByKind(subject, fieldAllies, 'spouse', graph) &&
    relatedByKind(subject, fieldAllies, 'lover', graph)
  ) {
    found.push(modifier('Jealousy', { attackSpeedMult: 0.7 }));
  }

  return finalize(found);
};

/**
 * Folds modifiers into their net effect. Multipliers combine multiplicatively; damage is capped at
 * MAX_DAMAGE_MULT so stacked relations cannot go degenerate. Flags are logical ORs.
 */
export function combineModifiers(mods: readonly Modifier[]): CombinedModifiers {
  let damageMult = 1;
  let attackSpeedMult = 1;
  let armorMult = 1;
  let armorPen = false;
  let suppress = false;

  for (const mod of mods) {
    damageMult *= mod.damageMult;
    attackSpeedMult *= mod.attackSpeedMult;
    armorMult *= mod.armorMult;
    armorPen = armorPen || mod.armorPen;
    suppress = suppress || mod.suppress;
  }

  return {
    damageMult: Math.min(damageMult, MAX_DAMAGE_MULT),
    attackSpeedMult,
    armorMult,
    armorPen,
    suppress,
  };
}
