import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GREEK_DEITIES } from '../src/data/greek';
import {
  resetLayout, rowStep, unitFootY, unitHalfWidth, unitScreenX, updateLayout, worldToScreen,
} from '../src/render/layout';
import { LANE_Y, PLAYER_BASE_X } from '../src/sim/constants';
import type { Deity, Side, Unit, World } from '../src/sim/types';
import { getSettings, setSetting } from '../src/ui/settings';

const deities = new Map<string, Deity>(GREEK_DEITIES.map((d) => [d.id, d]));
const original = { unitGraphics: getSettings().unitGraphics, unitScale: getSettings().unitScale };

let nextId = 1;
function unit(deityId: string, side: Side, x: number, targetId: number | null = null): Unit {
  const deity = deities.get(deityId)!;
  return { id: nextId++, deityId, side, x, hp: deity.hp, maxHp: deity.hp, cooldown: 0, targetId, isBase: false };
}
function world(units: Unit[]): World {
  return { time: 0, units, faith: 0, faithMax: 0, faithRegen: 0, nextUnitId: nextId, outcome: 'ongoing', events: [] };
}
/** Runs the layout for two seconds of 60 fps frames, long enough for every ease to settle. */
function settle(w: World): void {
  for (let i = 0; i < 120; i++) updateLayout(w, deities, 1 / 60);
}
const row = (u: Unit): number => Math.round((unitFootY(u) - LANE_Y) / rowStep());
const half = (u: Unit): number => unitHalfWidth(deities.get(u.deityId));

beforeEach(() => { resetLayout(); nextId = 1; setSetting('unitGraphics', 'rig'); setSetting('unitScale', 1.45); });
afterEach(() => { setSetting('unitGraphics', original.unitGraphics); setSetting('unitScale', original.unitScale); });

describe('battlefield layout', () => {
  it('puts duelling units on one row with visible ground between them, each pushed toward its own side', () => {
    const a = unit('hoplite', 'player', 600);
    const b = unit('hoplite', 'enemy', 625);
    a.targetId = b.id;
    b.targetId = a.id;
    settle(world([a, b]));
    expect(row(a)).toBe(row(b));
    expect(unitScreenX(b) - unitScreenX(a)).toBeGreaterThanOrEqual((half(a) + half(b)) * 0.8);
    expect(unitScreenX(a)).toBeLessThanOrEqual(worldToScreen(a.x) + 0.01);
    expect(unitScreenX(b)).toBeGreaterThanOrEqual(worldToScreen(b.x) - 0.01);
  });

  it('spreads allies standing on the same spot into ranks behind the simulated position', () => {
    const pile = [unit('hoplite', 'player', 500), unit('satyr', 'player', 500), unit('hoplite', 'player', 500),
      unit('heracles', 'player', 500), unit('hoplite', 'player', 500), unit('satyr', 'player', 500)];
    settle(world(pile));
    const spots = new Set(pile.map((u) => `${Math.round(unitScreenX(u))}:${row(u)}`));
    expect(spots.size).toBe(pile.length);
    for (const u of pile) {
      expect(unitScreenX(u)).toBeLessThanOrEqual(worldToScreen(500) + 0.01);
      expect(unitScreenX(u)).toBeGreaterThanOrEqual(worldToScreen(500) - 96.01);
    }
    for (const a of pile) for (const b of pile) {
      if (a === b || row(a) !== row(b)) continue;
      expect(Math.abs(unitScreenX(a) - unitScreenX(b))).toBeGreaterThanOrEqual((half(a) + half(b)) * 0.9 - 0.5);
    }
  });

  it('fans extra attackers of one target onto neighbouring rows, the duel partner on its row', () => {
    const target = unit('ares', 'enemy', 640);
    const duel = unit('hoplite', 'player', 612, target.id);
    target.targetId = duel.id;
    const second = unit('hoplite', 'player', 610, target.id);
    const third = unit('satyr', 'player', 608, target.id);
    settle(world([target, duel, second, third]));
    expect(row(duel)).toBe(row(target));
    expect(new Set([row(duel), row(second), row(third)]).size).toBe(3);
  });

  it('keeps a long serpent on screen at its own base', () => {
    const typhon = unit('typhon', 'player', PLAYER_BASE_X);
    settle(world([typhon]));
    expect(unitScreenX(typhon)).toBeGreaterThan(worldToScreen(PLAYER_BASE_X));
  });
});
