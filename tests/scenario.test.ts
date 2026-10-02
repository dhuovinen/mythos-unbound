import { describe, expect, it } from 'vitest';
import { EGYPTIAN_DEITIES, EGYPTIAN_EDGES } from '../src/data/egyptian';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { NORSE_DEITIES, NORSE_EDGES } from '../src/data/norse';
import { SHOWCASE_STAGE } from '../src/data/stages';
import { chooseSummon } from '../src/sim/advisor';
import { createBattleLog, noteDeployment, summarise } from '../src/sim/battlelog';
import { TICK_DT } from '../src/sim/constants';
import { buildDiagnosticPacket } from '../src/sim/diagnosticexport';
import { createDiagnosticLog, diagnosticState } from '../src/sim/diagnostics';
import { createHand, playFrom } from '../src/sim/hand';
import { deployBlock } from '../src/sim/limits';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import { selectBattleStage } from '../src/sim/scenario';
import { createWorld, spawnUnit, tickWorld } from '../src/sim/world';

const all = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES];
const edges = [...GREEK_EDGES, ...NORSE_EDGES, ...EGYPTIAN_EDGES];
const deities = new Map(all.map((d) => [d.id, d]));
const graph = buildGraph(edges);
const egyptianDeck = ['anubis', 'wepwawet', 'ba', 'bes', 'imhotep', 'medjay', 'nefertem', 'ammit', 'apep'];

describe('drafted battle stage selection', () => {
  it('preserves the complete demonstration timeline only when both drafts are absent', () => {
    expect(selectBattleStage(SHOWCASE_STAGE, null, null)).toBe(SHOWCASE_STAGE);
    expect(SHOWCASE_STAGE.waves.some((w) => w.deityId === 'cronus')).toBe(true);
  });
  it.each([
    ['Egyptian', egyptianDeck, egyptianDeck],
    ['Norse', ['thor', 'odin', 'fenrir'], ['loki', 'hel', 'jormungandr']],
    ['Greek', ['zeus', 'ares', 'hera'], ['cronus', 'apollo', 'artemis']],
    ['Mixed', ['anubis', 'thor', 'zeus'], ['cronus', 'hel', 'apep']],
    ['Player-only saved draft', egyptianDeck, null],
    ['Opponent-only saved draft', null, egyptianDeck],
  ] as const)('disables all showcase reinforcements for %s', (_label, player, opponent) => {
    const stage = selectBattleStage(SHOWCASE_STAGE, player, opponent);
    expect(stage.waves).toEqual([]);
    expect(stage.playerDeck).toEqual(player ?? SHOWCASE_STAGE.playerDeck);
    expect(stage.startingFaith).toBe(SHOWCASE_STAGE.startingFaith);
    expect(stage.playerBaseHp).toBe(SHOWCASE_STAGE.playerBaseHp);
    expect(stage.enemyBaseHp).toBe(SHOWCASE_STAGE.enemyBaseHp);
    expect(stage.id).toBe('roster-battle');
    expect(SHOWCASE_STAGE.waves).toHaveLength(14);
  });
  it('keeps repeated deployments within both Egyptian decks through a real battle', () => {
    const stage = selectBattleStage(SHOWCASE_STAGE, egyptianDeck, egyptianDeck);
    const world = createWorld(stage, deities), log = createBattleLog(), rng = createRng(0x5eed);
    let hand = createHand(stage.playerDeck), enemyFaith = stage.startingFaith;
    const waves = [...stage.waves].sort((a, b) => a.at - b.at);
    const deploy = (id: string, side: 'player' | 'enemy', cost: number) => {
      const unit = spawnUnit(world, deities.get(id)!, side);
      noteDeployment(log, unit.id, id, side, cost);
    };
    for (let tick = 0; tick < 400 / TICK_DT && world.outcome === 'ongoing'; tick++) {
      while (waves[0] && waves[0].at <= world.time) {
        const wave = waves.shift()!; deploy(wave.deityId, wave.side, 0);
      }
      enemyFaith = Math.min(stage.faithMax, enemyFaith + stage.faithRegen * TICK_DT);
      if (tick % 150 === 0) {
        const allowed = (ids: readonly string[], side: 'player' | 'enemy') => ids.filter((id) => deployBlock(world, deities, deities.get(id)!, side) === null);
        const player = chooseSummon(world, deities, graph, allowed(hand.slots, 'player'), 'player', world.faith, world.faithMax);
        if (player) {
          const cost = deities.get(player)!.cost;
          world.faith -= cost; hand = playFrom(hand, hand.slots.indexOf(player)); deploy(player, 'player', cost);
        }
        const enemy = chooseSummon(world, deities, graph, allowed(egyptianDeck, 'enemy'), 'enemy', enemyFaith, stage.faithMax);
        if (enemy) { const cost = deities.get(enemy)!.cost; enemyFaith -= cost; deploy(enemy, 'enemy', cost); }
      }
      tickWorld(world, TICK_DT, graph, deities, rng); world.events.length = 0;
    }
    const rows = summarise(log, deities).deployments;
    expect(rows.some((d) => d.side === 'player')).toBe(true);
    expect(rows.some((d) => d.side === 'enemy')).toBe(true);
    expect(rows.some((d) => d.count > 1)).toBe(true);
    for (const row of rows) {
      expect(egyptianDeck).toContain(row.deityId);
      expect(row.totalCost).toBe(row.count * deities.get(row.deityId)!.cost);
    }
    expect(rows.map((d) => d.deityId)).not.toContain('zeus');
    expect(rows.map((d) => d.deityId)).not.toContain('achilles');
  });
  it('exports the effective wave-free stage, selected rosters and scenario-selection source', () => {
    const stage = selectBattleStage(SHOWCASE_STAGE, egyptianDeck, egyptianDeck);
    const world = createWorld(stage, deities), hand = createHand(stage.playerDeck);
    const log = createDiagnosticLog({ createdAt: '2026-10-02T12:00:00Z', stage, roster: all, relationships: edges,
      playerDeck: stage.playerDeck, enemyDeck: egyptianDeck, seed: 1, settings: {},
      enemyThinkInterval: 2.5, autoThinkInterval: 2.5, resolveBudget: 400 });
    const packet = buildDiagnosticPacket({ log, time: 0, state: diagnosticState(world, deities, hand, egyptianDeck, 200, true) }, '2026-10-02T12:01:00Z');
    expect(packet.battle.metadata.stage.waves).toEqual([]);
    expect(packet.battle.metadata.playerDeck).toEqual(egyptianDeck);
    expect(packet.battle.metadata.enemyDeck).toEqual(egyptianDeck);
    expect(packet.engineSources['src/sim/scenario.ts']).toContain('waves: []');
    expect(packet.gameInstructions).toContain('only an undrafted showcase runs its demonstration waves');
  });
});
