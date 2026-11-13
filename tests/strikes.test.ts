import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GREEK_DEITIES } from '../src/data/greek';
import { resetLayout, updateLayout } from '../src/render/layout';
import { drawStrikes, dueImpacts, pendingImpactUntil, resetStrikes, scheduleStrikes } from '../src/render/strikes';
import type { Deity, SimEvent, Side, Unit, World } from '../src/sim/types';
import { getSettings, setSetting } from '../src/ui/settings';

const deities = new Map<string, Deity>(GREEK_DEITIES.map((d) => [d.id, d]));
const original = getSettings().unitGraphics;

function unit(id: number, deityId: string, side: Side, x: number, targetId: number): Unit {
  return { id, deityId, side, x, hp: 100, maxHp: 200, cooldown: 0, targetId, isBase: false };
}
function world(units: Unit[], events: SimEvent[] = []): World {
  return { time: 0, units, faith: 0, faithMax: 0, faithRegen: 0, nextUnitId: 99, outcome: 'ongoing', events };
}
/** A context that only counts what would be painted. */
function countingCtx() {
  const calls = { stroke: 0, fill: 0 };
  const noop = (): void => {};
  const ctx = new Proxy({}, {
    get: (_t, key) => (key === 'stroke' ? () => { calls.stroke++; } : key === 'fill' ? () => { calls.fill++; } : noop),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

beforeEach(() => { resetLayout(); resetStrikes(); setSetting('unitGraphics', 'rig'); });
afterEach(() => setSetting('unitGraphics', original));

describe('attack traces', () => {
  const archer = unit(1, 'artemis', 'player', 480, 2);
  const target = unit(2, 'hoplite', 'enemy', 540, 1);
  const hit: SimEvent = { kind: 'hit', attackerId: 1, defenderId: 2, damage: 60, baseDamage: 60, modifiers: [] };

  it('lands a figure\'s blow at its strike frame, not when the simulation resolves it', () => {
    updateLayout(world([archer, target]), deities, 1 / 60);
    scheduleStrikes(world([archer, target], [hit]), deities, 10);
    expect(dueImpacts()).toHaveLength(0);
    const landsAt = pendingImpactUntil(2);
    expect(landsAt).toBeGreaterThan(10.25);
    expect(landsAt).toBeLessThan(10.7);

    scheduleStrikes(world([archer, target]), deities, landsAt + 0.001);
    expect(dueImpacts()).toEqual([hit]);
    expect(pendingImpactUntil(2)).toBe(0);
  });

  it('draws a projectile in flight and a spark on impact for a ranged attacker', () => {
    updateLayout(world([archer, target]), deities, 1 / 60);
    scheduleStrikes(world([archer, target], [hit]), deities, 10);
    const landsAt = pendingImpactUntil(2);

    const before = countingCtx();
    drawStrikes(before.ctx, 10.1);
    expect(before.calls.stroke).toBe(0);

    const flight = countingCtx();
    drawStrikes(flight.ctx, landsAt - 0.02);
    expect(flight.calls.stroke).toBeGreaterThan(0);
    expect(flight.calls.fill).toBeGreaterThan(0);

    const impact = countingCtx();
    drawStrikes(impact.ctx, landsAt + 0.05);
    expect(impact.calls.stroke).toBeGreaterThan(0);
  });

  it('keeps a killing blow drawable after the defender has left the world', () => {
    updateLayout(world([archer, target]), deities, 1 / 60);
    scheduleStrikes(world([archer, target], [hit]), deities, 10);
    updateLayout(world([archer]), deities, 1 / 60);
    const landsAt = pendingImpactUntil(2);
    const impact = countingCtx();
    drawStrikes(impact.ctx, landsAt + 0.05);
    expect(impact.calls.stroke).toBeGreaterThan(0);
  });

  it('draws nothing for a prevented (Entranced) attack', () => {
    updateLayout(world([archer, target]), deities, 1 / 60);
    scheduleStrikes(world([archer, target], [{ ...hit, damage: 0 }]), deities, 10);
    expect(pendingImpactUntil(2)).toBe(0);
  });
});
