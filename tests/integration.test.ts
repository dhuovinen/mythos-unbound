/**
 * Integrator-owned end-to-end tests. Work packages should not edit this file.
 *
 * These check the seam between work packages: that modifiers produced by the relational engine
 * (WP-1) actually reach the damage maths in the sim core (WP-2). Unit tests on either side can both
 * pass while the wiring between them is wrong, which is the characteristic failure of parallel work.
 */

import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { SHOWCASE_STAGE } from '../src/data/stages';
import { TICK_DT } from '../src/sim/constants';
import { buildGraph, resolveCombat } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import type { Deity, DeityIndex, ModifierName, SimEvent, Stage, World } from '../src/sim/types';
import { createWorld, spawnUnit, tickWorld } from '../src/sim/world';

function deity(id: string, over: Partial<Deity> = {}): Deity {
  return {
    id,
    name: id,
    pantheon: 'greek',
    tier: 'god',
    cost: 0,
    hp: 5000,
    damage: 100,
    attackInterval: 1,
    range: 50,
    speed: 30,
    armor: 0,
    traits: [],
    ...over,
  };
}

const cronus = deity('cronus', { tier: 'titan', damage: 100, traits: ['devourer'] });
const zeus = deity('zeus', { damage: 50, armor: 10 });

const deities: DeityIndex = new Map([
  [cronus.id, cronus],
  [zeus.id, zeus],
]);

const graph = buildGraph([{ from: 'cronus', to: 'zeus', kind: 'parent' }]);

const STAGE: Stage = {
  id: 'integration',
  name: 'Integration',
  playerDeck: ['zeus'],
  waves: [],
  startingFaith: 0,
  faithMax: 1000,
  faithRegen: 0,
  playerBaseHp: 100000,
  enemyBaseHp: 100000,
};

/** Places Zeus and Cronus adjacent mid-lane and runs a single tick. */
function clashOnce(): SimEvent[] {
  const world = createWorld(STAGE, deities);
  const zeusUnit = spawnUnit(world, zeus, 'player');
  const cronusUnit = spawnUnit(world, cronus, 'enemy');
  zeusUnit.x = 600;
  cronusUnit.x = 620;
  world.events.length = 0;

  tickWorld(world, TICK_DT, graph, deities, createRng(1));
  return world.events;
}

describe('WP-1 x WP-2 integration', () => {
  it('Filicide reaches the damage calculation', () => {
    const hits = clashOnce().filter((e) => e.kind === 'hit');
    const byCronus = hits.find((h) => h.kind === 'hit' && h.modifiers.includes('Filicide'));
    expect(byCronus).toBeDefined();
    // 100 base x 1.5 Filicide = 150, minus Zeus's 10 armor
    if (byCronus?.kind === 'hit') expect(byCronus.damage).toBeCloseTo(140, 6);
  });

  it('Usurpation reaches the damage calculation on the reply', () => {
    const hits = clashOnce().filter((e) => e.kind === 'hit');
    const byZeus = hits.find((h) => h.kind === 'hit' && h.modifiers.includes('Usurpation'));
    expect(byZeus).toBeDefined();
    // 50 base x 1.6 Usurpation = 80, Cronus has no armor
    if (byZeus?.kind === 'hit') expect(byZeus.damage).toBeCloseTo(80, 6);
  });

  it('an empty edge list produces plain unmodified damage', () => {
    const bare = buildGraph([]);
    const world = createWorld(STAGE, deities);
    const zeusUnit = spawnUnit(world, zeus, 'player');
    const cronusUnit = spawnUnit(world, cronus, 'enemy');
    zeusUnit.x = 600;
    cronusUnit.x = 620;
    world.events.length = 0;

    tickWorld(world, TICK_DT, bare, deities, createRng(1));

    const hits = world.events.filter((e) => e.kind === 'hit');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      if (hit.kind === 'hit') expect(hit.modifiers).toEqual([]);
    }
  });

  it('Entranced stops the attack entirely', () => {
    const ares = deity('ares', { damage: 100 });
    const aphrodite = deity('aphrodite', { damage: 100 });
    const pair: DeityIndex = new Map([
      [ares.id, ares],
      [aphrodite.id, aphrodite],
    ]);
    const loveGraph = buildGraph([{ from: 'ares', to: 'aphrodite', kind: 'lover' }]);

    const world = createWorld({ ...STAGE, playerDeck: ['ares'] }, pair);
    const a = spawnUnit(world, ares, 'player');
    const b = spawnUnit(world, aphrodite, 'enemy');
    a.x = 600;
    b.x = 620;
    const startHp = b.hp;
    world.events.length = 0;

    for (let i = 0; i < 120; i++) tickWorld(world, TICK_DT, loveGraph, pair, createRng(1));

    // A suppressed attack DOES emit an event, carrying damage 0 and the Entranced modifier, so the
    // render layer can announce it. What must never happen is actual damage.
    const hits = world.events.filter((e) => e.kind === 'hit');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      if (hit.kind !== 'hit') continue;
      expect(hit.damage).toBe(0);
      expect(hit.modifiers).toContain('Entranced');
    }
    expect(b.hp).toBe(startHp);
  });
});

describe('the shipped Greek roster', () => {
  const roster: DeityIndex = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
  const greekGraph = buildGraph(GREEK_EDGES);

  const get = (id: string): Deity => {
    const found = roster.get(id);
    if (found === undefined) throw new Error(`roster is missing '${id}'`);
    return found;
  };

  const between = (a: string, b: string): ModifierName[] =>
    resolveCombat(get(a), get(b), greekGraph).map((m) => m.name);

  it('references no deity id that does not exist', () => {
    // A typo here silently disables a relation with no error anywhere — the worst bug class here.
    const unknown: string[] = [];
    for (const edge of GREEK_EDGES) {
      if (!roster.has(edge.from)) unknown.push(edge.from);
      if (!roster.has(edge.to)) unknown.push(edge.to);
    }
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('keeps chaff entirely out of the graph', () => {
    const chaff = GREEK_DEITIES.filter((d) => d.tier === 'chaff').map((d) => d.id);
    const inGraph = GREEK_EDGES.flatMap((e) => [e.from, e.to]);
    for (const id of chaff) expect(inGraph).not.toContain(id);
  });

  it('delivers every showcase pairing the game is built to demonstrate', () => {
    expect(between('cronus', 'zeus')).toContain('Filicide');
    expect(between('zeus', 'cronus')).toContain('Usurpation');
    expect(between('hera', 'heracles')).toContain('Wrath');
    expect(between('heracles', 'hera')).toContain('Defiance');
    expect(between('asclepius', 'zeus')).toContain('Vengeance');
    expect(between('ares', 'aphrodite')).toContain('Entranced');
    expect(between('apollo', 'artemis')).toContain('Rivalry');
    expect(between('zeus', 'typhon')).toContain('Rivalry');
  });

  it('has Cronus carrying the devourer trait', () => {
    expect(get('cronus').traits).toContain('devourer');
  });
});

describe('the showcase stage', () => {
  const roster: DeityIndex = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
  const greekGraph = buildGraph(GREEK_EDGES);

  /**
   * Plays the showcase headlessly with a scripted, deliberately restrained player: it summons each
   * beat's counter-unit and spends surplus faith on chaff, but caps its own army. That cap matters —
   * an over-full lane buries the beat units behind their own column, and Entranced in particular
   * only fires when the two lovers are each other's NEAREST enemy.
   */
  function playShowcase(): { fired: Map<ModifierName, number>; world: World } {
    const stage = SHOWCASE_STAGE;
    const world = createWorld(stage, roster);
    const waves = [...stage.waves].sort((a, b) => a.at - b.at);
    const plan = [
      { at: 1, id: 'hoplite' },
      { at: 12, id: 'heracles' },
      { at: 32, id: 'artemis' },
      { at: 38, id: 'achilles' },
      { at: 54, id: 'asclepius' },
      { at: 74, id: 'aphrodite' },
      { at: 80, id: 'hephaestus' },
      { at: 84, id: 'ares' },
      { at: 114, id: 'zeus' },
    ];
    const rng = createRng(0x5eed);
    const fired = new Map<ModifierName, number>();
    const filler = roster.get('hoplite');

    for (let step = 0; step < 60 * 180; step++) {
      for (;;) {
        const w = waves[0];
        if (w === undefined || w.at > world.time) break;
        waves.shift();
        const d = roster.get(w.deityId);
        if (d !== undefined) spawnUnit(world, d, w.side);
      }

      const next = plan[0];
      if (next !== undefined && next.at <= world.time) {
        const d = roster.get(next.id);
        if (d === undefined) plan.shift();
        else if (world.faith >= d.cost) {
          world.faith -= d.cost;
          spawnUnit(world, d, 'player');
          plan.shift();
        } else if (world.time > next.at + 25) plan.shift();
      }

      const own = world.units.filter((u) => u.side === 'player' && !u.isBase).length;
      if (filler !== undefined && world.faith >= 780 && own < 5) {
        world.faith -= filler.cost;
        spawnUnit(world, filler, 'player');
      }

      tickWorld(world, TICK_DT, greekGraph, roster, rng);

      for (const e of world.events) {
        if (e.kind !== 'hit') continue;
        for (const m of e.modifiers) if (!fired.has(m)) fired.set(m, world.time);
      }
      world.events.length = 0;
      if (world.outcome !== 'ongoing') break;
    }
    return { fired, world };
  }

  it('fires every one of the fourteen modifiers', () => {
    const { fired } = playShowcase();
    const all: ModifierName[] = [
      'Reluctance', 'Filicide', 'Usurpation', 'Rivalry', 'Entranced', 'Vengeance', 'Bound',
      'Wrath', 'Defiance', 'Blessed', 'Kinship', 'Devoted', 'Jealousy', 'Resented',
    ];
    const missing = all.filter((m) => !fired.has(m));
    expect(missing).toEqual([]);
  });

  it('keeps the player alive long enough to watch every beat', () => {
    const { world } = playShowcase();
    // Cronus, the last and most important beat, spawns at 104s and walks slowly.
    expect(world.time).toBeGreaterThan(150);
    expect(world.outcome).not.toBe('defeat');
  });

  it('puts Ares in the player deck, which Jealousy structurally requires', () => {
    // Jealousy needs Aphrodite, her spouse Hephaestus and her lover Ares all on the SAME side.
    // Without Ares summonable by the player, beat 6 can never fire no matter how it is tuned.
    for (const id of ['aphrodite', 'hephaestus', 'ares']) {
      expect(SHOWCASE_STAGE.playerDeck).toContain(id);
    }
  });
});
