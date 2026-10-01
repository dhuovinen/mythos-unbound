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
import { setBackdropScale } from './render/backdrops';
import { drawWorld, setAutoBackdrop } from './render/draw';
import { pantheonsOf } from './sim/draft';
import { CANVAS_HEIGHT, CANVAS_WIDTH, MAX_FRAME_DT, TICK_DT } from './sim/constants';
import { buildGraph } from './sim/relations';
import { createRng } from './sim/rng';
import type { Deity, DeityId, DeityIndex, Pantheon, StageWave } from './sim/types';
import { preloadArt } from './render/art/sprites';
import { chooseSummon } from './sim/advisor';
import { createBattleLog, noteDeployment, recordEvents } from './sim/battlelog';
import { createHand, playFrom } from './sim/hand';
import { BLOCK_LABEL, deployBlock, fieldCounts, MAX_FIELD_UNITS, MAX_HEAVY_UNITS } from './sim/limits';
import { createWorld, spawnUnit, tickWorld } from './sim/world';
import type { ResolveResult } from './ui/admin';
import { mountAdminPanel } from './ui/admin';
import { mountCodex } from './ui/codex';
import { mountConsultant } from './ui/consultant';
import { mountDraftScreen } from './ui/draftscreen';
import { mountHud, setFieldStatus } from './ui/hud';
import { mountReport } from './ui/report';
import { getSettings } from './ui/settings';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const hudRoot = document.querySelector<HTMLElement>('#hud');
if (canvas === null || hudRoot === null) throw new Error('index.html is missing #stage or #hud');

const maybeCtx = canvas.getContext('2d');
if (maybeCtx === null) throw new Error('2D canvas context unavailable');
const ctx: CanvasRenderingContext2D = maybeCtx;

/**
 * The canvas is shown as large as the window allows (see index.html). Its drawing buffer is sized to
 * match, so scenery and figures stay sharp, while everything is still drawn in the fixed logical
 * 960x540 coordinates the game uses — `renderScale` is the one number that bridges them.
 */
let renderScale = 1;
function fitCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  const shown = canvas?.clientWidth ?? CANVAS_WIDTH;
  renderScale = Math.min(2.5, Math.max(1, (shown * dpr) / CANVAS_WIDTH));
  if (canvas === null) return;
  canvas.width = Math.round(CANVAS_WIDTH * renderScale);
  canvas.height = Math.round(CANVAS_HEIGHT * renderScale);
  setBackdropScale(renderScale);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

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

// One pantheon fights in its own realm; a mixed deck fights in the open-world city.
const deckRealms = pantheonsOf(playerDeck, ALL_DEITIES);
setAutoBackdrop(deckRealms.length === 1 ? (deckRealms[0] as Pantheon) : 'openworld');

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

/**
 * Records every attack for the post-match report. Deployments are noted here rather than derived
 * from spawn events, because a unit that dies is removed from the world and its identity would be
 * gone before the report is built.
 */
const battleLog = createBattleLog();

/** Spawns a unit and registers it with the battle log. All spawns go through this. */
function deploy(deity: Deity, side: 'player' | 'enemy'): void {
  const unit = spawnUnit(world, deity, side);
  noteDeployment(battleLog, unit.id, deity.id, side, deity.cost);
}

const hud = mountHud(hudRoot, (slotIndex) => summonQueue.push(slotIndex));
const report = mountReport(battleLog, deities);

mountCodex(ALL_DEITIES, ALL_EDGES);
preloadArt();

// Applying a deck restarts the battle. A reload is the honest way to do that: the deck is persisted,
// and half-swapping a roster into a battle already in progress would leave the world inconsistent.
mountDraftScreen(ALL_DEITIES, graph, () => window.location.reload());

const consultant = mountConsultant(deities, graph, playerDeck);

/**
 * The opponent runs its own economy on the same terms as the player and picks counters with the
 * same rule engine the consultant reads from. It sits on top of the scripted timeline rather than
 * replacing it, so the showcase beats still happen and the regression tests still hold.
 *
 * It plays the deck it drafted — an opening chosen blind, then reinforcements chosen
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
    if (deity !== undefined) deploy(deity, wave.side);
  }

  for (;;) {
    const slotIndex = summonQueue.shift();
    if (slotIndex === undefined) break;
    const deityId = hand.slots[slotIndex];
    if (deityId === undefined) continue;
    const deity = deities.get(deityId);
    if (deity === undefined || world.faith < deity.cost) continue;
    // A refused summon costs nothing: the faith is only spent once the unit is allowed on the field.
    if (deployBlock(world, deities, deity, 'player') !== null) continue;
    world.faith -= deity.cost;
    deploy(deity, 'player');
    // Played units cycle to the back; the next reinforcement takes the slot they vacated.
    hand = playFrom(hand, slotIndex);
  }

  if (!getSettings().enemyAi || world.outcome !== 'ongoing') return;

  enemyFaith = Math.min(stage.faithMax, enemyFaith + stage.faithRegen * TICK_DT);
  enemyThinkTimer -= TICK_DT;
  if (enemyThinkTimer > 0) return;
  enemyThinkTimer = ENEMY_THINK_INTERVAL;

  // The opponent obeys the same field limits, so it only considers what it may actually summon.
  const allowed = enemyDeck.filter((id) => {
    const candidate = deities.get(id);
    return candidate !== undefined && deployBlock(world, deities, candidate, 'enemy') === null;
  });
  const choice = chooseSummon(world, deities, graph, allowed, 'enemy', enemyFaith, stage.faithMax);
  if (choice === null) return;
  const chosen = deities.get(choice);
  if (chosen === undefined || enemyFaith < chosen.cost) return;
  enemyFaith -= chosen.cost;
  deploy(chosen, 'enemy');
}

/** Seconds between the auto-player's decisions during a fast-forward. Matches the opponent's pace. */
const AUTO_THINK_INTERVAL = 2.5;
let autoThinkTimer = 0;

/**
 * Plays the player's side with the same rule engine the opponent uses, respecting the cycling hand
 * — it can only summon what is actually in a slot. Used only while fast-forwarding.
 */
function autoSummonForPlayer(): void {
  autoThinkTimer -= TICK_DT;
  if (autoThinkTimer > 0) return;
  autoThinkTimer = AUTO_THINK_INTERVAL;

  const summonable = hand.slots.filter((id) => {
    const candidate = deities.get(id);
    return candidate !== undefined && deployBlock(world, deities, candidate, 'player') === null;
  });
  const choice = chooseSummon(world, deities, graph, summonable, 'player', world.faith, stage.faithMax);
  if (choice === null) return;
  const slot = hand.slots.indexOf(choice);
  if (slot >= 0) summonQueue.push(slot);
}

/** Sim seconds a fast-forward will run before giving up on a stalemate. */
const RESOLVE_BUDGET_SECONDS = 400;

/**
 * Fast-forwards the battle to its conclusion.
 *
 * Deliberately runs the identical tick path the animation loop uses — same spawns, same tickWorld,
 * same event recording — just without waiting for frames. So the outcome is genuinely what would
 * have happened if the battle were played out, not a separate approximation of it.
 *
 * It blocks the main thread while it runs, which is fine for a testing aid and is why the budget
 * exists: a true stalemate would otherwise never terminate.
 */
function resolveInstantly(): ResolveResult {
  const started = performance.now();
  const startedAt = world.time;
  const maxTicks = Math.round(RESOLVE_BUDGET_SECONDS / TICK_DT);
  let ticks = 0;

  while (world.outcome === 'ongoing' && ticks < maxTicks) {
    autoSummonForPlayer();
    processSpawns();
    tickWorld(world, TICK_DT, graph, deities, rng);
    recordEvents(battleLog, world.events, world.time);
    world.events.length = 0;
    ticks++;
  }

  // The report normally surfaces itself from the animation loop; drive it directly so this works
  // even when frames are not running.
  report.update(world.outcome);

  return {
    outcome: world.outcome === 'victory' ? 'Victory' : world.outcome === 'defeat' ? 'Defeat' : 'No result',
    simulatedSeconds: world.time - startedAt,
    realMilliseconds: performance.now() - started,
    hitBudget: world.outcome === 'ongoing',
  };
}

mountAdminPanel(resolveInstantly);

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

  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  drawWorld(ctx, world, deities);
  drawEffects(ctx, world, deities, graph, elapsed);
  recordEvents(battleLog, world.events, world.time);
  world.events.length = 0;
  hud.update(world, toDeities(hand.slots), toDeities(hand.queue));
  const mine = fieldCounts(world, deities, 'player');
  setFieldStatus({
    units: mine.units,
    unitsMax: MAX_FIELD_UNITS,
    heavy: mine.heavy,
    heavyMax: MAX_HEAVY_UNITS,
    blocked: hand.slots.map((id) => {
      const candidate = deities.get(id);
      const block = candidate === undefined ? null : deployBlock(world, deities, candidate, 'player');
      return block === null ? null : BLOCK_LABEL[block];
    }),
  });
  consultant.update(world, world.faith, elapsed);
  report.update(world.outcome);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
