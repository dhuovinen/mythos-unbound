/**
 * Simulation world state management and tick execution — WP-2.
 *
 * Owns world construction, unit spawning, faith regeneration, time advancement, and fixed-timestep
 * simulation tick execution. Pure functions only.
 */

import { processCombat } from './combat';
import { ENEMY_BASE_X, PLAYER_BASE_X } from './constants';
import type { CreateWorld, SpawnUnit, TickWorld, Unit } from './types';

/** Builds initial world state from a stage definition, including both base units. */
export const createWorld: CreateWorld = (stage, deities) => {
  void deities;
  const world = {
    time: 0,
    units: [] as Unit[],
    faith: stage.startingFaith,
    faithMax: stage.faithMax,
    faithRegen: stage.faithRegen,
    nextUnitId: 1,
    outcome: 'ongoing' as const,
    events: [],
  };

  for (const side of ['player', 'enemy'] as const) {
    const hp = side === 'player' ? stage.playerBaseHp : stage.enemyBaseHp;
    world.units.push({
      id: world.nextUnitId++,
      deityId: `${side}-base`,
      side,
      x: side === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X,
      hp,
      maxHp: hp,
      cooldown: 0,
      targetId: null,
      isBase: true,
    });
  }

  return world;
};

/** Appends a unit to the world and emits a 'spawn' event. Returns the new unit. */
export const spawnUnit: SpawnUnit = (world, deity, side) => {
  const unit: Unit = {
    id: world.nextUnitId++,
    deityId: deity.id,
    side,
    x: side === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X,
    hp: deity.hp,
    maxHp: deity.hp,
    cooldown: 0,
    targetId: null,
    isBase: false,
  };
  world.units.push(unit);
  world.events.push({ kind: 'spawn', unitId: unit.id });
  return unit;
};

/** Advances the world by exactly one fixed step. Mutates world in place. */
export const tickWorld: TickWorld = (world, dt, graph, deities, rng) => {
  if (world.outcome !== 'ongoing') {
    return;
  }

  world.time += dt;
  world.faith = Math.min(world.faithMax, world.faith + world.faithRegen * dt);

  processCombat(world, dt, graph, deities, rng);
};
