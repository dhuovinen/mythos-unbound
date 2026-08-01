/**
 * Combat unit tests for WP-2.
 *
 * Verifies targeting, movement halting, cooldown handling, armor reduction, minimum damage, unit death,
 * base destruction victory/defeat outcomes, relational suppression, and deterministic execution.
 */

import { describe, expect, it } from 'vitest';
import { ENEMY_BASE_X, PLAYER_BASE_X, TICK_DT } from '../src/sim/constants';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import type { Deity, DeityIndex, Edge, Stage } from '../src/sim/types';
import { createWorld, spawnUnit, tickWorld } from '../src/sim/world';

const TEST_ATTACKER: Deity = {
  id: 'test-attacker',
  name: 'Attacker',
  pantheon: 'greek',
  tier: 'chaff',
  cost: 10,
  hp: 100,
  damage: 20,
  attackInterval: 1.0,
  range: 50,
  speed: 10,
  armor: 0,
  traits: [],
};

const TEST_DEFENDER: Deity = {
  id: 'test-defender',
  name: 'Defender',
  pantheon: 'greek',
  tier: 'chaff',
  cost: 10,
  hp: 100,
  damage: 5,
  attackInterval: 2.0,
  range: 30,
  speed: 10,
  armor: 10,
  traits: [],
};

const TEST_HIGH_ARMOR: Deity = {
  id: 'test-high-armor',
  name: 'High Armor',
  pantheon: 'greek',
  tier: 'god',
  cost: 50,
  hp: 100,
  damage: 5,
  attackInterval: 2.0,
  range: 30,
  speed: 10,
  armor: 500,
  traits: [],
};

const TEST_LOVER_A: Deity = {
  id: 'lover-a',
  name: 'Lover A',
  pantheon: 'greek',
  tier: 'god',
  cost: 20,
  hp: 100,
  damage: 30,
  attackInterval: 1.0,
  range: 50,
  speed: 10,
  armor: 0,
  traits: [],
};

const TEST_LOVER_B: Deity = {
  id: 'lover-b',
  name: 'Lover B',
  pantheon: 'greek',
  tier: 'god',
  cost: 20,
  hp: 100,
  damage: 30,
  attackInterval: 1.0,
  range: 50,
  speed: 10,
  armor: 0,
  traits: [],
};

const TEST_STAGE: Stage = {
  id: 'test-stage',
  name: 'Test Stage',
  playerDeck: ['test-attacker'],
  waves: [],
  startingFaith: 100,
  faithMax: 200,
  faithRegen: 5,
  playerBaseHp: 500,
  enemyBaseHp: 500,
};

const deities: DeityIndex = new Map([
  [TEST_ATTACKER.id, TEST_ATTACKER],
  [TEST_DEFENDER.id, TEST_DEFENDER],
  [TEST_HIGH_ARMOR.id, TEST_HIGH_ARMOR],
  [TEST_LOVER_A.id, TEST_LOVER_A],
  [TEST_LOVER_B.id, TEST_LOVER_B],
]);

const emptyGraph = buildGraph([]);

const loverEdges: readonly Edge[] = [{ from: 'lover-a', to: 'lover-b', kind: 'lover' }];
const loverGraph = buildGraph(loverEdges);

describe('combat simulation (WP-2)', () => {
  it('stops and attacks when a target is in range', () => {
    const world = createWorld(TEST_STAGE, deities);
    const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
    const defender = spawnUnit(world, TEST_DEFENDER, 'enemy');

    attacker.x = 100;
    defender.x = 140;

    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(attacker.x).toBe(100);
    expect(attacker.targetId).toBe(defender.id);
    expect(defender.hp).toBe(90);

    const hitEvents = world.events.filter((e) => e.kind === 'hit');
    expect(hitEvents).toHaveLength(1);
  });

  it('reduces damage by defender armor', () => {
    const world = createWorld(TEST_STAGE, deities);
    const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
    const defender = spawnUnit(world, TEST_DEFENDER, 'enemy');

    attacker.x = 100;
    defender.x = 130;

    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(defender.hp).toBe(90);
  });

  it('deals minimum 1 damage against extremely high armor', () => {
    const world = createWorld(TEST_STAGE, deities);
    const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
    const defender = spawnUnit(world, TEST_HIGH_ARMOR, 'enemy');

    attacker.x = 100;
    defender.x = 130;

    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(defender.hp).toBe(99);
  });

  it('respects attackInterval cooldown before attacking again', () => {
    const world = createWorld(TEST_STAGE, deities);
    const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
    const defender = spawnUnit(world, TEST_DEFENDER, 'enemy');

    attacker.x = 100;
    defender.x = 130;

    const rng = createRng(1);

    tickWorld(world, TICK_DT, emptyGraph, deities, rng);
    expect(defender.hp).toBe(90);

    for (let i = 0; i < 30; i++) {
      tickWorld(world, TICK_DT, emptyGraph, deities, rng);
    }
    expect(defender.hp).toBe(90);

    for (let i = 0; i < 30; i++) {
      tickWorld(world, TICK_DT, emptyGraph, deities, rng);
    }
    expect(defender.hp).toBe(80);
  });

  it('removes dead non-base units and emits death event exactly once', () => {
    const world = createWorld(TEST_STAGE, deities);
    const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
    const defender = spawnUnit(world, TEST_DEFENDER, 'enemy');

    attacker.x = 100;
    defender.x = 130;
    defender.hp = 5;

    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(defender.hp).toBeLessThanOrEqual(0);
    const deadUnits = world.units.filter((u) => u.id === defender.id);
    expect(deadUnits).toHaveLength(0);

    const deathEvents = world.events.filter((e) => e.kind === 'death');
    expect(deathEvents).toHaveLength(1);
    expect(deathEvents[0]).toEqual({ kind: 'death', unitId: defender.id });
  });

  it('sets outcome to victory when enemy base hp reaches 0', () => {
    const world = createWorld(TEST_STAGE, deities);
    const enemyBase = world.units.find((u) => u.isBase && u.side === 'enemy');
    expect(enemyBase).toBeDefined();
    if (enemyBase === undefined) return;

    enemyBase.hp = 0;
    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(world.outcome).toBe('victory');

    const prevTime = world.time;
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);
    expect(world.time).toBe(prevTime);
  });

  it('sets outcome to defeat when player base hp reaches 0', () => {
    const world = createWorld(TEST_STAGE, deities);
    const playerBase = world.units.find((u) => u.isBase && u.side === 'player');
    expect(playerBase).toBeDefined();
    if (playerBase === undefined) return;

    playerBase.hp = 0;
    const rng = createRng(1);
    tickWorld(world, TICK_DT, emptyGraph, deities, rng);

    expect(world.outcome).toBe('defeat');
  });

  it('prevents a suppressed (entranced) attacker from moving or attacking', () => {
    const world = createWorld(TEST_STAGE, deities);
    const loverA = spawnUnit(world, TEST_LOVER_A, 'player');
    const loverB = spawnUnit(world, TEST_LOVER_B, 'enemy');

    loverA.x = 100;
    loverB.x = 130;

    const rng = createRng(1);
    tickWorld(world, TICK_DT, loverGraph, deities, rng);

    expect(loverA.x).toBe(100);
    expect(loverB.hp).toBe(100);
    // The attack is prevented, but it is still reported with damage 0 so the render layer can
    // announce Entranced. Silence here would make the engine's most dramatic state invisible.
    const hitEvents = world.events.filter((e) => e.kind === 'hit');
    // Both lovers attempt and are both suppressed, so expect a report per side.
    expect(hitEvents.length).toBeGreaterThan(0);
    for (const hit of hitEvents) {
      if (hit.kind !== 'hit') continue;
      expect(hit.damage).toBe(0);
      expect(hit.modifiers).toContain('Entranced');
    }
  });

  it('is deterministic: identical seeds and inputs produce byte-identical state', () => {
    const run = (): string => {
      const world = createWorld(TEST_STAGE, deities);
      const attacker = spawnUnit(world, TEST_ATTACKER, 'player');
      const defender = spawnUnit(world, TEST_DEFENDER, 'enemy');
      attacker.x = PLAYER_BASE_X;
      defender.x = ENEMY_BASE_X;

      const rng = createRng(0xcafe);
      for (let i = 0; i < 300; i++) {
        tickWorld(world, TICK_DT, emptyGraph, deities, rng);
      }
      return JSON.stringify({
        time: world.time,
        units: world.units.map((u) => [u.id, u.x, u.hp, u.cooldown, u.targetId]),
        events: world.events,
      });
    };

    expect(run()).toEqual(run());
  });
});
