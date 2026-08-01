/**
 * Rule-based board analysis — the strategy consultant's brain, and the enemy's.
 *
 * Pure and deterministic like everything else in src/sim/. One engine serves both consumers: the
 * enemy summoner asks it what to field, and the consultant panel renders the same reasoning back to
 * the player. That means the advice you are given is literally the logic you are playing against.
 *
 * Every line it produces carries qualitative prose and, separately, the figures behind it. The
 * prose never contains numbers — the UI decides whether to append the detail.
 */

import { MAX_DAMAGE_MULT } from './constants';
import { combineModifiers, resolveAuras, resolveCombat } from './relations';
import type {
  Deity,
  DeityId,
  DeityIndex,
  Modifier,
  ModifierName,
  RelationGraph,
  Side,
  Unit,
  World,
} from './types';

/** One statement, split so the UI can show prose alone or prose plus figures. */
export interface AdviceLine {
  readonly text: string;
  /** The arithmetic behind the claim. Rendered only when quantification is enabled. */
  readonly detail?: string;
  /** Modifier this line is about, for colour-coding. */
  readonly modifier?: ModifierName;
}

export interface Recommendation {
  readonly deityId: DeityId;
  readonly name: string;
  readonly score: number;
  readonly affordable: boolean;
  readonly lines: readonly AdviceLine[];
}

export interface BoardRead {
  readonly threats: readonly AdviceLine[];
  readonly warnings: readonly AdviceLine[];
  readonly recommendations: readonly Recommendation[];
}

/** How the consultant describes each modifier, with the subject acting on a target. */
const PROSE: Readonly<Record<ModifierName, string>> = {
  Filicide: 'feels nothing at all for',
  Reluctance: 'will hold back against',
  Usurpation: 'fights with a usurper’s fury against',
  Rivalry: 'is quickened by the sight of',
  Entranced: 'will simply refuse to fight',
  Vengeance: 'has a death to answer for with',
  Bound: 'cannot bring themselves to strike',
  Wrath: 'hunts',
  Defiance: 'stands defiant against',
  Blessed: 'is favoured by',
  Kinship: 'is steadied by',
  Devoted: 'is strengthened beside',
  Jealousy: 'is distracted by the company they keep',
  Resented: 'is dragged down by',
};

/** The figures behind a modifier, phrased compactly. */
function figures(mod: Modifier): string {
  const parts: string[] = [];
  if (mod.damageMult !== 1) parts.push(`×${mod.damageMult} damage`);
  if (mod.attackSpeedMult !== 1) parts.push(`×${mod.attackSpeedMult} attack speed`);
  if (mod.armorMult !== 1) parts.push(`×${mod.armorMult} armour`);
  if (mod.armorPen) parts.push('ignores armour');
  if (mod.suppress) parts.push('cannot attack');
  return `${mod.name}: ${parts.join(', ')}`;
}

/** Living, non-base units on a side. */
function livingUnits(world: World, side: Side): Unit[] {
  return world.units.filter((u) => !u.isBase && u.hp > 0 && u.side === side);
}

/** Distinct deities present among a set of units, in stable id order. */
function distinctDeities(units: readonly Unit[], deities: DeityIndex): Deity[] {
  const found = new Map<DeityId, Deity>();
  for (const unit of units) {
    const deity = deities.get(unit.deityId);
    if (deity !== undefined) found.set(deity.id, deity);
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Value of neutralising a unit outright. Refusing to fight a Titan is worth far more than refusing
 * to fight a Satyr, so suppression is priced off the target's cost rather than a flat bonus.
 */
function suppressionValue(target: Deity): number {
  return target.cost * 0.4;
}

/** Scores a candidate against one enemy, and explains itself. */
function scoreAgainst(
  candidate: Deity,
  enemy: Deity,
  graph: RelationGraph,
): { score: number; lines: AdviceLine[] } {
  const lines: AdviceLine[] = [];
  let score = 0;

  const ours = resolveCombat(candidate, enemy, graph);
  const theirs = resolveCombat(enemy, candidate, graph);

  for (const mod of ours) {
    if (mod.suppress) {
      score += suppressionValue(enemy);
      lines.push({
        text: `${candidate.name} ${PROSE[mod.name]} ${enemy.name}, which takes both of them out of the battle.`,
        detail: figures(mod),
        modifier: mod.name,
      });
      continue;
    }
    const combined = combineModifiers([mod]);
    score += (combined.damageMult - 1) * 90 + (combined.attackSpeedMult - 1) * 60;
    lines.push({
      text: `${candidate.name} ${PROSE[mod.name]} ${enemy.name}.`,
      detail: figures(mod),
      modifier: mod.name,
    });
  }

  // What the enemy gets in return matters just as much, and is easy to overlook.
  for (const mod of theirs) {
    if (mod.suppress) continue; // already counted from our side
    const combined = combineModifiers([mod]);
    score -= (combined.damageMult - 1) * 70;
    if (combined.damageMult > 1.05) {
      lines.push({
        text: `Be careful: ${enemy.name} ${PROSE[mod.name]} ${candidate.name} in return.`,
        detail: figures(mod),
        modifier: mod.name,
      });
    }
  }

  return { score, lines };
}

/** Scores the auras a candidate would gain or grant among units already fielded. */
function scoreSynergy(
  candidate: Deity,
  allies: readonly Deity[],
  graph: RelationGraph,
): { score: number; lines: AdviceLine[] } {
  const lines: AdviceLine[] = [];
  let score = 0;

  for (const ally of allies) {
    for (const mod of resolveAuras(candidate, [ally], [ally], graph)) {
      const combined = combineModifiers([mod]);
      const delta = (combined.damageMult - 1) + (combined.armorMult - 1) + (combined.attackSpeedMult - 1);
      score += delta * 55;
      lines.push({
        text: `Standing near ${ally.name}, ${candidate.name} ${PROSE[mod.name]} ${ally.name}.`,
        detail: figures(mod),
        modifier: mod.name,
      });
    }
    // The reverse direction: what the candidate would do for units already out there.
    for (const mod of resolveAuras(ally, [candidate], [candidate], graph)) {
      const combined = combineModifiers([mod]);
      const delta = (combined.damageMult - 1) + (combined.armorMult - 1) + (combined.attackSpeedMult - 1);
      score += delta * 55;
      lines.push({
        text: `${ally.name} ${PROSE[mod.name]} ${candidate.name}.`,
        detail: figures(mod),
        modifier: mod.name,
      });
    }
  }
  return { score, lines };
}

/** Flags the self-inflicted Jealousy trap before the player walks into it. */
function jealousyWarning(
  candidate: Deity,
  allies: readonly Deity[],
  graph: RelationGraph,
): AdviceLine | null {
  const field = [...allies, candidate];
  for (const subject of field) {
    const others = field.filter((d) => d.id !== subject.id);
    const mods = resolveAuras(subject, [], others, graph);
    const jealousy = mods.find((m) => m.name === 'Jealousy');
    if (jealousy !== undefined) {
      return {
        text: `Fielding ${candidate.name} puts ${subject.name} in the company of both their spouse and their lover at once. They will be badly distracted.`,
        detail: figures(jealousy),
        modifier: 'Jealousy',
      };
    }
  }
  return null;
}

/**
 * Reads the current battlefield from one side's point of view and ranks what to summon next.
 *
 * Recommendations are ordered best-first. Affordability is reported rather than filtered, so the
 * consultant can advise saving for the right unit instead of silently hiding it.
 */
export function readBoard(
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
  deck: readonly DeityId[],
  side: Side,
  faith: number,
): BoardRead {
  const enemySide: Side = side === 'player' ? 'enemy' : 'player';
  const enemies = distinctDeities(livingUnits(world, enemySide), deities);
  const allies = distinctDeities(livingUnits(world, side), deities);

  const threats: AdviceLine[] = [];
  for (const enemy of enemies) {
    threats.push({ text: `${enemy.name} is on the field.` });
  }

  const warnings: AdviceLine[] = [];
  const recommendations: Recommendation[] = [];

  for (const deityId of deck) {
    const candidate = deities.get(deityId);
    if (candidate === undefined) continue;

    const lines: AdviceLine[] = [];
    let score = 0;

    for (const enemy of enemies) {
      const result = scoreAgainst(candidate, enemy, graph);
      score += result.score;
      lines.push(...result.lines);
    }

    const synergy = scoreSynergy(candidate, allies, graph);
    score += synergy.score;
    lines.push(...synergy.lines);

    const jealousy = jealousyWarning(candidate, allies, graph);
    if (jealousy !== null) {
      score -= 45;
      lines.push(jealousy);
      warnings.push(jealousy);
    }

    // Cheap units are worth fielding on merit, not just relational upside; expensive ones must earn it.
    score -= candidate.cost * 0.06;

    recommendations.push({
      deityId,
      name: candidate.name,
      score,
      affordable: faith >= candidate.cost,
      lines,
    });
  }

  recommendations.sort((a, b) => b.score - a.score || a.deityId.localeCompare(b.deityId));
  return { threats, warnings, recommendations };
}

/**
 * Fraction of the faith cap above which the opponent stops holding out for a good matchup and
 * fields the best thing it can afford anyway.
 */
const BANK_PRESSURE = 0.6;

/**
 * The opponent's choice: the best-scoring unit it can currently afford, or null to keep banking.
 *
 * Two modes, deliberately. Given a relational advantage it takes it immediately. Given none — an
 * empty field, or nothing out there but unrelated chaff — every candidate scores at or below zero
 * once the cost penalty applies, and holding out for a good matchup would mean never summoning at
 * all. So once it is sitting on most of its bank it spends regardless. Patience, but not paralysis.
 *
 * It is the same reasoning shown to the player, so it deliberately does nothing the consultant
 * cannot explain.
 */
export function chooseSummon(
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
  deck: readonly DeityId[],
  side: Side,
  faith: number,
  faithCap = faith,
): DeityId | null {
  const read = readBoard(world, deities, graph, deck, side, faith);
  const affordable = read.recommendations.filter((r) => r.affordable);
  if (affordable.length === 0) return null;

  const favourable = affordable.find((r) => r.score > 0);
  if (favourable !== undefined) return favourable.deityId;

  const hoarding = faithCap > 0 && faith >= faithCap * BANK_PRESSURE;
  return hoarding ? (affordable[0]?.deityId ?? null) : null;
}

/** Upper bound on how good a matchup can get, useful for normalising a confidence read. */
export const MAX_MATCHUP_SCORE = (MAX_DAMAGE_MULT - 1) * 90;
