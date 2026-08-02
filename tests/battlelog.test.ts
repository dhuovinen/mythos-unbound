/**
 * Tests for the post-match battle log.
 *
 * The swing figure is the report's central claim — "relations were worth this much" — so the
 * arithmetic behind it is worth pinning down precisely.
 */

import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import {
  createBattleLog,
  noteDeployment,
  recordEvents,
  summarise,
} from '../src/sim/battlelog';
import { TICK_DT } from '../src/sim/constants';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import type { DeityIndex, SimEvent, Stage } from '../src/sim/types';
import { createWorld, spawnUnit, tickWorld } from '../src/sim/world';

const roster: DeityIndex = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
const graph = buildGraph(GREEK_EDGES);

const hit = (over: Partial<Extract<SimEvent, { kind: 'hit' }>> = {}): SimEvent => ({
  kind: 'hit',
  attackerId: 1,
  defenderId: 2,
  damage: 150,
  baseDamage: 100,
  modifiers: ['Filicide'],
  ...over,
});

describe('recording', () => {
  it('stores the swing as dealt minus what it would have been without relations', () => {
    const log = createBattleLog();
    recordEvents(log, [hit()], 12.5);
    const entry = log.entries[0];
    expect(entry?.swing).toBe(50);
    expect(entry?.time).toBe(12.5);
  });

  it('records a negative swing when a relation held the attacker back', () => {
    const log = createBattleLog();
    recordEvents(log, [hit({ damage: 60, baseDamage: 100, modifiers: ['Reluctance'] })], 1);
    expect(log.entries[0]?.swing).toBe(-40);
  });

  it('treats a refused attack as forfeiting its entire base value', () => {
    const log = createBattleLog();
    recordEvents(log, [hit({ damage: 0, baseDamage: 90, modifiers: ['Entranced'] })], 1);
    expect(log.entries[0]?.prevented).toBe(true);
    expect(log.entries[0]?.swing).toBe(-90);
  });

  it('ignores non-hit events', () => {
    const log = createBattleLog();
    recordEvents(log, [{ kind: 'death', unitId: 1 }, { kind: 'spawn', unitId: 2 }], 1);
    expect(log.entries).toHaveLength(0);
  });

  it('counts repeat summons of the same unit and accumulates their cost', () => {
    const log = createBattleLog();
    noteDeployment(log, 1, 'hoplite', 'player', 30);
    noteDeployment(log, 2, 'hoplite', 'player', 30);
    noteDeployment(log, 3, 'hoplite', 'enemy', 30);
    const deployment = log.deployments.get('player|hoplite');
    expect(deployment?.count).toBe(2);
    expect(deployment?.totalCost).toBe(60);
    // Sides are tracked separately — the same unit on both sides is not one entry.
    expect(log.deployments.get('enemy|hoplite')?.count).toBe(1);
  });
});

describe('summarising', () => {
  it('attributes swing to the attacking side', () => {
    const log = createBattleLog();
    noteDeployment(log, 1, 'cronus', 'enemy', 600);
    noteDeployment(log, 2, 'zeus', 'player', 380);
    recordEvents(log, [hit({ attackerId: 1, defenderId: 2 })], 1);

    const summary = summarise(log, roster);
    expect(summary.swingBySide.enemy).toBe(50);
    expect(summary.swingBySide.player).toBe(0);
  });

  it('splits swing evenly when several relations fired on one blow, so nothing double counts', () => {
    const log = createBattleLog();
    noteDeployment(log, 1, 'zeus', 'player', 380);
    recordEvents(log, [hit({ modifiers: ['Usurpation', 'Blessed'], damage: 160, baseDamage: 100 })], 1);

    const summary = summarise(log, roster);
    // One blow worth +60 across two modifiers: +30 each, and the side total is still +60.
    expect(summary.tallies.map((t) => t.swing)).toEqual([30, 30]);
    expect(summary.swingBySide.player).toBe(60);
  });

  it('separates attacks that had a relation from those that did not', () => {
    const log = createBattleLog();
    noteDeployment(log, 1, 'hoplite', 'player', 30);
    recordEvents(log, [hit({ modifiers: [] }), hit()], 1);

    const summary = summarise(log, roster);
    expect(summary.totalAttacks).toBe(2);
    expect(summary.relationalAttacks).toBe(1);
  });

  it('ranks the relationships that swung the battle most, regardless of direction', () => {
    const log = createBattleLog();
    noteDeployment(log, 1, 'zeus', 'player', 380);
    recordEvents(
      log,
      [
        hit({ modifiers: ['Reluctance'], damage: 20, baseDamage: 100 }),
        hit({ modifiers: ['Rivalry'], damage: 110, baseDamage: 100 }),
      ],
      1,
    );
    const summary = summarise(log, roster);
    // Reluctance cost 80; Rivalry gained 10. The bigger effect ranks first even though it is negative.
    expect(summary.tallies[0]?.modifier).toBe('Reluctance');
  });

  it('drops attacks from units it never saw deployed rather than guessing a side', () => {
    const log = createBattleLog();
    recordEvents(log, [hit({ attackerId: 99 })], 1);
    const summary = summarise(log, roster);
    expect(summary.swingBySide.player).toBe(0);
    expect(summary.swingBySide.enemy).toBe(0);
  });
});

describe('against a real battle', () => {
  const STAGE: Stage = {
    id: 'log',
    name: 'Log',
    playerDeck: ['zeus'],
    waves: [],
    startingFaith: 0,
    faithMax: 1000,
    faithRegen: 0,
    playerBaseHp: 100000,
    enemyBaseHp: 100000,
  };

  it('captures Filicide and Usurpation with the swing each was actually worth', () => {
    const log = createBattleLog();
    const world = createWorld(STAGE, roster);
    const zeus = roster.get('zeus');
    const cronus = roster.get('cronus');
    expect(zeus).toBeDefined();
    expect(cronus).toBeDefined();
    if (zeus === undefined || cronus === undefined) return;

    const zeusUnit = spawnUnit(world, zeus, 'player');
    const cronusUnit = spawnUnit(world, cronus, 'enemy');
    noteDeployment(log, zeusUnit.id, zeus.id, 'player', zeus.cost);
    noteDeployment(log, cronusUnit.id, cronus.id, 'enemy', cronus.cost);
    zeusUnit.x = 600;
    cronusUnit.x = 620;
    world.events.length = 0;

    for (let i = 0; i < 300; i++) {
      tickWorld(world, TICK_DT, graph, roster, createRng(1));
      recordEvents(log, world.events, world.time);
      world.events.length = 0;
      if (world.outcome !== 'ongoing') break;
    }

    const summary = summarise(log, roster);
    const names = summary.tallies.map((t) => t.modifier);
    expect(names).toContain('Filicide');
    expect(names).toContain('Usurpation');

    // Both are damage bonuses, so both sides should come out ahead of their unmodified baseline.
    expect(summary.swingBySide.player).toBeGreaterThan(0);
    expect(summary.swingBySide.enemy).toBeGreaterThan(0);

    // And every recorded blow should carry a baseline to compare against.
    for (const entry of log.entries) expect(entry.baseDamage).toBeGreaterThan(0);
  });
});
