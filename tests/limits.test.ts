import { describe, expect, it } from 'vitest';
import { GREEK_DEITIES } from '../src/data/greek';
import { SHOWCASE_STAGE } from '../src/data/stages';
import { MAX_FIELD_UNITS, MAX_HEAVY_UNITS, deployBlock, fieldCounts } from '../src/sim/limits';
import type { Deity } from '../src/sim/types';
import { createWorld, spawnUnit } from '../src/sim/world';

const deities = new Map(GREEK_DEITIES.map((d) => [d.id, d]));
const get = (id: string): Deity => deities.get(id) as Deity;

function freshWorld() {
  return createWorld(SHOWCASE_STAGE, deities);
}

describe('field limits', () => {
  it('lets a side summon freely on an empty field', () => {
    const world = freshWorld();
    expect(deployBlock(world, deities, get('hoplite'), 'player')).toBeNull();
    expect(deployBlock(world, deities, get('zeus'), 'player')).toBeNull();
  });

  it('does not count bases', () => {
    expect(fieldCounts(freshWorld(), deities, 'player')).toEqual({ units: 0, heavy: 0 });
  });

  it('stops a ninth unit and names the field as the reason', () => {
    const world = freshWorld();
    for (let i = 0; i < MAX_FIELD_UNITS; i++) spawnUnit(world, get('hoplite'), 'player');
    expect(deployBlock(world, deities, get('hoplite'), 'player')).toBe('field');
    expect(deployBlock(world, deities, get('zeus'), 'player')).toBe('field');
  });

  it('allows only two gods or titans, counted together', () => {
    const world = freshWorld();
    spawnUnit(world, get('zeus'), 'player');
    spawnUnit(world, get('cronus'), 'player');
    expect(fieldCounts(world, deities, 'player').heavy).toBe(MAX_HEAVY_UNITS);
    expect(deployBlock(world, deities, get('hera'), 'player')).toBe('heavy');
    expect(deployBlock(world, deities, get('typhon'), 'player')).toBe('heavy');
  });

  it('still allows lighter units once the heavy limit is reached', () => {
    const world = freshWorld();
    spawnUnit(world, get('zeus'), 'player');
    spawnUnit(world, get('hera'), 'player');
    expect(deployBlock(world, deities, get('heracles'), 'player')).toBeNull();
    expect(deployBlock(world, deities, get('hoplite'), 'player')).toBeNull();
  });

  it('counts each side separately', () => {
    const world = freshWorld();
    for (let i = 0; i < MAX_FIELD_UNITS; i++) spawnUnit(world, get('hoplite'), 'player');
    expect(deployBlock(world, deities, get('hoplite'), 'enemy')).toBeNull();
  });
});
