/**
 * STUB — owned by WP-1. Replace this file wholesale.
 *
 * Returning no modifiers is the correct baseline: with this stub the game plays as a plain
 * lane battler, which is exactly what WP-2 should be able to test against.
 */

import type { BuildGraph, ResolveAuras, ResolveCombat } from './types';

/** Builds the indexed genealogy graph, including derived inverse edges. */
export const buildGraph: BuildGraph = (edges) => ({ edges, byPair: new Map() });

/** Modifiers applying to `attacker` when it attacks enemy `defender`. */
export const resolveCombat: ResolveCombat = () => [];

/** Modifiers applying to `subject` from surrounding allies. */
export const resolveAuras: ResolveAuras = () => [];
