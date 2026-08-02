/**
 * Battle log — the record behind the post-match report.
 *
 * Every attack is stored with what it actually dealt and what it *would* have dealt with no
 * relations in play. The difference between those two numbers is the whole point: it is the only
 * honest way to say what the genealogy graph was worth over a battle, rather than asserting that it
 * mattered and hoping the player felt it.
 *
 * Pure and side-effect free. It records what the simulation reports; it never inspects or mutates
 * the world.
 */

import type { DeityId, DeityIndex, ModifierName, SimEvent, Side } from './types';

/** One resolved attack. */
export interface LogEntry {
  readonly time: number;
  readonly attackerId: number;
  readonly defenderId: number;
  readonly damage: number;
  readonly baseDamage: number;
  /** Positive when relations helped the attacker, negative when they held it back. */
  readonly swing: number;
  readonly modifiers: readonly ModifierName[];
  /** True when the attack was refused outright (Entranced). */
  readonly prevented: boolean;
}

/** A unit that appeared on the field, and how many times. */
export interface Deployment {
  readonly deityId: DeityId;
  readonly side: Side;
  count: number;
  totalCost: number;
}

/** Aggregated effect of one modifier over the battle, from one side's point of view. */
export interface ModifierTally {
  readonly modifier: ModifierName;
  readonly side: Side;
  procs: number;
  /** Net damage gained (or lost) across every attack this modifier appeared on. */
  swing: number;
  /** Attacks refused outright. */
  prevented: number;
}

export interface BattleLog {
  readonly entries: LogEntry[];
  /** Keyed `${side}|${deityId}`. */
  readonly deployments: Map<string, Deployment>;
  /** Unit id to its identity, kept because units are removed from the world when they die. */
  readonly identities: Map<number, { deityId: DeityId; side: Side }>;
}

export function createBattleLog(): BattleLog {
  return { entries: [], deployments: new Map(), identities: new Map() };
}

/**
 * Registers a unit as it enters the battle. Called at spawn time rather than derived from events,
 * because a unit that dies is removed from the world and its identity would otherwise be lost
 * before the report is built.
 */
export function noteDeployment(
  log: BattleLog,
  unitId: number,
  deityId: DeityId,
  side: Side,
  cost: number,
): void {
  log.identities.set(unitId, { deityId, side });

  const key = `${side}|${deityId}`;
  const existing = log.deployments.get(key);
  if (existing === undefined) {
    log.deployments.set(key, { deityId, side, count: 1, totalCost: cost });
  } else {
    existing.count += 1;
    existing.totalCost += cost;
  }
}

/** Records the hit events from one frame. Other event kinds are ignored. */
export function recordEvents(log: BattleLog, events: readonly SimEvent[], time: number): void {
  for (const event of events) {
    if (event.kind !== 'hit') continue;
    log.entries.push({
      time,
      attackerId: event.attackerId,
      defenderId: event.defenderId,
      damage: event.damage,
      baseDamage: event.baseDamage,
      // A prevented attack forfeits the whole base value, which is exactly what it cost.
      swing: event.damage - event.baseDamage,
      modifiers: event.modifiers,
      prevented: event.damage === 0 && event.modifiers.length > 0,
    });
  }
}

export interface BattleSummary {
  readonly totalAttacks: number;
  readonly relationalAttacks: number;
  /** Net damage swing attributable to relations, per side. */
  readonly swingBySide: Readonly<Record<Side, number>>;
  readonly damageBySide: Readonly<Record<Side, number>>;
  readonly tallies: readonly ModifierTally[];
  readonly deployments: readonly Deployment[];
}

/** Aggregates the log into the figures the report displays. */
export function summarise(log: BattleLog, deities: DeityIndex): BattleSummary {
  void deities;

  const swingBySide: Record<Side, number> = { player: 0, enemy: 0 };
  const damageBySide: Record<Side, number> = { player: 0, enemy: 0 };
  const tallies = new Map<string, ModifierTally>();
  let relationalAttacks = 0;

  for (const entry of log.entries) {
    const attacker = log.identities.get(entry.attackerId);
    if (attacker === undefined) continue;

    damageBySide[attacker.side] += entry.damage;
    if (entry.modifiers.length === 0) continue;

    relationalAttacks++;
    swingBySide[attacker.side] += entry.swing;

    for (const modifier of entry.modifiers) {
      const key = `${attacker.side}|${modifier}`;
      const tally = tallies.get(key);
      if (tally === undefined) {
        tallies.set(key, {
          modifier,
          side: attacker.side,
          procs: 1,
          // Attributing the full swing to each modifier on a multi-modifier hit would double count,
          // so it is split evenly between them.
          swing: entry.swing / entry.modifiers.length,
          prevented: entry.prevented ? 1 : 0,
        });
      } else {
        tally.procs += 1;
        tally.swing += entry.swing / entry.modifiers.length;
        if (entry.prevented) tally.prevented += 1;
      }
    }
  }

  return {
    totalAttacks: log.entries.length,
    relationalAttacks,
    swingBySide,
    damageBySide,
    tallies: [...tallies.values()].sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing)),
    deployments: [...log.deployments.values()].sort(
      (a, b) => a.side.localeCompare(b.side) || b.count - a.count || a.deityId.localeCompare(b.deityId),
    ),
  };
}
