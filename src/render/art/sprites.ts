/**
 * Hand-drawn sprite art: loading, and turning a set of key poses into an animated Figure.
 *
 * Artwork lives in `art/sprites/<id>/` (production) and `art/compare/sprites/<id>/` (the comparison
 * set), as `<id>_<frame>.png`. Vite's glob import finds whatever is there at build time and hands
 * back URLs, so adding a deity's files is all it takes for the game to pick them up — no list to
 * update. Anything without art simply has none, and the renderer falls back to the rig.
 *
 * Each deity needs seven key poses (idle, two walk, two attack, hit, death) and may have a portrait.
 * Between the key poses the figure is animated procedurally: a walk alternates its two frames with a
 * bob, an attack cross-fades from wind-up to strike, a hit shudders, a death settles.
 */

import type { AnimName, Figure } from '../rig/figure';
import { ANIM_SECONDS, clamp01, lerp, smooth } from '../rig/figure';

// The comparison set and the production folder are both read; production wins on a clash.
const compare = import.meta.glob('../../../art/compare/sprites/*/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const production = import.meta.glob('../../../art/sprites/*/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const FRAME_PATH = /\/sprites\/([a-z0-9]+)\/\1_([a-z0-9_]+)\.png$/;

/** id -> frame name -> url. */
const registry = new Map<string, Map<string, string>>();
for (const source of [compare, production]) {
  for (const [path, url] of Object.entries(source)) {
    const match = FRAME_PATH.exec(path);
    if (match === null) continue;
    const [, id, frame] = match as unknown as [string, string, string];
    let frames = registry.get(id);
    if (frames === undefined) registry.set(id, (frames = new Map()));
    frames.set(frame, url);
  }
}

const KEY_FRAMES = ['idle_01', 'walk_01', 'walk_02', 'attack_01', 'attack_02', 'hit_01', 'death_01'] as const;
type KeyFrame = (typeof KEY_FRAMES)[number];

/** The actual discovered files, in portrait/animation order, using production precedence. */
export function artAssets(id: string): readonly { frame: string; url: string }[] {
  const frames = registry.get(id);
  return ['portrait', ...KEY_FRAMES].flatMap((frame) => {
    const url = frames?.get(frame);
    return url === undefined ? [] : [{ frame, url }];
  });
}

const images = new Map<string, HTMLImageElement>();
const listeners = new Set<(id: string) => void>();

function load(id: string, frame: string): HTMLImageElement | null {
  const url = registry.get(id)?.get(frame);
  if (url === undefined) return null;
  const key = `${id}/${frame}`;
  const existing = images.get(key);
  if (existing !== undefined) return existing;
  const image = new Image();
  image.decoding = 'async';
  image.onload = (): void => listeners.forEach((fn) => fn(id));
  image.src = url;
  images.set(key, image);
  return image;
}

const ready = (image: HTMLImageElement | null): image is HTMLImageElement => image !== null && image.complete && image.naturalWidth > 0;

/** Starts loading every piece of art found, so it is decoded by the time it is needed. */
export function preloadArt(): void {
  for (const [id, frames] of registry) for (const frame of frames.keys()) load(id, frame);
}

/** Calls `fn` with the deity's id whenever one of its images finishes loading. */
export function onArtLoaded(fn: (id: string) => void): void {
  listeners.add(fn);
}

/** Ids that have any hand-drawn art at all. */
export function artIds(): string[] {
  return [...registry.keys()].sort();
}

/** The deity's portrait, once it has loaded. */
export function portraitImage(id: string): HTMLImageElement | null {
  const image = load(id, 'portrait');
  return ready(image) ? image : null;
}

/** How many deities have a full set of key poses, and how many of those have decoded. */
export function spriteStats(): { sets: number; ready: number } {
  let sets = 0;
  let decoded = 0;
  for (const [id, frames] of registry) {
    if (!KEY_FRAMES.every((f) => frames.has(f))) continue;
    sets++;
    if (KEY_FRAMES.every((f) => ready(load(id, f)))) decoded++;
  }
  return { sets, ready: decoded };
}

/** Figure frames are 512 square with the feet on y=480; this maps the frame into rig units. */
const FRAME = 512;
const SCALE = 112 / FRAME;
const FOOT_Y = 480;

type Frames = Record<KeyFrame, HTMLImageElement>;

function framesFor(id: string): Frames | null {
  const frames = {} as Frames;
  for (const name of KEY_FRAMES) {
    const image = load(id, name);
    if (!ready(image)) return null;
    frames[name] = image;
  }
  return frames;
}

interface Placement {
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  alpha?: number;
}

function blit(ctx: CanvasRenderingContext2D, image: HTMLImageElement, p: Placement = {}): void {
  ctx.save();
  ctx.globalAlpha *= p.alpha ?? 1;
  ctx.translate(p.dx ?? 0, p.dy ?? 0);
  if (p.rot !== undefined) ctx.rotate(p.rot);
  ctx.scale(p.sx ?? 1, p.sy ?? 1);
  ctx.drawImage(image, -FRAME / 2 * SCALE, -FOOT_Y * SCALE, FRAME * SCALE, FRAME * SCALE);
  ctx.restore();
}

/** Draws `a`, and over it `b` at `mix` opacity, so a pose change eases instead of snapping. */
function crossfade(ctx: CanvasRenderingContext2D, a: HTMLImageElement, b: HTMLImageElement, mix: number, p: Placement): void {
  if (mix <= 0) return blit(ctx, a, p);
  if (mix >= 1) return blit(ctx, b, p);
  blit(ctx, a, p);
  blit(ctx, b, { ...p, alpha: mix });
}

/**
 * A figure animated from a deity's key poses, or null if its set is incomplete or still loading.
 * Cheap to call every frame; it only builds a closure over the decoded images.
 */
export function spriteFigure(id: string, name: string, tier: Figure['tier']): Figure | null {
  const f = framesFor(id);
  if (f === null) return null;

  return {
    id,
    name,
    tier,
    body: 'biped',
    // The portrait crop for the rig preview: head and chest of a 100-unit figure.
    view: { x: -30, y: -112, w: 60, h: 62 },
    draw(ctx: CanvasRenderingContext2D, anim: AnimName, t: number, time: number): void {
      switch (anim) {
        case 'idle': {
          const breathe = Math.sin(time * 2.2);
          blit(ctx, f.idle_01, { dy: breathe * 0.5, sy: 1 + breathe * 0.006 });
          return;
        }
        case 'walk': {
          const cycle = t * 1.25 * 2;
          const step = Math.floor(cycle) % 2 === 0;
          const phase = cycle % 1;
          blit(ctx, step ? f.walk_01 : f.walk_02, { dy: -Math.sin(phase * Math.PI) * 1.6, rot: 0.02 * (step ? 1 : -1) });
          return;
        }
        case 'attack': {
          const u = clamp01(t / ANIM_SECONDS.attack);
          const strike = smooth((u - 0.34) / 0.1);
          const recover = smooth((u - 0.7) / 0.3);
          const lunge = lerp(-2, 5, strike) * (1 - recover);
          if (u < 0.7) crossfade(ctx, f.attack_01, f.attack_02, strike, { dx: lunge });
          else crossfade(ctx, f.attack_02, f.idle_01, recover, { dx: lunge });
          return;
        }
        case 'hit': {
          const u = clamp01(t / ANIM_SECONDS.hit);
          blit(ctx, f.hit_01, { dx: -3 * (1 - u) + Math.sin(t * 70) * 1.4 * (1 - u), rot: -0.04 * (1 - u) });
          return;
        }
        case 'death': {
          const u = clamp01(t / ANIM_SECONDS.death);
          const sink = smooth(u);
          crossfade(ctx, f.hit_01, f.death_01, smooth(u / 0.35), { dy: sink * 4, dx: -sink * 3, sy: 1 - sink * 0.03 });
          return;
        }
      }
    },
  };
}
