/** Factual, serialisable recording only. Never evaluates the correctness or strategy of a battle. */
import { AURA_RADIUS, MAX_DAMAGE_MULT, TICK_DT } from './constants';
import { deployBlock, fieldCounts, MAX_FIELD_UNITS, MAX_HEAVY_UNITS } from './limits';
import type { Hand } from './hand';
import type { CombatObserver } from './combat';
import type { Deity, DeityIndex, Edge, Stage, Unit, World } from './types';

export type DiagnosticKind = 'start' | 'snapshot' | 'deployment' | 'summon-attempt' | 'decision' | 'target' | 'attack' | 'death' | 'settings' | 'mode' | 'outcome';
export interface DiagnosticEvent {
  sequence: number;
  tick: number;
  time: number;
  kind: DiagnosticKind;
  message: string;
  data: Record<string, unknown>;
}
export interface DiagnosticMetadata {
  createdAt: string;
  stage: Stage;
  roster: readonly Deity[];
  relationships: readonly Edge[];
  playerDeck: readonly string[];
  enemyDeck: readonly string[];
  seed: number;
  settings: Record<string, unknown>;
  enemyThinkInterval: number;
  autoThinkInterval: number;
  resolveBudget: number;
}
export interface DiagnosticLog {
  schemaVersion: 'mythos-battle-diagnostics/1';
  metadata: DiagnosticMetadata;
  constants: { tickDt: number; auraRadius: number; maxDamageMult: number; maxUnits: number; maxHeavy: number };
  events: DiagnosticEvent[];
}

/** Clone at the recording boundary so later changes can never rewrite the evidence. */
export function createDiagnosticLog(metadata: DiagnosticMetadata): DiagnosticLog {
  return {
    schemaVersion: 'mythos-battle-diagnostics/1', metadata: structuredClone(metadata),
    constants: { tickDt: TICK_DT, auraRadius: AURA_RADIUS, maxDamageMult: MAX_DAMAGE_MULT, maxUnits: MAX_FIELD_UNITS, maxHeavy: MAX_HEAVY_UNITS },
    events: [],
  };
}
export function noteDiagnostic(log: DiagnosticLog, time: number, kind: DiagnosticKind, message: string, data: Record<string, unknown>): void {
  log.events.push({ sequence: log.events.length + 1, time, tick: Math.round(time / TICK_DT), kind, message, data: structuredClone(data) });
}
export function availability(world: World, deities: DeityIndex, ids: readonly string[], side: 'player' | 'enemy', faith: number) {
  return ids.map((id, slot) => {
    const deity = deities.get(id);
    const fieldBlock = deity ? deployBlock(world, deities, deity, side) : null;
    const affordable = deity ? faith >= deity.cost : false;
    return { slot, deityId: id, cost: deity?.cost ?? null, affordable, fieldBlock,
      summonable: world.outcome === 'ongoing' && deity !== undefined && affordable && fieldBlock === null };
  });
}
export function diagnosticState(world: World, deities: DeityIndex, hand: Hand, enemyDeck: readonly string[], enemyFaith: number, enemyAi: boolean) {
  return {
    outcome: world.outcome, units: world.units.map((u) => ({ ...u })),
    player: { faith: world.faith, faithMax: world.faithMax, faithRegen: world.faithRegen,
      hand: { slots: [...hand.slots], queue: [...hand.queue] }, fieldCounts: fieldCounts(world, deities, 'player'),
      available: availability(world, deities, hand.slots, 'player', world.faith) },
    enemy: { faith: enemyFaith, faithMax: world.faithMax, faithRegen: enemyAi ? world.faithRegen : 0,
      aiEnabled: enemyAi, candidates: [...enemyDeck], fieldCounts: fieldCounts(world, deities, 'enemy'),
      available: availability(world, deities, enemyDeck, 'enemy', enemyFaith).map((a) => ({ ...a, summonable: enemyAi && a.summonable })) },
  };
}
export function unitLabel(unit: Pick<Unit, 'id' | 'deityId' | 'side' | 'isBase'>, deities: DeityIndex): string {
  const name = unit.isBase ? 'Base' : deities.get(unit.deityId)?.name ?? unit.deityId;
  return `${unit.side} ${name} #${unit.id}`;
}
export function diagnosticCombatObserver(log: DiagnosticLog, world: World, deities: DeityIndex): CombatObserver {
  return {
    target(unit, previousTargetId, target) {
      noteDiagnostic(log, world.time, 'target', `${unitLabel(unit, deities)} ${target ? `targets ${unitLabel(target, deities)}` : 'has no target; advances'}`, {
        unit, previousTargetId, target, distance: target ? Math.abs(unit.x - target.x) : null,
        range: deities.get(unit.deityId)?.range ?? null,
      });
    },
    attack(trace) {
      const { attackerBefore: a, defenderBefore: d, result } = trace;
      const edges = d.isBase ? [] : log.metadata.relationships.filter((e) =>
        (e.from === a.deityId && e.to === d.deityId) || (e.from === d.deityId && e.to === a.deityId));
      const hpRemoved = d.hp - Math.max(0, trace.defenderAfter.hp);
      const displayedDamage = Number(result.damage.toFixed(4));
      noteDiagnostic(log, world.time, 'attack', `${unitLabel(a, deities)} → ${unitLabel(d, deities)}: ${result.suppressed ? 'refused' : `${displayedDamage} damage`}`, {
        ...trace, distance: Math.abs(a.x - d.x), combatEdges: edges,
        hpRemoved, overkill: Math.max(0, result.damage - d.hp),
      });
    },
    death(unit) {
      noteDiagnostic(log, world.time, 'death', `${unitLabel(unit, deities)} removed from the field`, { unit });
    },
  };
}
