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
import { selectBattleStage } from './sim/scenario';
import type { Deity, DeityId, DeityIndex, Pantheon, StageWave } from './sim/types';
import { preloadArt } from './render/art/sprites';
import { chooseSummon } from './sim/advisor';
import { createBattleLog, noteDeployment, recordEvents } from './sim/battlelog';
import { createDiagnosticLog, diagnosticCombatObserver, diagnosticState, noteDiagnostic, unitLabel } from './sim/diagnostics';
import { BLOCK_LABEL, deployBlock, fieldCounts, MAX_FIELD_UNITS, MAX_HEAVY_UNITS } from './sim/limits';
import { checkSummon, fieldAllowed } from './sim/summon';
import { createWorld, spawnUnit, tickWorldObserved } from './sim/world';
import type { ResolveResult } from './ui/admin';
import { mountAdminPanel } from './ui/admin';
import { mountCodex } from './ui/codex';
import { mountConsultant } from './ui/consultant';
import { mountDraftScreen } from './ui/draftscreen';
import { mountHud, setFieldStatus } from './ui/hud';
import { mountReport } from './ui/report';
import { getSettings } from './ui/settings';
import { mountDiagnostics } from './ui/diagnostics';

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
new ResizeObserver(fitCanvas).observe(canvas);

const stage = selectBattleStage(SHOWCASE_STAGE, getSettings().deck, getSettings().opponentDeck);

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

/**
 * The player's chosen deck, falling back to whatever the stage supplies. Every member can be summoned
 * at any time; unknown ids are dropped so a card's position always matches its deck index.
 */
const playerDeck: readonly DeityId[] = stage.playerDeck.filter((id) => deities.has(id));

// One pantheon fights in its own realm; a mixed deck fights in the open-world city.
const deckRealms = pantheonsOf(playerDeck, ALL_DEITIES);
setAutoBackdrop(deckRealms.length === 1 ? (deckRealms[0] as Pantheon) : 'openworld');

/** Waves not yet spawned, ascending by time. */
const pendingWaves: StageWave[] = [...stage.waves].sort((a, b) => a.at - b.at);

/**
 * Deck indices requested since the last tick. Drained on a tick boundary so input never desyncs the
 * sim.
 */
const summonQueue: { deckIndex: number; source: 'manual' | 'auto-player' }[] = [];

/**
 * Records every attack for the post-match report. Deployments are noted here rather than derived
 * from spawn events, because a unit that dies is removed from the world and its identity would be
 * gone before the report is built.
 */
const battleLog = createBattleLog();

/** Spawns a unit and registers it with the battle log. All spawns go through this. */
function deploy(deity: Deity, side: 'player' | 'enemy', source: 'scripted-wave' | 'manual' | 'auto-player' | 'enemy-ai', paidCost: number, scheduledAt?: number): void {
  const unit = spawnUnit(world, deity, side);
  noteDeployment(battleLog, unit.id, deity.id, side, paidCost);
  noteDiagnostic(diagnosticLog, world.time, 'deployment', `${unitLabel(unit, deities)} deployed (${source})`, {
    unit, source, scheduledAt: scheduledAt ?? null, listedCost: deity.cost, paidCost, stateAfter: currentDiagnosticState(),
  });
}

const hud = mountHud(
  hudRoot,
  playerDeck.map((id) => deities.get(id) as Deity),
  (deckIndex) => summonQueue.push({ deckIndex, source: 'manual' }),
);
for (const base of world.units) battleLog.identities.set(base.id, { deityId: base.deityId, side: base.side });

mountCodex(ALL_DEITIES, ALL_EDGES);
preloadArt();

// Applying a deck restarts the battle. A reload is the honest way to do that: the deck is persisted,
// and half-swapping a roster into a battle already in progress would leave the world inconsistent.
mountDraftScreen(ALL_DEITIES, graph, () => window.location.reload());

const consultant = mountConsultant(deities, graph, playerDeck);

/**
 * The opponent runs its own economy on the same terms as the player and picks counters with the
 * same rule engine the consultant reads from. Undrafted showcase battles also run their scripted
 * timeline; drafted roster battles contain only deck summons.
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
const AUTO_THINK_INTERVAL = 2.5;
const RESOLVE_BUDGET_SECONDS = 400;
const diagnosticLog = createDiagnosticLog({
  createdAt: new Date().toISOString(), stage, roster: ALL_DEITIES, relationships: ALL_EDGES,
  playerDeck, enemyDeck, seed: 0x5eed, settings: { ...getSettings() },
  enemyThinkInterval: ENEMY_THINK_INTERVAL, autoThinkInterval: AUTO_THINK_INTERVAL, resolveBudget: RESOLVE_BUDGET_SECONDS,
});
const combatObserver = diagnosticCombatObserver(diagnosticLog, world, deities);
function currentDiagnosticState() {
  return diagnosticState(world, deities, playerDeck, enemyDeck, enemyFaith, getSettings().enemyAi);
}
noteDiagnostic(diagnosticLog, 0, 'start', 'Battle initialised', { state: currentDiagnosticState() });
let nextSnapshotAt = 1;
let lastLoggedSettings = JSON.stringify(getSettings());

/** Spawns any scripted waves whose time has arrived, and any queued player summons. */
function processSpawns(): void {
  if (world.outcome !== 'ongoing') return;
  for (;;) {
    const wave = pendingWaves[0];
    if (wave === undefined || wave.at > world.time) break;
    pendingWaves.shift();
    const deity = deities.get(wave.deityId);
    if (deity !== undefined) deploy(deity, wave.side, 'scripted-wave', 0, wave.at);
  }

  for (;;) {
    const request = summonQueue.shift();
    if (request === undefined) break;
    const { deckIndex, source } = request;
    const { deity, reason } = checkSummon(world, deities, playerDeck, deckIndex, 'player', world.faith);
    noteDiagnostic(diagnosticLog, world.time, 'summon-attempt', `${source} card ${deckIndex + 1}: ${reason ?? 'accepted'}`, {
      deckIndex, deityId: playerDeck[deckIndex] ?? null, source, accepted: reason === null, reason, stateBefore: currentDiagnosticState(),
    });
    if (deity === undefined || reason !== null) continue;
    // A refused summon costs nothing: the faith is only spent once the unit is allowed on the field.
    world.faith -= deity.cost;
    deploy(deity, 'player', source, deity.cost);
  }

  if (!getSettings().enemyAi || world.outcome !== 'ongoing') return;

  enemyFaith = Math.min(stage.faithMax, enemyFaith + stage.faithRegen * TICK_DT);
  enemyThinkTimer -= TICK_DT;
  if (enemyThinkTimer > 0) return;
  enemyThinkTimer = ENEMY_THINK_INTERVAL;

  // The opponent obeys the same field limits, so it only considers what it may actually summon.
  const allowed = fieldAllowed(world, deities, enemyDeck, 'enemy');
  const choice = chooseSummon(world, deities, graph, allowed, 'enemy', enemyFaith, stage.faithMax);
  noteDiagnostic(diagnosticLog, world.time, 'decision', `Opponent decision: ${choice ?? 'wait'}`, {
    side: 'enemy', source: 'enemy-ai', choice, allowed, stateBefore: currentDiagnosticState(),
  });
  if (choice === null) return;
  const chosen = deities.get(choice);
  if (chosen === undefined || enemyFaith < chosen.cost) return;
  enemyFaith -= chosen.cost;
  deploy(chosen, 'enemy', 'enemy-ai', chosen.cost);
}

/** Seconds between the auto-player's decisions during a fast-forward. Matches the opponent's pace. */
let autoThinkTimer = 0;

/**
 * Plays the player's side with the same rule engine the opponent uses, choosing from the whole deck
 * under the same field limits. Used only while fast-forwarding.
 */
function autoSummonForPlayer(): void {
  autoThinkTimer -= TICK_DT;
  if (autoThinkTimer > 0) return;
  autoThinkTimer = AUTO_THINK_INTERVAL;

  const summonable = fieldAllowed(world, deities, playerDeck, 'player');
  const choice = chooseSummon(world, deities, graph, summonable, 'player', world.faith, stage.faithMax);
  noteDiagnostic(diagnosticLog, world.time, 'decision', `Auto-player decision: ${choice ?? 'wait'}`, {
    side: 'player', source: 'auto-player', choice, allowed: summonable, stateBefore: currentDiagnosticState(),
  });
  if (choice === null) return;
  const deckIndex = playerDeck.indexOf(choice);
  if (deckIndex >= 0) summonQueue.push({ deckIndex, source: 'auto-player' });
}

/** Record hits at their exact simulation tick, even when a rendered frame advances several steps. */
function stepSimulation(): void {
  if (world.outcome !== 'ongoing') return;
  const settings = JSON.stringify(getSettings());
  if (settings !== lastLoggedSettings) {
    noteDiagnostic(diagnosticLog, world.time, 'settings', 'Runtime settings changed', { settings: { ...getSettings() } });
    lastLoggedSettings = settings;
  }
  const eventStart = world.events.length;
  processSpawns();
  tickWorldObserved(world, TICK_DT, graph, deities, rng, combatObserver);
  recordEvents(battleLog, world.events.slice(eventStart), world.time);
  if (world.time >= nextSnapshotAt || world.outcome !== 'ongoing') {
    noteDiagnostic(diagnosticLog, world.time, 'snapshot', 'Field, economy and availability checkpoint', { state: currentDiagnosticState() });
    nextSnapshotAt = world.time + 1;
  }
  if (world.outcome !== 'ongoing') noteDiagnostic(diagnosticLog, world.time, 'outcome', `Battle ended: ${world.outcome}`, { state: currentDiagnosticState() });
}

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
  noteDiagnostic(diagnosticLog, world.time, 'mode', 'Fast-forward started; player controlled by the existing summon rule engine', { mode: 'fast-forward', budgetSeconds: RESOLVE_BUDGET_SECONDS });

  while (world.outcome === 'ongoing' && ticks < maxTicks) {
    autoSummonForPlayer();
    stepSimulation();
    world.events.length = 0;
    ticks++;
  }

  // The report normally surfaces itself from the animation loop; drive it directly so this works
  // even when frames are not running.
  report.update(world.outcome);
  noteDiagnostic(diagnosticLog, world.time, 'mode', 'Fast-forward stopped', { mode: 'normal', ticks, budgetReached: world.outcome === 'ongoing' });

  return {
    outcome: world.outcome === 'victory' ? 'Victory' : world.outcome === 'defeat' ? 'Defeat' : 'No result',
    simulatedSeconds: world.time - startedAt,
    realMilliseconds: performance.now() - started,
    hitBudget: world.outcome === 'ongoing',
  };
}

const openDiagnostics = mountDiagnostics(() => ({ log: diagnosticLog, state: currentDiagnosticState(), time: world.time }));
const report = mountReport(battleLog, deities, openDiagnostics, {
  stageName: stage.name, playerDeck, enemyDeck, scriptedReinforcements: stage.waves.length,
});
mountAdminPanel(resolveInstantly, ALL_DEITIES, openDiagnostics);
const gameControls = document.querySelector<HTMLElement>('#game-controls');
for (const id of ['draft-open', 'consult-open', 'diagnostic-open', 'codex-open', 'admin-open', 'report-open']) {
  const button = document.getElementById(id);
  if (button && gameControls) gameControls.append(button);
}
const codexButton = document.getElementById('codex-open');
if (codexButton) codexButton.textContent = 'Codex · how to play';
const settingsButton = document.getElementById('admin-open');
if (settingsButton) settingsButton.textContent = 'Display settings';

let previous = performance.now();
let accumulator = 0;

function frame(now: number): void {
  const elapsed = Math.min((now - previous) / 1000, MAX_FRAME_DT);
  previous = now;
  accumulator += elapsed;

  while (accumulator >= TICK_DT) {
    stepSimulation();
    accumulator -= TICK_DT;
  }

  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  drawWorld(ctx, world, deities);
  drawEffects(ctx, world, deities, graph, elapsed);
  world.events.length = 0;
  const mine = fieldCounts(world, deities, 'player');
  setFieldStatus({
    units: mine.units,
    unitsMax: MAX_FIELD_UNITS,
    heavy: mine.heavy,
    heavyMax: MAX_HEAVY_UNITS,
    blocked: playerDeck.map((id) => {
      const candidate = deities.get(id);
      const block = candidate === undefined ? null : deployBlock(world, deities, candidate, 'player');
      return block === null ? null : BLOCK_LABEL[block];
    }),
  });
  hud.update(world);
  consultant.update(world, world.faith, elapsed);
  report.update(world.outcome);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
