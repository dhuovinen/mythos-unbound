/**
 * Entry point and fixed-timestep loop — owned by WP-0 (integrator).
 *
 * The simulation advances in fixed TICK_DT steps regardless of display refresh rate, so battles
 * are reproducible. Rendering happens once per animation frame, after catch-up.
 */

import { EGYPTIAN_DEITIES, EGYPTIAN_EDGES } from './data/egyptian';
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
import { createHand, playFrom } from './sim/hand';
import { createWorld, spawnUnit, tickWorld } from './sim/world';
import { mountAdminPanel } from './ui/admin';
import { mountCodex } from './ui/codex';
import { mountConsultant } from './ui/consultant';
import { mountDraftScreen } from './ui/draftscreen';
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
const ALL_DEITIES: readonly Deity[] = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES];
const ALL_EDGES = [...GREEK_EDGES, ...NORSE_EDGES, ...EGYPTIAN_EDGES];

const deities: DeityIndex = new Map(ALL_DEITIES.map((deity) => [deity.id, deity]));
const graph = buildGraph(ALL_EDGES);
const rng = createRng(0x5eed);
const world = createWorld(stage, deities);

/** The player's chosen deck, falling back to whatever the stage supplies. */
const playerDeck: readonly DeityId[] = getSettings().deck ?? stage.playerDeck;

/** Waves not yet spawned, ascending by time. */
const pendingWaves: StageWave[] = [...stage.waves].sort((a, b) => a.at - b.at);

/**
 * Slot indices requested since the last tick. Drained on a tick boundary so input never desyncs the
 * sim. Slots, not ids: which unit occupies a slot changes as the hand cycles, and the player is
 * pressing a position on screen.
 */
const summonQueue: number[] = [];

/** The cycling hand. Only its visible slots are summonable; the rest arrive as cards are played. */
let hand = createHand(playerDeck);

/** Resolves a list of ids to deities, dropping anything unknown. */
const toDeities = (ids: readonly DeityId[]): Deity[] =>
  ids.map((id) => deities.get(id)).filter((deity): deity is Deity => deity !== undefined);

const hud = mountHud(hudRoot, (slotIndex) => summonQueue.push(slotIndex));

mountCodex(ALL_DEITIES, ALL_EDGES);
mountAdminPanel();
preloadSprites(ALL_DEITIES.map((deity) => deity.id));

// Applying a deck restarts the battle. A reload is the honest way to do that: the deck is persisted,
// and half-swapping a roster into a battle already in progress would leave the world inconsistent.
mountDraftScreen(ALL_DEITIES, graph, () => window.location.reload());

const consultant = mountConsultant(deities, graph, playerDeck);

/**
 * The opponent runs its own economy on the same terms as the player and picks counters with the
 * same rule engine the consultant reads from. It sits on top of the scripted timeline rather than
 * replacing it, so the showcase beats still happen and the regression tests still hold.
 */
/**
 * The opponent plays the deck it drafted — an opening chosen blind, then reinforcements chosen
 * after seeing the player's opening. Without a draft it improvises from the whole roster, which is
 * strictly stronger, so an undrafted battle is the harder one.
 */
const enemyDeck: readonly DeityId[] =
  getSettings().opponentDeck ?? ALL_DEITIES.map((deity) => deity.id);
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
    const slotIndex = summonQueue.shift();
    if (slotIndex === undefined) break;
    const deityId = hand.slots[slotIndex];
    if (deityId === undefined) continue;
    const deity = deities.get(deityId);
    if (deity === undefined || world.faith < deity.cost) continue;
    world.faith -= deity.cost;
    spawnUnit(world, deity, 'player');
    // Played units cycle to the back; the next reinforcement takes the slot they vacated.
    hand = playFrom(hand, slotIndex);
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
  hud.update(world, toDeities(hand.slots), toDeities(hand.queue));
  consultant.update(world, world.faith, elapsed);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
