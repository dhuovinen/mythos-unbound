/**
 * A parametric character rig drawn entirely in Canvas 2D.
 *
 * One skeleton serves every deity. A deity is a `Recipe` — proportions, colours and a few drawing
 * hooks for head, clothing and weapon — so adding a character is data plus a little drawing, never a
 * new animation system. Animation is procedural: a pose is a handful of joint angles, and walk,
 * attack, hit and death are just functions from time to pose.
 *
 * Conventions:
 *  - Drawn at a nominal height of 100 units with the feet at the origin, facing +x (right). The
 *    caller scales and mirrors.
 *  - Joint angles are radians measured from "hanging straight down", positive toward the facing side.
 *  - Same art direction as the battlefield: heavy ink outline, flat fills, **no gold**. Fills come
 *    from bone, ink, blood and greys mixed from them.
 *  - Deterministic: no Math.random(). Anything that flutters is driven by the time passed in.
 */

import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS } from './figure';

export interface P {
  x: number;
  y: number;
}

export const INK = '#1A1A1E';
export const BONE = '#EDE6D6';
export const BONE_SHADE = '#c4baa3';
export const GREY = '#8a8474';
export const SLATE = '#4a4850';
export const BLOOD = '#C4442E';
export const BLOOD_DARK = '#8C2F20';

export type AttackStyle = 'thrust' | 'overhead' | 'sweep';

/** Every joint the rig animates. */
export interface Pose {
  bob: number;
  lean: number;
  tilt: number;
  /** [shoulder, elbow] */
  armF: readonly [number, number];
  armB: readonly [number, number];
  /** [hip, knee] — knee flexes the shin backward. */
  legF: readonly [number, number];
  legB: readonly [number, number];
  /** Added to the recipe's resting weapon angle. */
  w: number;
}

export interface Build {
  /** Torso and limb thickness multiplier. */
  bulk: number;
  /** Leg length multiplier. */
  legs: number;
  /** Extra forward lean held at all times; titans hunch. */
  hunch: number;
  /** Head radius multiplier. */
  head: number;
}

/** Everything a recipe needs to know to draw itself this frame. */
export interface Skel {
  hip: P;
  shoulder: P;
  neck: P;
  head: P;
  headR: number;
  torsoAngle: number;
  headAngle: number;
  armF: { elbow: P; hand: P; angle: number };
  armB: { elbow: P; hand: P; angle: number };
  legF: { knee: P; foot: P };
  legB: { knee: P; foot: P };
  weaponAngle: number;
  build: Build;
  time: number;
  pose: Pose;
}

export interface Recipe {
  readonly id: string;
  readonly name: string;
  readonly tier: 'chaff' | 'demigod' | 'god' | 'titan';
  readonly build: Build;
  readonly skin: string;
  readonly limbColor: string;
  readonly attack: AttackStyle;
  /** Resting weapon angle, radians from straight up, positive forward. */
  readonly weaponRest: number;
  /** Drawn behind everything — capes, wings, a held staff's far end. */
  drawBehind?(ctx: CanvasRenderingContext2D, s: Skel): void;
  /** Clothing and armour over the torso and hips. */
  drawBody(ctx: CanvasRenderingContext2D, s: Skel): void;
  drawHead(ctx: CanvasRenderingContext2D, s: Skel): void;
  /** The weapon, in a frame at the front hand with local -y as the weapon's "up". */
  drawWeapon(ctx: CanvasRenderingContext2D): void;
  /** Carried on the back arm, drawn over the torso (a shield). */
  drawOffhand?(ctx: CanvasRenderingContext2D, s: Skel): void;
}

// ---------------------------------------------------------------------------
// Drawing primitives
// ---------------------------------------------------------------------------

/** A limb segment: an ink capsule with a coloured core, which is the woodcut outline for free. */
export function capsule(ctx: CanvasRenderingContext2D, a: P, b: P, width: number, fill: string): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = width + 3.4;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function inked(ctx: CanvasRenderingContext2D, fill: string, line: number, path: () => void): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = line;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function poly(ctx: CanvasRenderingContext2D, pts: readonly (readonly [number, number])[]): void {
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Posing
// ---------------------------------------------------------------------------

const REST_POSE: Pose = {
  bob: 0,
  lean: 0,
  tilt: 0,
  armF: [0.25, 0.45],
  armB: [-0.15, 0.3],
  legF: [0.1, 0.08],
  legB: [-0.1, 0.08],
  w: 0,
};

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function lerp2(a: readonly [number, number], b: readonly [number, number], u: number): [number, number] {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

function mix(a: Pose, b: Pose, u: number): Pose {
  return {
    bob: lerp(a.bob, b.bob, u),
    lean: lerp(a.lean, b.lean, u),
    tilt: lerp(a.tilt, b.tilt, u),
    armF: lerp2(a.armF, b.armF, u),
    armB: lerp2(a.armB, b.armB, u),
    legF: lerp2(a.legF, b.legF, u),
    legB: lerp2(a.legB, b.legB, u),
    w: lerp(a.w, b.w, u),
  };
}

const smooth = (u: number): number => u * u * (3 - 2 * u);

/** Samples a keyframed timeline. Keys are [time 0..1, pose], ascending. */
function sample(keys: readonly (readonly [number, Pose])[], p: number): Pose {
  const first = keys[0] as readonly [number, Pose];
  if (p <= first[0]) return first[1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1] = keys[i] as readonly [number, Pose];
    const [t0, p0] = keys[i - 1] as readonly [number, Pose];
    if (p <= t1) return mix(p0, p1, smooth((p - t0) / (t1 - t0)));
  }
  return (keys[keys.length - 1] as readonly [number, Pose])[1];
}

const p = (over: Partial<Pose>): Pose => ({ ...REST_POSE, ...over });

/** Attack timelines. Each spends its first ~40% winding up, so the strike reads as a snap. */
const ATTACKS: Readonly<Record<AttackStyle, readonly (readonly [number, Pose])[]>> = {
  thrust: [
    [0, p({})],
    [0.4, p({ lean: -0.18, armF: [0.2, 1.5], armB: [0.5, 0.6], legF: [0.35, 0.3], legB: [-0.45, 0.2], w: 0.9, tilt: 0.1 })],
    [0.55, p({ lean: 0.3, armF: [1.45, 0.05], armB: [-0.6, 0.4], legF: [0.75, 0.25], legB: [-0.55, 0.05], w: 1.5, tilt: -0.05 })],
    [0.75, p({ lean: 0.22, armF: [1.3, 0.12], armB: [-0.5, 0.4], legF: [0.7, 0.25], legB: [-0.5, 0.05], w: 1.4 })],
    [1, p({})],
  ],
  overhead: [
    [0, p({})],
    [0.42, p({ lean: -0.3, armF: [2.7, 0.7], armB: [0.8, 0.5], legF: [0.3, 0.3], legB: [-0.5, 0.2], w: -0.9, tilt: 0.2 })],
    [0.56, p({ lean: 0.38, armF: [1.25, 0.25], armB: [-0.8, 0.5], legF: [0.8, 0.3], legB: [-0.6, 0.05], w: 1.7, tilt: -0.1 })],
    [0.78, p({ lean: 0.3, armF: [1.0, 0.3], armB: [-0.6, 0.5], legF: [0.75, 0.3], legB: [-0.55, 0.05], w: 1.5 })],
    [1, p({})],
  ],
  sweep: [
    [0, p({})],
    [0.42, p({ lean: -0.35, armF: [-0.7, 0.35], armB: [0.4, 0.6], legF: [0.25, 0.3], legB: [-0.5, 0.2], w: -1.7, tilt: 0.25 })],
    [0.58, p({ lean: 0.4, armF: [1.7, 0.1], armB: [-0.9, 0.5], legF: [0.8, 0.3], legB: [-0.6, 0.05], w: 1.3, tilt: -0.1 })],
    [0.8, p({ lean: 0.3, armF: [1.5, 0.2], armB: [-0.6, 0.5], legF: [0.75, 0.3], legB: [-0.5, 0.05], w: 1.1 })],
    [1, p({})],
  ],
};

const HIT_POSE = p({ lean: -0.4, tilt: -0.35, armF: [-0.3, 0.6], armB: [-0.6, 0.5], legF: [0.35, 0.3], legB: [-0.35, 0.2], w: -0.6 });
const DEATH_POSE = p({ lean: -0.5, tilt: -0.5, armF: [2.4, 0.3], armB: [2.0, 0.5], legF: [0.5, 0.6], legB: [-0.2, 0.5], w: 1.2 });

export interface Animated {
  pose: Pose;
  /** 0..1 white flash, for hits. */
  flash: number;
  /** Whole-body fall rotation in radians, for death. */
  fall: number;
  /** Extra vertical offset, for the death bounce. */
  drop: number;
}

/**
 * The pose for an animation at time `t` seconds into it. Looping animations (idle, walk) wrap;
 * one-shots (attack, hit, death) clamp, so death holds its final frame.
 */
export function animate(recipe: Recipe, anim: AnimName, t: number): Animated {
  const base: Animated = { pose: REST_POSE, flash: 0, fall: 0, drop: 0 };
  switch (anim) {
    case 'idle': {
      const breathe = Math.sin(t * 2.2);
      return {
        ...base,
        pose: p({
          bob: breathe * 0.7,
          armF: [0.25 + breathe * 0.03, 0.45],
          armB: [-0.15 - breathe * 0.03, 0.3],
          w: Math.sin(t * 1.5) * 0.04,
        }),
      };
    }
    case 'walk': {
      const ph = t * Math.PI * 2 * 1.25;
      const s = Math.sin(ph);
      const c = Math.cos(ph);
      const sb = Math.sin(ph + Math.PI);
      const cb = Math.cos(ph + Math.PI);
      return {
        ...base,
        pose: p({
          bob: Math.abs(s) * 1.6,
          lean: 0.06,
          legF: [0.62 * s, 0.12 + 0.75 * Math.max(0, c)],
          legB: [0.62 * sb, 0.12 + 0.75 * Math.max(0, cb)],
          armF: [0.25 - 0.14 * s, 0.45],
          armB: [-0.1 - 0.55 * s, 0.35],
          w: -0.08 * s,
        }),
      };
    }
    case 'attack': {
      const u = Math.min(1, t / ANIM_SECONDS.attack);
      return { ...base, pose: sample(ATTACKS[recipe.attack], u) };
    }
    case 'hit': {
      const u = Math.min(1, t / ANIM_SECONDS.hit);
      const kick = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75;
      return { ...base, pose: mix(REST_POSE, HIT_POSE, smooth(Math.max(0, kick))), flash: Math.max(0, 1 - u * 2.2) };
    }
    case 'death': {
      const u = Math.min(1, t / ANIM_SECONDS.death);
      const stagger = Math.min(1, u / 0.35);
      const fallU = Math.max(0, (u - 0.2) / 0.8);
      // A small bounce as the body lands.
      const bounce = fallU > 0.85 ? Math.sin((fallU - 0.85) * Math.PI / 0.15) * 2.5 : 0;
      return {
        ...base,
        pose: mix(REST_POSE, DEATH_POSE, smooth(stagger)),
        fall: smooth(fallU) * 1.5,
        drop: bounce,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const LEG = 23;
const TORSO = 30;
const NECK = 11;
const UPPER = 16;
const FORE = 15;

function at(origin: P, angle: number, length: number): P {
  return { x: origin.x + Math.sin(angle) * length, y: origin.y + Math.cos(angle) * length };
}

export function buildSkel(recipe: Recipe, pose: Pose, time: number): Skel {
  const b = recipe.build;
  const leg = LEG * b.legs;
  const hip: P = { x: 0, y: -(leg * 2) - 0.5 + pose.bob };
  const torsoAngle = pose.lean + b.hunch;
  const shoulder: P = { x: hip.x + Math.sin(torsoAngle) * TORSO, y: hip.y - Math.cos(torsoAngle) * TORSO };
  const headAngle = torsoAngle + pose.tilt;
  const neck: P = { x: shoulder.x + Math.sin(headAngle) * 3, y: shoulder.y - Math.cos(headAngle) * 3 };
  const headR = 10.5 * b.head;
  const head: P = {
    x: shoulder.x + Math.sin(headAngle) * (NECK + (headR - 9) * 0.9),
    y: shoulder.y - Math.cos(headAngle) * (NECK + (headR - 9) * 0.9),
  };

  const arm = (shoulderPos: P, [a1, e]: readonly [number, number]): { elbow: P; hand: P; angle: number } => {
    const up = UPPER * (0.9 + b.bulk * 0.1);
    const fore = FORE * (0.9 + b.bulk * 0.1);
    const elbow = at(shoulderPos, a1, up);
    const a2 = a1 + e;
    return { elbow, hand: at(elbow, a2, fore), angle: a2 };
  };
  const legOf = ([h, k]: readonly [number, number]): { knee: P; foot: P } => {
    const knee = at(hip, h, leg);
    return { knee, foot: at(knee, h - k, leg) };
  };

  return {
    hip,
    shoulder,
    neck,
    head,
    headR,
    torsoAngle,
    headAngle,
    armF: arm(shoulder, pose.armF),
    armB: arm(shoulder, pose.armB),
    legF: legOf(pose.legF),
    legB: legOf(pose.legB),
    weaponAngle: recipe.weaponRest + pose.w,
    build: b,
    time,
    pose,
  };
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/** The torso as a tapered tube along the hip-to-shoulder axis. */
function drawTorso(ctx: CanvasRenderingContext2D, s: Skel, fill: string): void {
  const ux = Math.sin(s.torsoAngle);
  const uy = -Math.cos(s.torsoAngle);
  const nx = -uy;
  const ny = ux;
  const chest = 9.2 * s.build.bulk;
  const waist = 7 * s.build.bulk;
  inked(ctx, fill, 1.8, () => {
    poly(ctx, [
      [s.shoulder.x + nx * chest - ux * 1, s.shoulder.y + ny * chest - uy * 1],
      [s.shoulder.x - nx * chest - ux * 1, s.shoulder.y - ny * chest - uy * 1],
      [s.hip.x - nx * waist, s.hip.y - ny * waist],
      [s.hip.x + nx * waist, s.hip.y + ny * waist],
    ]);
  });
}

/**
 * Draws one full character at the origin. The caller has already translated to the feet, scaled to
 * size and mirrored for facing.
 */
export function drawRig(ctx: CanvasRenderingContext2D, recipe: Recipe, anim: Animated, time: number): void {
  const s = buildSkel(recipe, anim.pose, time);
  const limbW = 7 * (0.8 + s.build.bulk * 0.2);
  const thigh = limbW * 1.18;

  ctx.save();
  if (anim.fall !== 0 || anim.drop !== 0) {
    ctx.translate(0, -anim.drop);
    ctx.rotate(-anim.fall);
  }

  recipe.drawBehind?.(ctx, s);

  // Back leg and arm sit behind the torso.
  capsule(ctx, s.hip, s.legB.knee, thigh, recipe.limbColor);
  capsule(ctx, s.legB.knee, s.legB.foot, limbW, recipe.limbColor);
  inked(ctx, INK, 1.2, () => ctx.ellipse(s.legB.foot.x + 2, s.legB.foot.y - 0.5, 4.4, 2.3, 0, 0, Math.PI * 2));
  capsule(ctx, s.shoulder, s.armB.elbow, limbW, recipe.limbColor);
  capsule(ctx, s.armB.elbow, s.armB.hand, limbW * 0.92, recipe.limbColor);

  drawTorso(ctx, s, recipe.skin);
  capsule(ctx, s.hip, s.legF.knee, thigh, recipe.limbColor);
  capsule(ctx, s.legF.knee, s.legF.foot, limbW, recipe.limbColor);
  inked(ctx, INK, 1.2, () => ctx.ellipse(s.legF.foot.x + 2, s.legF.foot.y - 0.5, 4.4, 2.3, 0, 0, Math.PI * 2));

  recipe.drawBody(ctx, s);
  recipe.drawHead(ctx, s);
  recipe.drawOffhand?.(ctx, s);

  // The weapon sits between the forearm and the fist so the hand wraps it.
  capsule(ctx, s.shoulder, s.armF.elbow, limbW, recipe.limbColor);
  capsule(ctx, s.armF.elbow, s.armF.hand, limbW * 0.92, recipe.limbColor);
  ctx.save();
  ctx.translate(s.armF.hand.x, s.armF.hand.y);
  ctx.rotate(s.weaponAngle);
  recipe.drawWeapon(ctx);
  ctx.restore();
  inked(ctx, recipe.limbColor, 1.4, () => ctx.arc(s.armF.hand.x, s.armF.hand.y, limbW * 0.62, 0, Math.PI * 2));

  ctx.restore();
}

/** Nominal figure height in rig units, for callers that need to size things. */
export const RIG_HEIGHT = 100;

/** Wraps a biped recipe as a Figure so the rest of the game can treat every body alike. */
export function bipedFigure(recipe: Recipe, view: { x: number; y: number; w: number; h: number }): Figure {
  return {
    id: recipe.id,
    name: recipe.name,
    tier: recipe.tier,
    body: 'biped',
    view,
    draw(ctx, anim, t, time) {
      drawRig(ctx, recipe, animate(recipe, anim, t), time);
    },
  };
}
