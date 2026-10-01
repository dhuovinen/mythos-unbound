/**
 * Drives rig animation from the live battle.
 *
 * The simulation knows nothing about poses. This module watches it from the outside — who moved,
 * who swung, who was hit, who died — and turns that into animation state per unit. Dead units are
 * gone from the world the instant they die, so a snapshot of each unit is kept and a dying unit is
 * drawn as a ghost until its fall finishes.
 *
 * Render-only: it reads the world, never writes it, and its clocks are wall time, not sim time.
 */

import type { Deity, DeityIndex, Side, Unit, World } from '../../sim/types';
import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS, hitFlash } from './figure';
import { FIGURE_BY_ID } from './figures';

interface Snapshot {
  deityId: string;
  side: Side;
  sx: number;
  footY: number;
  scale: number;
}

interface State {
  anim: AnimName;
  since: number;
  lastX: number;
  seed: number;
  snap: Snapshot | null;
}

interface Ghost {
  snap: Snapshot;
  since: number;
  seed: number;
}

const states = new Map<number, State>();
const ghosts: Ghost[] = [];

/** How long a fallen unit lies there before it is cleared. */
const GHOST_LINGER = ANIM_SECONDS.death + 0.6;

/** Which deities have a rig at all. Others keep falling back to blocks. */
export function hasRig(deityId: string): boolean {
  return FIGURE_BY_ID.has(deityId);
}

function stateFor(unit: Unit, now: number): State {
  let state = states.get(unit.id);
  if (state === undefined) {
    state = { anim: 'idle', since: now, lastX: unit.x, seed: unit.id * 0.37, snap: null };
    states.set(unit.id, state);
  }
  return state;
}

function oneShotDone(state: State, now: number): boolean {
  if (state.anim === 'attack' || state.anim === 'hit') return now - state.since >= ANIM_SECONDS[state.anim];
  return true;
}

/**
 * Advances every unit's animation state from this frame's world. Call once per frame, before
 * drawing and before the world's events are cleared.
 */
export function updateRigs(world: World, now: number): void {
  const live = new Set<number>();
  for (const unit of world.units) {
    if (unit.isBase) continue;
    live.add(unit.id);
    const state = stateFor(unit, now);
    const moving = Math.abs(unit.x - state.lastX) > 0.004;
    state.lastX = unit.x;
    if (oneShotDone(state, now)) {
      const next: AnimName = moving ? 'walk' : 'idle';
      if (state.anim !== next) {
        state.anim = next;
        state.since = now;
      }
    }
  }

  for (const event of world.events) {
    if (event.kind === 'hit') {
      const attacker = states.get(event.attackerId);
      if (attacker !== undefined && event.damage > 0) {
        attacker.anim = 'attack';
        attacker.since = now;
      }
      const defender = states.get(event.defenderId);
      if (defender !== undefined && event.damage > 0) {
        const swinging = defender.anim === 'attack' && now - defender.since > ANIM_SECONDS.attack * 0.35;
        if (!swinging) {
          defender.anim = 'hit';
          defender.since = now;
        }
      }
    } else if (event.kind === 'death') {
      const state = states.get(event.unitId);
      if (state?.snap != null) ghosts.push({ snap: state.snap, since: now, seed: state.seed });
      states.delete(event.unitId);
    }
  }

  for (const id of states.keys()) if (!live.has(id)) states.delete(id);
  while (ghosts.length > 0 && now - (ghosts[0] as Ghost).since > GHOST_LINGER) ghosts.shift();
}

function paint(
  ctx: CanvasRenderingContext2D,
  figure: Figure,
  snap: Snapshot,
  anim: AnimName,
  t: number,
  seed: number,
  now: number,
): void {
  const flash = hitFlash(anim, t);

  // A soft contact shadow grounds the figure.
  ctx.save();
  ctx.translate(snap.sx, snap.footY);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 1, (figure.body === 'serpent' ? 34 : figure.body === 'beast' ? 30 : 15) * snap.scale + 4, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (snap.side === 'enemy') ctx.scale(-1, 1);
  ctx.scale(snap.scale, snap.scale);
  if (flash > 0) {
    const layer = flashLayer();
    const lctx = layer.getContext('2d');
    if (lctx !== null) {
      lctx.clearRect(0, 0, layer.width, layer.height);
      lctx.save();
      lctx.translate(layer.width / 2, layer.height - 12);
      figure.draw(lctx, anim, t, now + seed);
      lctx.globalCompositeOperation = 'source-atop';
      lctx.fillStyle = `rgba(255,255,255,${flash * 0.85})`;
      lctx.fillRect(-layer.width / 2, -layer.height, layer.width, layer.height);
      lctx.restore();
      ctx.drawImage(layer, -layer.width / 2, -layer.height + 12);
    }
  } else {
    figure.draw(ctx, anim, t, now + seed);
  }
  ctx.restore();
}

let flash: HTMLCanvasElement | null = null;

/** Scratch canvas for the white hit flash, so only the figure's own pixels are tinted. */
function flashLayer(): HTMLCanvasElement {
  if (flash === null) {
    flash = document.createElement('canvas');
    flash.width = 360;
    flash.height = 240;
  }
  return flash;
}

/** Draws one live unit. `scale` converts rig units (figure ~100 tall) to screen pixels. */
export function drawRigUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  deity: Deity,
  sx: number,
  footY: number,
  scale: number,
  now: number,
): void {
  const figure = FIGURE_BY_ID.get(deity.id);
  if (figure === undefined) return;
  const state = stateFor(unit, now);
  state.snap = { deityId: deity.id, side: unit.side, sx, footY, scale };
  paint(ctx, figure, state.snap, state.anim, now - state.since, state.seed, now);
}

/** Draws units that have just died, mid-fall or lying where they dropped. */
export function drawGhosts(ctx: CanvasRenderingContext2D, deities: DeityIndex, now: number): void {
  for (const ghost of ghosts) {
    const figure = FIGURE_BY_ID.get(ghost.snap.deityId);
    if (figure === undefined || deities.get(ghost.snap.deityId) === undefined) continue;
    const t = now - ghost.since;
    // Fade out over the last stretch so bodies do not pile up forever.
    const fade = Math.min(1, (GHOST_LINGER - t) / 0.5);
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    paint(ctx, figure, ghost.snap, 'death', t, ghost.seed, now);
    ctx.restore();
  }
}
