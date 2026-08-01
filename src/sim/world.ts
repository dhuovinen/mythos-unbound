/**
 * STUB — owned by WP-2. Replace this file wholesale.
 *
 * Movement and faith only, so the scaffold is verifiably runnable. No targeting, no combat,
 * no win/lose detection — that is WP-2's job.
 */

import { ENEMY_BASE_X, LANE_LENGTH, PLAYER_BASE_X } from './constants';
import type { CreateWorld, SpawnUnit, TickWorld, Unit } from './types';

/** Builds initial world state from a stage definition, including both base units. */
export const createWorld: CreateWorld = (stage, deities) => {
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

  void deities;
  return world;
};

/** Appends a unit to the world and emits a 'spawn' event. */
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

/** Advances the world by exactly one fixed step. */
export const tickWorld: TickWorld = (world, dt, graph, deities, rng) => {
  world.time += dt;
  world.faith = Math.min(world.faithMax, world.faith + world.faithRegen * dt);

  for (const unit of world.units) {
    if (unit.isBase) continue;
    const deity = deities.get(unit.deityId);
    if (deity === undefined) continue;
    const dir = unit.side === 'player' ? 1 : -1;
    unit.x = Math.max(0, Math.min(LANE_LENGTH, unit.x + deity.speed * dir * dt));
  }

  void graph;
  void rng;
};
