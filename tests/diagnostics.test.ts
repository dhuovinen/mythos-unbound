import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { NORSE_DEITIES, NORSE_EDGES } from '../src/data/norse';
import { EGYPTIAN_DEITIES, EGYPTIAN_EDGES } from '../src/data/egyptian';
import { createBattleLog, recordEvents } from '../src/sim/battlelog';
import { TICK_DT } from '../src/sim/constants';
import { createDiagnosticLog, diagnosticCombatObserver, diagnosticState, noteDiagnostic } from '../src/sim/diagnostics';
import { buildDiagnosticPacket, diagnosticModifierRules, packetJson, packetMarkdown } from '../src/sim/diagnosticexport';
import { createHand, playFrom } from '../src/sim/hand';
import { buildGraph } from '../src/sim/relations';
import { createRng } from '../src/sim/rng';
import type { Stage } from '../src/sim/types';
import type { AttackResult } from '../src/sim/combat';
import { createWorld, spawnUnit, tickWorld, tickWorldObserved } from '../src/sim/world';

const all = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES];
const edges = [...GREEK_EDGES, ...NORSE_EDGES, ...EGYPTIAN_EDGES];
const deities = new Map(all.map((d) => [d.id, d]));
const graph = buildGraph(edges);
const stage: Stage = { id: 'diagnostics-test', name: 'Diagnostic test', playerDeck: ['hoplite','zeus','ares','hera'],
  waves: [], startingFaith: 200, faithMax: 900, faithRegen: 30, playerBaseHp: 9000, enemyBaseHp: 13000 };
function setup() {
  const world = createWorld(stage, deities);
  const log = createDiagnosticLog({ createdAt: '2026-10-02T12:00:00Z', stage, roster: all, relationships: edges,
    playerDeck: stage.playerDeck, enemyDeck: all.map((d) => d.id), seed: 1, settings: { enemyAi: true },
    enemyThinkInterval: 2.5, autoThinkInterval: 2.5, resolveBudget: 400 });
  const observer = diagnosticCombatObserver(log, world, deities);
  const spawn = (id: string, side: 'player' | 'enemy', x: number) => {
    const unit = spawnUnit(world, deities.get(id)!, side); unit.x = x; return unit;
  };
  const step = () => tickWorldObserved(world, TICK_DT, graph, deities, createRng(1), observer);
  const result = (id: number) => log.events.find((e) => e.kind === 'attack' && (e.data.attackerBefore as {id:number}).id === id)?.data.result as AttackResult;
  return { world, log, observer, spawn, step, result };
}

describe('diagnostic combat evidence', () => {
  it('does not change simulation state, outcomes or normal events', () => {
    function run(record: boolean) {
      const s = setup(); s.spawn('zeus','player',600); s.spawn('cronus','enemy',620);
      s.spawn('hera','player',580); s.spawn('apollo','enemy',640);
      const rng = createRng(1);
      for (let i=0;i<3000;i++) {
        if (record) tickWorldObserved(s.world,TICK_DT,graph,deities,rng,s.observer);
        else tickWorld(s.world,TICK_DT,graph,deities,rng);
      }
      return s.world;
    }
    expect(run(true)).toEqual(run(false));
  });
  it('records ordinary attacks and the exact full field at resolution time', () => {
    const s=setup(); const a=s.spawn('hoplite','player',600); const d=s.spawn('satyr','enemy',610); s.step();
    const event=s.log.events.find((e)=>e.kind==='attack')!;
    expect(event.tick).toBe(1); expect(event.time).toBe(TICK_DT);
    expect(s.result(a.id).modifiers).toEqual([]);
    const before=event.data.fieldBefore as {id:number;hp:number}[];
    expect(before).toHaveLength(4); expect(before.find((u)=>u.id===d.id)?.hp).toBe(d.maxHp);
    const recordedHp=(event.data.defenderAfter as {hp:number}).hp;
    d.hp=1; a.x=100; expect((event.data.defenderAfter as {hp:number}).hp).toBe(recordedHp);
  });
  it('captures defensive auras, deduplication and the actual armour subtraction', () => {
    const s=setup(); const a=s.spawn('cronus','player',600); s.spawn('artemis','enemy',610);
    const ally=s.spawn('apollo','enemy',620); s.spawn('apollo','enemy',630); s.step();
    const r=s.result(a.id); const c=r.calculation!;
    expect(c.defenderAuras.map((m)=>m.name)).toEqual(['Kinship']);
    expect(c.defenderAllies).toContain(ally.id);
    expect(c.defenderCombined?.armorMult).toBe(1.15);
    expect(c.effectiveArmor).toBe(deities.get('artemis')!.armor*1.15);
    expect(r.damage).toBe(Math.max(1,c.rawDamage!-c.effectiveArmor!));
  });
  it('preserves allied auras on an attack against a foreign pantheon', () => {
    const s=setup(); const a=s.spawn('zeus','player',600); s.spawn('hera','player',590); s.spawn('thor','enemy',620); s.step();
    const c=s.result(a.id).calculation!;
    expect(c.combatModifiers).toEqual([]);
    expect(c.attackerAuras.map((m)=>m.name)).toContain('Devoted');
    expect(c.attackerCombined.damageMult).toBe(1.1);
  });
  it('records suppressed attempts with unchanged HP and a consumed cooldown', () => {
    const s=setup(); const a=s.spawn('ares','player',600); const d=s.spawn('aphrodite','enemy',610); s.step();
    const event=s.log.events.find((e)=>e.kind==='attack'&&(e.data.attackerBefore as {id:number}).id===a.id)!;
    expect(s.result(a.id).suppressed).toBe(true); expect(s.result(a.id).damage).toBe(0);
    expect(s.result(a.id).calculation?.rawDamage).toBeNull();
    expect(event.data.hpRemoved).toBe(0); expect(d.hp).toBe(d.maxHp); expect(a.cooldown).toBeGreaterThan(0);
  });
  it('distinguishes skipped defender aura evaluation from an evaluated empty result', () => {
    const s=setup(); const a=s.spawn('asclepius','player',600); s.spawn('zeus','enemy',610); s.spawn('hera','enemy',620); s.step();
    const c=s.result(a.id).calculation!;
    expect(c.attackerCombined.armorPen).toBe(true); expect(c.defenderAurasEvaluated).toBe(false);
    expect(c.effectiveArmor).toBe(0); expect(c.defenderCombined).toBeNull();
  });
  it('keeps overkill separate from HP removed and preserves a dead unit identity', () => {
    const s=setup(); s.spawn('heracles','player',600); const d=s.spawn('hoplite','enemy',610); d.hp=2; s.step();
    const hit=s.log.events.find((e)=>e.kind==='attack')!;
    expect(hit.data.hpRemoved).toBe(2); expect(hit.data.overkill).toBeGreaterThan(0);
    expect(s.world.units.some((u)=>u.id===d.id)).toBe(false);
    const death=s.log.events.find((e)=>e.kind==='death')!;
    expect((death.data.unit as {deityId:string}).deityId).toBe('hoplite');
    expect((death.data.unit as {hp:number}).hp).toBeLessThan(0);
  });
  it('records bases with instance IDs rather than unknown roster identities', () => {
    const s=setup(); const a=s.spawn('zeus','player',s.world.units[1].x-5); s.step();
    const hit=s.log.events.find((e)=>e.kind==='attack'&&(e.data.attackerBefore as {id:number}).id===a.id)!;
    expect(hit.message).toContain('enemy Base #2');
    expect(s.result(a.id).calculation?.effectiveArmor).toBe(0);
    expect(hit.data.combatEdges).toEqual([]);
  });
  it('records lowest-ID target tie-breaking and exact target range', () => {
    const s=setup(); const a=s.spawn('hoplite','player',600);
    const first=s.spawn('satyr','enemy',610); s.spawn('hoplite','enemy',590); s.step();
    const target=s.log.events.find((e)=>e.kind==='target')!;
    expect((target.data.unit as {id:number}).id).toBe(a.id);
    expect((target.data.target as {id:number}).id).toBe(first.id);
    expect(target.data.distance).toBe(10); expect(target.data.range).toBe(deities.get('hoplite')!.range);
  });
  it('assigns a distinct sequence to every event at the same tick', () => {
    const s=setup(); s.spawn('zeus','player',600); s.spawn('cronus','enemy',610); s.step();
    expect(s.log.events.map((e)=>e.sequence)).toEqual(s.log.events.map((_,i)=>i+1));
    expect(s.log.events.filter((e)=>e.kind==='attack')).toHaveLength(2);
    expect(new Set(s.log.events.map((e)=>e.tick))).toEqual(new Set([1]));
  });
  it('records normal report hits per simulation tick when one frame advances multiple steps', () => {
    const s=setup(); s.spawn('hoplite','player',600); s.spawn('satyr','enemy',610);
    const report=createBattleLog();
    for(let i=0;i<4;i++) { const start=s.world.events.length; s.step(); recordEvents(report,s.world.events.slice(start),s.world.time); }
    const attacks=s.log.events.filter((e)=>e.kind==='attack');
    expect(report.entries).toHaveLength(attacks.length);
    expect(report.entries.map((e)=>e.time)).toEqual(attacks.map((e)=>e.time));
  });
});

describe('availability and export', () => {
  it('captures slots, queue, funds and field-capacity gates without mutating the hand', () => {
    const s=setup(); const hand=createHand(stage.playerDeck);
    const state=diagnosticState(s.world,deities,hand,['zeus','hoplite'],200,true);
    expect(state.player.available.find((a)=>a.deityId==='zeus')?.affordable).toBe(false);
    expect(state.player.hand.queue).toEqual(['hera']);
    noteDiagnostic(s.log,0,'snapshot','state',{state});
    playFrom(hand,0); s.world.faith=0;
    expect((s.log.events[0].data.state as typeof state).player.faith).toBe(200);
    expect((s.log.events[0].data.state as typeof state).player.hand.slots).toEqual(['hoplite','zeus','ares']);
    for(let i=0;i<8;i++) s.spawn('hoplite','player',100+i);
    const full=diagnosticState(s.world,deities,hand,[],900,true);
    expect(full.player.available.every((a)=>a.fieldBlock==='field'&&!a.summonable)).toBe(true);
  });
  it('makes disabled opponent AI and ended battles unavailable to summon', () => {
    const s=setup();
    expect(diagnosticState(s.world,deities,createHand(stage.playerDeck),['hoplite'],900,false).enemy.available[0].summonable).toBe(false);
    s.world.outcome='victory';
    expect(diagnosticState(s.world,deities,createHand(stage.playerDeck),['hoplite'],900,true).player.available.every((a)=>!a.summonable)).toBe(true);
  });
  it('freezes initial roster, decks and configuration metadata', () => {
    const s=setup(); expect(s.log.metadata.roster).not.toBe(all);
    expect(s.log.metadata.stage).not.toBe(stage);
    expect(s.log.metadata.settings).toEqual({enemyAi:true});
  });
  it('derives all fourteen modifier definitions and their tuned numbers from the resolvers', () => {
    const rules=diagnosticModifierRules(setup().log);
    expect(new Set(rules.map((r)=>r.modifier.name)).size).toBe(14);
    expect(rules.find((r)=>r.modifier.name==='Filicide')?.modifier.damageMult).toBe(1.5);
    expect(rules.find((r)=>r.modifier.name==='Jealousy')?.modifier.attackSpeedMult).toBe(0.7);
  });
  it('exports every event beyond the old 120-row report limit and retains exact precision', () => {
    const s=setup();
    for(let i=0;i<151;i++) noteDiagnostic(s.log,i*TICK_DT,'attack',`unmodified attack ${i}`,{damage:12.3456789012345});
    const state=diagnosticState(s.world,deities,createHand(stage.playerDeck),['hoplite'],200,true);
    const packet=buildDiagnosticPacket({log:s.log,state,time:s.world.time},'2026-10-02T12:01:00Z');
    const parsed=JSON.parse(packetJson(packet));
    expect(parsed.battle.events).toHaveLength(151);
    expect(parsed.battle.events[150].data.damage).toBe(12.3456789012345);
    const md=packetMarkdown(packet);
    expect(md).toContain('| 151 |'); expect(md).toContain('unmodified attack 150');
    expect(md).toContain('## Complete lossless evidence');
    expect(parsed.status).toBe('in-progress snapshot');
    expect(parsed.engineSources['src/sim/combat.ts']).toContain('Math.max(1, rawDamage - defenderArmor)');
    expect(parsed.gameInstructions).toContain('roughly one-second snapshots');
    expect(parsed.exampleAnalysisPrompt).toContain('Cite event sequence numbers');
  });
  it('labels a completed export explicitly and carries the final field', () => {
    const s=setup(); s.world.outcome='defeat'; s.world.units[0].hp=-20;
    const state=diagnosticState(s.world,deities,createHand(stage.playerDeck),[],200,true);
    const p=buildDiagnosticPacket({log:s.log,state,time:s.world.time},'2026-10-02T12:01:00Z');
    expect(p.status).toBe('completed battle'); expect(p.battle.currentState.outcome).toBe('defeat');
    expect(p.battle.currentState.units).toEqual(s.world.units);
  });
});
