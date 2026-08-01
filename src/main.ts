/**
 * Entry point and fixed-timestep loop — owned by WP-0 (integrator).
 *
 * The simulation advances in fixed TICK_DT steps regardless of display refresh rate, so battles
 * are reproducible. Rendering happens once per animation frame, after catch-up.
 */

import { GREEK_DEITIES, GREEK_EDGES } from './data/greek';
import { NORSE_DEITIES, NORSE_EDGES } from './data/norse';
import { SHOWCASE_STAGE } from './data/stages';
import { drawEffects } from './render/effects';
import { drawWorld } from './render/draw';
import { MAX_FRAME_DT, TICK_DT } from './sim/constants';
import { buildGraph } from './sim/relations';
import { createRng } from './sim/rng';
import type { Deity, DeityId, DeityIndex, StageWave } from './sim/types';
import { preloadSprites } from './render/sprites';
import { chooseSummon } from './sim/advisor';
import { createWorld, spawnUnit, tickWorld } from './sim/world';
import { mountAdminPanel } from './ui/admin';
import { mountCodex } from './ui/codex';
import { mountConsultant } from './ui/consultant';
import { mountDeckBuilder } from './ui/deckbuilder';
import { mountHud } from './ui/hud';
import { getSettings } from './ui/settings';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const hudRoot = document.querySelector<HTMLElement>('#hud');
if (canvas === null || hudRoot === null) throw new Error('index.html is missing #stage or #hud');

const maybeCtx = canvas.getContext('2d');
if (maybeCtx === null) throw new Error('2D canvas context unavailable');
const ctx: CanvasRenderingContext2D = maybeCtx;

const stage = SHOWCASE_STAGE;

/**
 * Both pantheons are loaded into one roster and one graph. That is safe because relations resolve
 * only within a pantheon — a Greek unit and a Norse one simply have no edges between them, which is
 * exactly the cross-pantheon rule the design rests on.
 */
const ALL_DEITIES: readonly Deity[] = [...GREEK_DEITIES, ...NORSE_DEITIES];
const ALL_EDGES = [...GREEK_EDGES, ...NORSE_EDGES];

const deities: DeityIndex = new Map(ALL_DEITIES.map((deity) => [deity.id, deity]));
const graph = buildGraph(ALL_EDGES);
const rng = createRng(0x5eed);
const world = createWorld(stage, deities);

/** The player's chosen deck, falling back to whatever the stage supplies. */
const playerDeck: readonly DeityId[] = getSettings().deck ?? stage.playerDeck;

/** Waves not yet spawned, ascending by time. */
const pendingWaves: StageWave[] = [...stage.waves].sort((a, b) => a.at - b.at);

/** Summons requested since the last tick. Drained on a tick boundary so input never desyncs the sim. */
const summonQueue: DeityId[] = [];

const deck: Deity[] = playerDeck
  .map((id) => deities.get(id))
  .filter((deity): deity is Deity => deity !== undefined);

const hud = mountHud(hudRoot, deck, (deityId) => summonQueue.push(deityId));

mountCodex(ALL_DEITIES, ALL_EDGES);
mountAdminPanel();
preloadSprites(ALL_DEITIES.map((deity) => deity.id));

// Applying a deck restarts the battle. A reload is the honest way to do that: the deck is persisted,
// and half-swapping a roster into a battle already in progress would leave the world inconsistent.
mountDeckBuilder(ALL_DEITIES, graph, stage.playerDeck, () => window.location.reload());

const consultant = mountConsultant(deities, graph, playerDeck);

/**
 * The opponent runs its own economy on the same terms as the player and picks counters with the
 * same rule engine the consultant reads from. It sits on top of the scripted timeline rather than
 * replacing it, so the showcase beats still happen and the regression tests still hold.
 */
// The opponent draws from the full roster across both pantheons. Because the advisor rewards
// relational leverage, it naturally gravitates toward the player's own pantheon — bringing kin to
// use against them — which is the counter-play the cross-pantheon choice is meant to provoke.
const enemyDeck: DeityId[] = ALL_DEITIES.map((deity) => deity.id);
let enemyFaith = stage.startingFaith;
let enemyThinkTimer = 0;

/** Seconds between opponent decisions — it deliberates rather than dumping its whole bank at once. */
const ENEMY_THINK_INTERVAL = 2.5;

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

  if (!getSettings().enemyAi || world.outcome !== 'ongoing') return;

  enemyFaith = Math.min(stage.faithMax, enemyFaith + stage.faithRegen * TICK_DT);
  enemyThinkTimer -= TICK_DT;
  if (enemyThinkTimer > 0) return;
  enemyThinkTimer = ENEMY_THINK_INTERVAL;

  const choice = chooseSummon(world, deities, graph, enemyDeck, 'enemy', enemyFaith, stage.faithMax);
  if (choice === null) return;
  const chosen = deities.get(choice);
  if (chosen === undefined || enemyFaith < chosen.cost) return;
  enemyFaith -= chosen.cost;
  spawnUnit(world, chosen, 'enemy');
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
  consultant.update(world, world.faith, elapsed);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
