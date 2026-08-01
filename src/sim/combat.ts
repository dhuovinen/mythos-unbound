/**
 * Combat resolution and targeting engine — WP-2.
 *
 * Implements unit targeting, movement halting, attack cooldown management, relational modifier
 * application, damage calculation, unit death, and outcome evaluation. Pure functions only.
 */

import { AURA_RADIUS, LANE_LENGTH } from './constants';
import { combineModifiers, resolveAuras, resolveCombat } from './relations';
import type { Deity, DeityIndex, Modifier, RelationGraph, Rng, Unit, World } from './types';

/** Dummy Deity representation for base units so relation functions receive a valid object. */
const BASE_DEITY: Deity = {
  id: 'base',
  name: 'Base',
  pantheon: 'greek',
  tier: 'chaff',
  cost: 0,
  hp: 1,
  damage: 0,
  attackInterval: 9999,
  range: 0,
  speed: 0,
  armor: 0,
  traits: [],
};

/** Result of an attack evaluation containing damage dealt, suppression status, and active modifiers. */
export interface AttackResult {
  readonly damage: number;
  readonly suppressed: boolean;
  readonly modifiers: readonly Modifier[];
}

/** Finds the nearest living enemy unit within attack range, breaking ties by lowest ID. */
export function findTarget(
  attacker: Unit,
  attackerDeity: Deity,
  units: readonly Unit[],
): Unit | null {
  let bestTarget: Unit | null = null;
  let minDistance = Infinity;

  for (const candidate of units) {
    if (candidate.side === attacker.side || candidate.hp <= 0) continue;
    const distance = Math.abs(attacker.x - candidate.x);
    if (distance <= attackerDeity.range) {
      if (distance < minDistance) {
        minDistance = distance;
        bestTarget = candidate;
      } else if (distance === minDistance) {
        if (bestTarget === null || candidate.id < bestTarget.id) {
          bestTarget = candidate;
        }
      }
    }
  }

  return bestTarget;
}

/** Evaluates and applies an attack between attacker and defender, returning damage and modifiers. */
export function resolveAttack(
  attacker: Unit,
  defender: Unit,
  units: readonly Unit[],
  graph: RelationGraph,
  deities: DeityIndex,
): AttackResult {
  const attackerDeity = deities.get(attacker.deityId);
  if (attackerDeity === undefined) {
    return { damage: 0, suppressed: false, modifiers: [] };
  }

  const defenderDeity = defender.isBase ? BASE_DEITY : deities.get(defender.deityId) ?? BASE_DEITY;

  const combatMods = defender.isBase ? [] : resolveCombat(attackerDeity, defenderDeity, graph);

  const nearbyAllies: Deity[] = [];
  const fieldAllies: Deity[] = [];

  for (const u of units) {
    if (u.side === attacker.side && u.hp > 0 && !u.isBase && u.id !== attacker.id) {
      const d = deities.get(u.deityId);
      if (d !== undefined) {
        fieldAllies.push(d);
        if (Math.abs(attacker.x - u.x) <= AURA_RADIUS) {
          nearbyAllies.push(d);
        }
      }
    }
  }

  const auraMods = resolveAuras(attackerDeity, nearbyAllies, fieldAllies, graph);
  const allMods = [...combatMods, ...auraMods];
  const combined = combineModifiers(allMods);

  if (combined.suppress) {
    // Entranced. The attacker refuses to strike, but it still spends its cooldown — otherwise the
    // attempt re-evaluates every single tick and floods the event stream at 60/s.
    attacker.cooldown = attackerDeity.attackInterval / combined.attackSpeedMult;
    return { damage: 0, suppressed: true, modifiers: allMods };
  }

  let defenderArmor = 0;
  if (!combined.armorPen && !defender.isBase && defenderDeity.armor > 0) {
    const defNearbyAllies: Deity[] = [];
    const defFieldAllies: Deity[] = [];
    for (const u of units) {
      if (u.side === defender.side && u.hp > 0 && !u.isBase && u.id !== defender.id) {
        const d = deities.get(u.deityId);
        if (d !== undefined) {
          defFieldAllies.push(d);
          if (Math.abs(defender.x - u.x) <= AURA_RADIUS) {
            defNearbyAllies.push(d);
          }
        }
      }
    }
    const defAuraMods = resolveAuras(defenderDeity, defNearbyAllies, defFieldAllies, graph);
    const defCombined = combineModifiers(defAuraMods);
    defenderArmor = defenderDeity.armor * defCombined.armorMult;
  }

  const rawDamage = attackerDeity.damage * combined.damageMult;
  const damage = Math.max(1, rawDamage - defenderArmor);

  attacker.cooldown = attackerDeity.attackInterval / combined.attackSpeedMult;
  defender.hp -= damage;

  return { damage, suppressed: false, modifiers: allMods };
}

/** Processes movement, targeting, attacks, deaths, and victory conditions for one tick. */
export function processCombat(
  world: World,
  dt: number,
  graph: RelationGraph,
  deities: DeityIndex,
  rng: Rng,
): void {
  void rng;

  for (const unit of world.units) {
    if (unit.hp <= 0 || unit.isBase) continue;

    const deity = deities.get(unit.deityId);
    if (deity === undefined) continue;

    unit.cooldown = Math.max(0, unit.cooldown - dt);

    const target = findTarget(unit, deity, world.units);
    unit.targetId = target ? target.id : null;

    if (target !== null) {
      if (unit.cooldown <= 0) {
        const attackResult = resolveAttack(unit, target, world.units, graph, deities);
        // Emitted even when suppressed, with damage 0. A suppressed attack is the single most
        // dramatic thing the relational engine does — two units refusing to fight — and if it
        // emits nothing, the render layer can never announce it. Consumers must treat
        // damage === 0 as "attack prevented" and skip the damage number while keeping the tag.
        const modNames = Array.from(new Set(attackResult.modifiers.map((m) => m.name)));
        world.events.push({
          kind: 'hit',
          attackerId: unit.id,
          defenderId: target.id,
          damage: attackResult.damage,
          modifiers: modNames,
        });
      }
    } else {
      const dir = unit.side === 'player' ? 1 : -1;
      unit.x = Math.max(0, Math.min(LANE_LENGTH, unit.x + deity.speed * dir * dt));
    }
  }

  const deadUnits: number[] = [];
  for (const unit of world.units) {
    if (!unit.isBase && unit.hp <= 0) {
      deadUnits.push(unit.id);
    }
  }

  for (const id of deadUnits) {
    world.events.push({ kind: 'death', unitId: id });
  }

  if (deadUnits.length > 0) {
    world.units = world.units.filter((u) => u.isBase || u.hp > 0);
  }

  const playerBase = world.units.find((u) => u.isBase && u.side === 'player');
  const enemyBase = world.units.find((u) => u.isBase && u.side === 'enemy');

  if (enemyBase && enemyBase.hp <= 0) {
    world.outcome = 'victory';
  } else if (playerBase && playerBase.hp <= 0) {
    world.outcome = 'defeat';
  }
}
