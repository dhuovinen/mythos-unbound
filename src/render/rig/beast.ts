/**
 * Four-legged body plan: a deep-chested body on four jointed legs, with a neck, a head and a tail.
 *
 * Used for Fenrir and anything else that prowls — wolves, hounds, lions, composite beasts like
 * Ammit. The head comes from the shared parts library, so a wolf, a lion and a jackal differ by one
 * word. Gait is a diagonal trot; an attack is a crouch and a lunge with the jaws open.
 */

import type { AnimName, Figure, View } from './figure';
import { ANIM_SECONDS, clamp01, lerp, shade, smooth } from './figure';
import type { HeadKind, Tones } from './parts';
import { DEFAULT_TONES, HEADS } from './parts';
import type { P } from './rig';
import { BONE, INK, capsule, inked, poly } from './rig';

export interface BeastSpec {
  readonly id: string;
  readonly name: string;
  readonly tier: Figure['tier'];
  /** Distance between shoulder and hip. */
  readonly length: number;
  /** Depth of the body. */
  readonly depth: number;
  /** Leg length from body to paw. */
  readonly leg: number;
  readonly color: string;
  readonly belly: string;
  readonly head: HeadKind;
  readonly headScale: number;
  readonly tail: 'bushy' | 'whip' | 'none';
  /** A ridge of spikes down the spine. */
  readonly ridge?: boolean;
  readonly tones?: Partial<Tones>;
  /** Drawn over the finished body in the shoulder frame (chains, armour, markings). */
  readonly decorate?: (ctx: CanvasRenderingContext2D, shoulder: P, hip: P) => void;
}

interface BeastPose {
  /** Body drop toward the ground. */
  crouch: number;
  /** Whole-body shift forward. */
  lunge: number;
  /** Head pitch: positive looks down. */
  headPitch: number;
  /** Head reach forward from the idle position. */
  headReach: number;
  mouth: number;
  gait: number;
  stride: number;
  tailWag: number;
  /** 0..1 collapse onto the ground. */
  down: number;
}

function poseFor(anim: AnimName, t: number, time: number): BeastPose {
  const idle: BeastPose = { crouch: Math.sin(time * 2) * 0.6, lunge: 0, headPitch: 0.05 + Math.sin(time * 1.3) * 0.04, headReach: 0, mouth: 0, gait: 0, stride: 0, tailWag: Math.sin(time * 2.4) * 0.15, down: 0 };
  switch (anim) {
    case 'idle':
      return idle;
    case 'walk':
      return { ...idle, gait: time * 9.5, stride: 1, crouch: Math.abs(Math.sin(time * 9.5)) * -1.8, headPitch: 0.2, tailWag: Math.sin(time * 9.5) * 0.3 };
    case 'attack': {
      const u = clamp01(t / ANIM_SECONDS.attack);
      const wind = smooth(u / 0.4);
      const strike = smooth((u - 0.4) / 0.16);
      const recover = smooth((u - 0.6) / 0.4);
      const amount = strike * (1 - recover);
      return {
        ...idle,
        crouch: lerp(0, 7, wind) * (1 - strike) + 0,
        lunge: lerp(0, -6, wind) * (1 - strike) + 26 * amount,
        headPitch: lerp(0.05, -0.3, wind) * (1 - strike) + 0.55 * amount,
        headReach: lerp(0, -6, wind) * (1 - strike) + 14 * amount,
        mouth: amount,
        tailWag: 0.5,
      };
    }
    case 'hit': {
      const u = clamp01(t / ANIM_SECONDS.hit);
      const k = smooth(u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75);
      return { ...idle, lunge: -9 * k, headPitch: -0.45 * k, headReach: -6 * k, mouth: 0.4 * k, crouch: 3 * k };
    }
    case 'death': {
      const u = smooth(clamp01(t / ANIM_SECONDS.death));
      return { ...idle, crouch: 0, headPitch: 0.9 * u, mouth: 0.6 * u, tailWag: 0, down: u };
    }
  }
}

const at = (o: P, a: number, l: number): P => ({ x: o.x + Math.sin(a) * l, y: o.y + Math.cos(a) * l });

export function makeBeast(spec: BeastSpec): Figure {
  const tones: Tones = { ...DEFAULT_TONES, fur: spec.color, ...spec.tones };
  // Frame the head: it sits at the end of the neck, forward of the shoulder.
  const neckLen = spec.depth * 1.2;
  const headX = spec.length / 2 + 2 + Math.cos(0.95) * neckLen;
  const headY = -(spec.leg + spec.depth * 0.35) - spec.depth * 0.2 - Math.sin(0.95) * neckLen * 0.8;
  const hs = spec.headScale;
  const view: View = { x: headX - 40 * hs, y: headY - 38 * hs, w: 92 * hs, h: 76 * hs };

  return {
    id: spec.id,
    name: spec.name,
    tier: spec.tier,
    body: 'beast',
    view,
    draw(ctx, anim, t, time) {
      const pose = poseFor(anim, t, time);
      const down = pose.down;
      const standing = spec.leg + spec.depth * 0.35;
      const bodyY = -standing * (1 - down * 0.78) + pose.crouch;
      const hip: P = { x: -spec.length / 2 + pose.lunge * 0.6 - down * 6, y: bodyY + pose.crouch * 0.6 };
      const shoulder: P = { x: spec.length / 2 + pose.lunge, y: bodyY - pose.crouch * 0.2 };

      const legs = (
        origin: P,
        phase: number,
        far: boolean,
        hind: boolean,
      ): void => {
        const swing = Math.sin(pose.gait + phase) * 0.62 * pose.stride;
        const lift = Math.max(0, Math.cos(pose.gait + phase)) * 0.7 * pose.stride;
        // A lunge reaches the front paws forward and plants the hind ones back.
        const reach = hind ? -pose.lunge * 0.02 : pose.lunge * 0.03;
        const base = (hind ? 0.18 : -0.1) + reach + down * (hind ? 1.2 : 1.35);
        const upper = spec.leg * 0.52;
        const lower = spec.leg * 0.52;
        const a1 = base + swing * (hind ? 1 : 1);
        const knee = at(origin, a1, upper);
        const foot = at(knee, a1 + (hind ? -0.45 - lift : 0.35 - lift * 0.6), lower);
        const tone = far ? shade(spec.color, 0.62) : spec.color;
        capsule(ctx, origin, knee, spec.depth * (hind ? 0.5 : 0.44), tone);
        capsule(ctx, knee, foot, spec.depth * 0.32, tone);
        inked(ctx, far ? shade(spec.color, 0.62) : spec.color, 1.6, () => ctx.ellipse(foot.x + 2.4, foot.y - 0.6, 4.6, 2.6, 0, 0, Math.PI * 2));
      };

      // Far-side legs first, then the tail and body, then the near-side legs.
      legs({ x: hip.x + 2, y: hip.y + spec.depth * 0.2 }, Math.PI, true, true);
      legs({ x: shoulder.x - 2, y: shoulder.y + spec.depth * 0.2 }, 0, true, false);

      if (spec.tail !== 'none') {
        const wag = pose.tailWag;
        const len = spec.length * 0.7;
        const tip: P = { x: hip.x - Math.cos(0.5 + wag - down * 0.4) * len, y: hip.y - Math.sin(0.5 + wag - down * 0.9) * len * 0.55 + down * 14 };
        ctx.lineCap = 'round';
        const w = spec.tail === 'bushy' ? spec.depth * 0.5 : spec.depth * 0.14;
        ctx.strokeStyle = INK;
        ctx.lineWidth = w + 3.4;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y);
        ctx.quadraticCurveTo(hip.x - len * 0.4, hip.y - 4, tip.x, tip.y);
        ctx.stroke();
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y);
        ctx.quadraticCurveTo(hip.x - len * 0.4, hip.y - 4, tip.x, tip.y);
        ctx.stroke();
      }

      // Body: a long barrel with a deeper chest.
      capsule(ctx, hip, shoulder, spec.depth, spec.color);
      capsule(ctx, { x: shoulder.x - 4, y: shoulder.y + 1 }, { x: shoulder.x + 2, y: shoulder.y + 2 }, spec.depth * 1.12, spec.color);
      capsule(ctx, { x: hip.x + 4, y: hip.y + spec.depth * 0.22 }, { x: shoulder.x - 6, y: shoulder.y + spec.depth * 0.22 }, spec.depth * 0.36, spec.belly);

      if (spec.ridge === true) {
        ctx.fillStyle = INK;
        for (let i = 0; i <= 7; i++) {
          const f = i / 7;
          const x = lerp(hip.x + 6, shoulder.x + 2, f);
          const y = lerp(hip.y, shoulder.y, f) - spec.depth / 2;
          ctx.beginPath();
          ctx.moveTo(x - 3, y + 1);
          ctx.lineTo(x + 1, y - 7 - Math.sin(f * Math.PI) * 3);
          ctx.lineTo(x + 3, y + 1);
          ctx.closePath();
          ctx.fill();
        }
      }

      legs({ x: hip.x + 4, y: hip.y + spec.depth * 0.2 }, 0, false, true);
      legs({ x: shoulder.x, y: shoulder.y + spec.depth * 0.2 }, Math.PI, false, false);

      spec.decorate?.(ctx, shoulder, hip);

      // Neck and head.
      const neckLen = spec.depth * 1.2;
      const neckAngle = 0.95 - pose.headPitch * 0.5;
      const base: P = { x: shoulder.x + 2, y: shoulder.y - spec.depth * 0.2 };
      const top: P = { x: base.x + Math.cos(neckAngle) * neckLen + pose.headReach, y: base.y - Math.sin(neckAngle) * neckLen * 0.8 };
      capsule(ctx, base, top, spec.depth * 0.78, spec.color);
      const r = spec.depth * 0.5 * spec.headScale;
      ctx.save();
      ctx.translate(top.x + r * 0.2, top.y - r * 0.1);
      ctx.rotate(pose.headPitch + pose.mouth * 0.12);
      // The jaw hinges open for a bite; the head part draws closed, so open it by splitting.
      HEADS[spec.head](ctx, r, tones);
      if (pose.mouth > 0.2) {
        ctx.save();
        ctx.translate(r * 0.4, r * 0.5);
        ctx.rotate(pose.mouth * 0.5);
        inked(ctx, shade(spec.belly, 0.8), 1.6, () => poly(ctx, [[0, 0], [r * 1.5, r * 0.15], [r * 1.4, r * 0.55], [0, r * 0.5]]));
        inked(ctx, BONE, 1, () => poly(ctx, [[r * 1.0, r * 0.1], [r * 1.1, -r * 0.2], [r * 1.25, r * 0.12]]));
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
