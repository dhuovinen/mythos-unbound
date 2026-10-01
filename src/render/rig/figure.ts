/**
 * The common face every animated creature presents to the rest of the game, whatever its body.
 *
 * Bipeds, serpents, four-legged beasts and flyers are built by different engines, but the animator,
 * the portraits and the preview page only ever see a `Figure`: something that can draw itself at the
 * origin, facing right, for a named animation at a time into that animation.
 */

export type AnimName = 'idle' | 'walk' | 'attack' | 'hit' | 'death';

/** Duration in seconds of each one-shot animation. Looping ones (idle, walk) have no length. */
export const ANIM_SECONDS: Readonly<Record<'attack' | 'hit' | 'death', number>> = {
  attack: 0.7,
  hit: 0.32,
  death: 0.9,
};

/** The part of the figure a portrait should frame, in rig units (feet at the origin, y up is negative). */
export interface View {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Figure {
  readonly id: string;
  readonly name: string;
  readonly tier: 'chaff' | 'demigod' | 'god' | 'titan';
  /** What kind of body it has, for the catalogue and for choosing a shadow size. */
  readonly body: 'biped' | 'serpent' | 'beast' | 'flyer';
  /** Head-and-shoulders crop for portraits. */
  readonly view: View;
  /**
   * Draws the figure at the origin, facing +x. `t` is seconds into the animation (it wraps for
   * looping ones, clamps for one-shots); `time` is a free-running clock for ambient flutter.
   */
  draw(ctx: CanvasRenderingContext2D, anim: AnimName, t: number, time: number): void;
}

/** 0..1 white flash while a hit lands, fading quickly. */
export function hitFlash(anim: AnimName, t: number): number {
  if (anim !== 'hit') return 0;
  const u = Math.min(1, t / ANIM_SECONDS.hit);
  return Math.max(0, 1 - u * 2.2);
}

export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
export const smooth = (u: number): number => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};
export const clamp01 = (u: number): number => Math.min(1, Math.max(0, u));

/** Multiplies a #rrggbb colour's channels by `k` — below 1 darkens, above 1 lightens (clamped). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number): number => Math.max(0, Math.min(255, Math.round(v * k)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
