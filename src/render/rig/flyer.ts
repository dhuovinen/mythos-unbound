/**
 * Winged body plan: a creature that hovers and flies rather than walks.
 *
 * Used for harpies, the Egyptian ba-bird and anything else with wings. The body is a leaning torso
 * with a head from the shared parts library, two banks of flapping feathers, tail feathers and
 * dangling talons. It hovers above its shadow, which is what tells you it is airborne; a hit throws
 * it back, an attack is a swoop with the talons out, and death is a fall to the ground.
 */

import type { AnimName, Figure, View } from './figure';
import { ANIM_SECONDS, clamp01, lerp, shade, smooth } from './figure';
import type { GearKind, HairKind, HeadKind, Tones } from './parts';
import { DEFAULT_TONES, GEAR, HAIR, HEADS, atHead } from './parts';
import type { P } from './rig';
import { INK, capsule, inked, poly } from './rig';

export interface FlyerSpec {
  readonly id: string;
  readonly name: string;
  readonly tier: Figure['tier'];
  /** Height of the hips above the ground at rest. */
  readonly hover: number;
  /** Length of a wing from root to tip. */
  readonly wing: number;
  readonly torso: string;
  readonly feathers: string;
  readonly feathers2: string;
  readonly legs: string;
  readonly head: HeadKind;
  readonly hair?: HairKind;
  readonly gear?: readonly GearKind[];
  readonly tones?: Partial<Tones>;
  readonly headScale?: number;
}

interface FlyerPose {
  lean: number;
  /** Wing angle: positive lifts the wing up and back, negative sweeps it down. */
  flap: number;
  dx: number;
  dy: number;
  /** Talons thrown forward and spread, 0..1. */
  grab: number;
  /** 0..1 fall to the ground. */
  fall: number;
  /** 0..1 lying still on the ground, wings folded. */
  down: number;
}

function poseFor(anim: AnimName, t: number, time: number): FlyerPose {
  const base: FlyerPose = {
    lean: 0.28,
    flap: 0.25 + Math.sin(time * 7) * 0.62,
    dx: 0,
    dy: Math.sin(time * 3.5) * 2.4,
    grab: 0,
    fall: 0,
    down: 0,
  };
  switch (anim) {
    case 'idle':
      return base;
    case 'walk':
      return { ...base, lean: 0.55, flap: 0.2 + Math.sin(time * 12) * 0.75, dy: Math.sin(time * 6) * 2, dx: 2 };
    case 'attack': {
      const u = clamp01(t / ANIM_SECONDS.attack);
      const wind = smooth(u / 0.4);
      const strike = smooth((u - 0.4) / 0.16);
      const recover = smooth((u - 0.6) / 0.4);
      const amount = strike * (1 - recover);
      return {
        ...base,
        lean: lerp(0.28, -0.1, wind) * (1 - strike) + 1.15 * amount,
        flap: lerp(base.flap, 1.35, wind) * (1 - strike) + -0.5 * amount,
        dx: lerp(0, -8, wind) * (1 - strike) + 26 * amount,
        dy: lerp(base.dy, -8, wind) * (1 - strike) + 16 * amount,
        grab: amount,
      };
    }
    case 'hit': {
      const u = clamp01(t / ANIM_SECONDS.hit);
      const k = smooth(u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75);
      return { ...base, lean: lerp(0.28, -0.55, k), flap: lerp(base.flap, 1.4, k), dx: -12 * k, dy: -5 * k };
    }
    case 'death': {
      const u = clamp01(t / ANIM_SECONDS.death);
      return { ...base, lean: lerp(0.28, -1.2, smooth(u / 0.8)), flap: lerp(0.4, -0.35, smooth(u / 0.5)), dx: -10 * smooth(u), dy: 0, fall: smooth(u / 0.7), down: smooth((u - 0.6) / 0.4) };
    }
  }
}

const rot = (o: P, a: number, l: number): P => ({ x: o.x + Math.cos(a) * l, y: o.y + Math.sin(a) * l });

export function makeFlyer(spec: FlyerSpec): Figure {
  const tones: Tones = { ...DEFAULT_TONES, ...spec.tones };
  const hs = spec.headScale ?? 1;
  const view: View = { x: -27, y: -spec.hover - 72, w: 72, h: 66 };

  /**
   * One wing: a leading-edge arm with a comb of feathers hanging off its trailing side. The arm
   * sweeps from high-and-back (upstroke) to low-and-back (downstroke); folding on death shortens it.
   */
  const wing = (ctx: CanvasRenderingContext2D, root: P, pose: FlyerPose, far: boolean): void => {
    const L = spec.wing * (1 - pose.down * 0.45);
    const lift = (far ? pose.flap * 0.85 - 0.12 : pose.flap) * (1 - pose.down * 0.8);
    const heading = Math.PI + 0.2 + Math.max(-0.7, Math.min(1.45, lift)) * 0.9;
    const main = far ? shade(spec.feathers, 0.68) : spec.feathers;
    const alt = far ? shade(spec.feathers2, 0.68) : spec.feathers2;
    ctx.save();
    ctx.translate(root.x, root.y);
    ctx.rotate(heading);
    // Flip so the feathers hang from the arm's lower, trailing edge.
    ctx.scale(1, -1);
    const feathers = 8;
    for (let i = feathers - 1; i >= 0; i--) {
      const f = i / (feathers - 1);
      const ax = L * (0.06 + 0.5 * f);
      const spread = 1.3 - 0.95 * f - pose.down * 0.7;
      const len = L * (0.5 + 0.5 * f) * (1 - pose.down * 0.25);
      const tx = ax + Math.cos(spread) * len;
      const ty = Math.sin(spread) * len;
      const w = 5.4;
      const nx = -Math.sin(spread) * w;
      const ny = Math.cos(spread) * w;
      inked(ctx, i % 2 === 0 ? main : alt, 1.5, () => {
        poly(ctx, [
          [ax + nx * 0.4, ny * 0.4],
          [(ax + tx) / 2 + nx, ty / 2 + ny],
          [tx, ty],
          [(ax + tx) / 2 - nx, ty / 2 - ny],
          [ax - nx * 0.4, -ny * 0.4],
        ]);
      });
    }
    capsule(ctx, { x: 0, y: 0 }, { x: L * 0.62, y: 0 }, 6, main);
    inked(ctx, main, 1.6, () => ctx.arc(L * 0.62, 0, 3.4, 0, Math.PI * 2));
    ctx.restore();
  };

  return {
    id: spec.id,
    name: spec.name,
    tier: spec.tier,
    body: 'flyer',
    view,
    draw(ctx, anim, t, time) {
      const pose = poseFor(anim, t, time);
      ctx.save();
      // The fall: it drops from its hover to the ground and tips onto its back.
      const height = spec.hover * (1 - pose.fall);
      const hip: P = { x: pose.dx, y: -height + pose.dy * (1 - pose.fall) - 9 * pose.down };
      if (pose.down > 0 || pose.fall > 0) {
        ctx.translate(hip.x, 0);
        ctx.rotate(-pose.down * 1.2);
        ctx.translate(-hip.x, 0);
      }
      const sin = Math.sin(pose.lean);
      const cos = Math.cos(pose.lean);
      const shoulder: P = { x: hip.x + sin * 28, y: hip.y - cos * 28 };

      // Far wing and tail feathers sit behind the body.
      wing(ctx, { x: shoulder.x - 1, y: shoulder.y + 3 }, pose, true);
      for (let i = 0; i < 4; i++) {
        const a = Math.PI - 0.15 + 0.26 * (i - 1.5) + pose.lean * 0.4 + 0.5;
        const tip = rot(hip, a, 22 - Math.abs(i - 1.5) * 3);
        inked(ctx, i % 2 === 0 ? spec.feathers2 : spec.feathers, 1.5, () => {
          poly(ctx, [[hip.x, hip.y - 3], [tip.x - 2, tip.y - 3], [tip.x, tip.y + 3], [hip.x, hip.y + 3]]);
        });
      }

      // Legs: a bird's, hanging loose and thrown forward with talons for a grab.
      const dangle = Math.sin(time * 5) * 0.12;
      for (const [off, far] of [[-3, true], [3, false]] as const) {
        const thigh: P = { x: hip.x + off, y: hip.y + 3 };
        const knee: P = { x: thigh.x + lerp(2, 14, pose.grab) + dangle * 6, y: thigh.y + lerp(10, 5, pose.grab) };
        const foot: P = { x: knee.x + lerp(-3, 15, pose.grab), y: knee.y + lerp(14, 7, pose.grab) };
        const color = far ? shade(spec.legs, 0.7) : spec.legs;
        capsule(ctx, thigh, knee, 5, color);
        capsule(ctx, knee, foot, 3.6, color);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        for (let c = 0; c < 3; c++) {
          ctx.beginPath();
          ctx.moveTo(foot.x, foot.y);
          ctx.quadraticCurveTo(foot.x + 6 + c * 1.2, foot.y + (c - 1) * (2 + pose.grab * 4), foot.x + 8 + c, foot.y + (c - 1) * (4 + pose.grab * 6) + 3);
          ctx.stroke();
        }
      }

      // Torso: a leaning, deep-chested body with a lighter breast.
      const nx = cos;
      const ny = sin;
      inked(ctx, spec.torso, 2, () => {
        poly(ctx, [
          [hip.x - nx * 8, hip.y + ny * 8],
          [hip.x + nx * 8, hip.y - ny * 8],
          [shoulder.x + nx * 13, shoulder.y - ny * 13],
          [shoulder.x - nx * 12, shoulder.y + ny * 12],
        ]);
      });
      ctx.fillStyle = spec.feathers2;
      for (let i = 0; i < 4; i++) {
        const f = (i + 0.7) / 4.4;
        ctx.beginPath();
        ctx.arc(lerp(hip.x, shoulder.x, f) + nx * 4, lerp(hip.y, shoulder.y, f) - ny * 4, 3.6, 0, Math.PI);
        ctx.fill();
      }

      // Head, from the shared parts.
      const neck: P = { x: shoulder.x + Math.sin(pose.lean * 0.5) * 12, y: shoulder.y - Math.cos(pose.lean * 0.5) * 12 };
      atHead(ctx, { head: neck, headAngle: pose.lean * 0.35, headR: 11 * hs }, (r) => {
        if (spec.hair !== undefined) HAIR[spec.hair].back(ctx, r, tones.hair);
        HEADS[spec.head](ctx, r, tones);
        if (spec.hair !== undefined) HAIR[spec.hair].front(ctx, r, tones.hair);
        for (const g of spec.gear ?? []) GEAR[g](ctx, r, tones);
      });

      // Near wing over the body.
      wing(ctx, { x: shoulder.x - 2, y: shoulder.y + 4 }, pose, false);
      ctx.restore();
    },
  };
}
