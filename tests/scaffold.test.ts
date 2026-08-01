/**
 * WP-0 smoke tests. Owned by the integrator — work packages should not edit this file.
 * Verifies the frozen contracts hold together and that the fixed timestep advances as specified.
 * These stay green as stubs are replaced; if a WP breaks one, the contract was violated.
 */

import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { SHOWCASE_STAGE } from '../src/data/stages';
import { TICK_DT } from '../src/sim/constants';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import type { DeityIndex } from '../src/sim/types';
import { createWorld, spawnUnit, tickWorld } from '../src/sim/world';

const deities: DeityIndex = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
const graph = buildGraph(GREEK_EDGES);

describe('scaffold', () => {
  it('creates a world with exactly two bases', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    const bases = world.units.filter((u) => u.isBase);
    expect(bases).toHaveLength(2);
    expect(bases.map((b) => b.side).sort()).toEqual(['enemy', 'player']);
  });

  it('advances a player unit by exactly its speed over one simulated second', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    const hoplite = deities.get('hoplite');
    expect(hoplite).toBeDefined();
    if (hoplite === undefined) return;

    const unit = spawnUnit(world, hoplite, 'player');
    const startX = unit.x;
    const rng = createRng(1);

    for (let i = 0; i < 60; i++) tickWorld(world, TICK_DT, graph, deities, rng);

    expect(world.time).toBeCloseTo(1, 5);
    expect(unit.x - startX).toBeCloseTo(hoplite.speed, 5);
  });

  it('is deterministic: identical seeds produce identical state', () => {
    const run = (): string => {
      const world = createWorld(SHOWCASE_STAGE, deities);
      const hoplite = deities.get('hoplite');
      if (hoplite === undefined) throw new Error('missing hoplite');
      spawnUnit(world, hoplite, 'player');
      const rng = createRng(0x5eed);
      for (let i = 0; i < 300; i++) tickWorld(world, TICK_DT, graph, deities, rng);
      return JSON.stringify(world.units.map((u) => [u.id, u.x, u.hp]));
    };
    expect(run()).toEqual(run());
  });

  it('regenerates faith without exceeding the cap', () => {
    const world = createWorld(SHOWCASE_STAGE, deities);
    world.faith = world.faithMax - 1;
    const rng = createRng(1);
    for (let i = 0; i < 120; i++) tickWorld(world, TICK_DT, graph, deities, rng);
    expect(world.faith).toBe(world.faithMax);
  });
});
