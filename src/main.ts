/**
 * Entry point and fixed-timestep loop — owned by WP-0 (integrator).
 *
 * The simulation advances in fixed TICK_DT steps regardless of display refresh rate, so battles
 * are reproducible. Rendering happens once per animation frame, after catch-up.
 */

import { GREEK_DEITIES, GREEK_EDGES } from './data/greek';
import { SHOWCASE_STAGE } from './data/stages';
import { drawEffects } from './render/effects';
import { drawWorld } from './render/draw';
import { MAX_FRAME_DT, TICK_DT } from './sim/constants';
import { buildGraph } from './sim/relations';
import { createRng } from './sim/rng';
import type { Deity, DeityId, DeityIndex, StageWave } from './sim/types';
import { createWorld, spawnUnit, tickWorld } from './sim/world';
import { mountHud } from './ui/hud';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const hudRoot = document.querySelector<HTMLElement>('#hud');
if (canvas === null || hudRoot === null) throw new Error('index.html is missing #stage or #hud');

const maybeCtx = canvas.getContext('2d');
if (maybeCtx === null) throw new Error('2D canvas context unavailable');
const ctx: CanvasRenderingContext2D = maybeCtx;

const stage = SHOWCASE_STAGE;
const deities: DeityIndex = new Map(GREEK_DEITIES.map((deity) => [deity.id, deity]));
const graph = buildGraph(GREEK_EDGES);
const rng = createRng(0x5eed);
const world = createWorld(stage, deities);

/** Waves not yet spawned, ascending by time. */
const pendingWaves: StageWave[] = [...stage.waves].sort((a, b) => a.at - b.at);

/** Summons requested since the last tick. Drained on a tick boundary so input never desyncs the sim. */
const summonQueue: DeityId[] = [];

const deck: Deity[] = stage.playerDeck
  .map((id) => deities.get(id))
  .filter((deity): deity is Deity => deity !== undefined);

const hud = mountHud(hudRoot, deck, (deityId) => summonQueue.push(deityId));

/** Spawns any scripted waves whose time has arrived, and any queued player summons. */
function processSpawns(): void {
  for (;;) {
    const wave = pendingWaves[0];
    if (wave === undefined || wave.at > world.time) break;
    pendingWaves.shift();
    const deity = deities.get(wave.deityId);
    if (deity !== undefined) spawnUnit(world, deity, wave.side);
  }

  for (;;) {
    const deityId = summonQueue.shift();
    if (deityId === undefined) break;
    const deity = deities.get(deityId);
    if (deity === undefined || world.faith < deity.cost) continue;
    world.faith -= deity.cost;
    spawnUnit(world, deity, 'player');
  }
}

let previous = performance.now();
let accumulator = 0;

function frame(now: number): void {
  const elapsed = Math.min((now - previous) / 1000, MAX_FRAME_DT);
  previous = now;
  accumulator += elapsed;

  while (accumulator >= TICK_DT) {
    processSpawns();
    tickWorld(world, TICK_DT, graph, deities, rng);
    accumulator -= TICK_DT;
  }

  drawWorld(ctx, world, deities);
  drawEffects(ctx, world, deities, graph, elapsed);
  world.events.length = 0;
  hud.update(world);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
