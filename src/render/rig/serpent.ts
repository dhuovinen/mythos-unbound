/**
 * Serpent body plan: a long tapering body along the ground, rearing up into a neck and head.
 *
 * Used for Jormungandr, Apep, Typhon's coils and anything else that slithers. The body is a
 * variable-width tube drawn along a spine; the head is a wedge on the end of it. Extra heads (a
 * hydra, Typhon) branch off the same body on their own necks.
 *
 * Animation is a handful of numbers — how far forward the head reaches, how high it rears, how wide
 * the mouth is, how strongly the body undulates — computed per animation and fed to one drawer.
 */

import type { AnimName, Figure, View } from './figure';
import { ANIM_SECONDS, clamp01, lerp, shade, smooth } from './figure';
import { BLOOD, BONE, INK, inked, poly } from './rig';

export interface SerpentSpec {
  readonly id: string;
  readonly name: string;
  readonly tier: Figure['tier'];
  /** Length of the whole body in rig units. */
  readonly length: number;
  /** Girth at the thickest point. */
  readonly girth: number;
  /** How high the head rears above the ground when idle. */
  readonly rear: number;
  readonly heads?: number;
  readonly color: string;
  readonly belly: string;
  readonly pattern: 'diamond' | 'bands' | 'none';
  readonly patternColor: string;
  readonly eye: string;
  /** Spines along the back of the neck. */
  readonly crest?: boolean;
  readonly horns?: boolean;
}

interface SerpentPose {
  /** Head offset forward (+) or back (-) of its idle position. */
  reach: number;
  /** Extra rearing height; negative lowers the head. */
  lift: number;
  /** Mouth opening, 0..1. */
  mouth: number;
  /** Undulation strength in rig units. */
  wave: number;
  /** Phase of the travelling wave. */
  phase: number;
  /** 0..1 collapse toward the ground. */
  slump: number;
}

function poseFor(anim: AnimName, t: number, time: number): SerpentPose {
  const idle: SerpentPose = { reach: Math.sin(time * 1.3) * 2.5, lift: Math.sin(time * 1.9) * 2.5, mouth: 0, wave: 1.2, phase: time * 1.2, slump: 0 };
  switch (anim) {
    case 'idle':
      return idle;
    case 'walk':
      return { ...idle, wave: 5, phase: time * 5.5, reach: 6 + Math.sin(time * 5.5) * 3, lift: -4 };
    case 'attack': {
      const u = clamp01(t / ANIM_SECONDS.attack);
      const wind = smooth(u / 0.4);
      const strike = smooth((u - 0.4) / 0.16);
      const recover = smooth((u - 0.6) / 0.4);
      const reach = lerp(0, -22, wind) + (lerp(0, 74, strike) - lerp(0, 74, recover)) + 0;
      const lift = lerp(0, 16, wind) + lerp(0, -62, strike) - lerp(0, -62, recover);
      return { ...idle, reach, lift, mouth: strike * (1 - recover), wave: 2, phase: time * 2 };
    }
    case 'hit': {
      const u = clamp01(t / ANIM_SECONDS.hit);
      const kick = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75;
      return { ...idle, reach: -18 * smooth(kick), lift: -10 * smooth(kick), mouth: 0.5 * smooth(kick) };
    }
    case 'death': {
      const u = smooth(clamp01(t / ANIM_SECONDS.death));
      return { reach: lerp(0, 12, u), lift: lerp(0, -300, u), mouth: 0.8 * u, wave: lerp(2, 0, u), phase: 0, slump: u };
    }
  }
}

interface Pt {
  x: number;
  y: number;
}

/** Position along the spine at `s` (0 = tail tip, 1 = head), for a head with the given offsets. */
function spinePoint(spec: SerpentSpec, pose: SerpentPose, s: number, headScale: number, reachBias: number): Pt {
  const L = spec.length;
  const rear = Math.max(spec.girth * 0.55, (spec.rear * headScale + pose.lift) * (1 - pose.slump));
  const neckStart = 0.58;
  const neckU = smooth((s - neckStart) / (1 - neckStart));
  const headX = 10 + pose.reach + reachBias;
  // The body trails straight back; the neck bows into an S as it rises.
  const bow = Math.sin(neckU * Math.PI) * -14;
  const x = lerp(-L, headX, s) + bow * (1 - pose.slump);
  const ground = -spec.girth * 0.5;
  const humps = Math.sin(s * Math.PI * 5 - pose.phase) * pose.wave * (1 - neckU) * Math.min(1, s * 4);
  const y = ground - Math.max(0, humps) - (rear - spec.girth * 0.55) * Math.pow(neckU, 1.25);
  return { x, y };
}

function widthAt(spec: SerpentSpec, s: number): number {
  const taper = s < 0.7 ? 0.14 + 0.86 * smooth(s / 0.7) : 1 - 0.38 * smooth((s - 0.7) / 0.3);
  return spec.girth * taper;
}

function drawBody(ctx: CanvasRenderingContext2D, spec: SerpentSpec, pose: SerpentPose, headScale: number, reachBias: number, dark: boolean): void {
  const N = 40;
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) pts.push(spinePoint(spec, pose, i / N, headScale, reachBias));
  const normals = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)] as Pt;
    const b = pts[Math.min(N, i + 1)] as Pt;
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    return { x: -ty / len, y: tx / len };
  });
  const edge = (side: number, k: number): Pt[] =>
    pts.map((p, i) => {
      const w = (widthAt(spec, i / N) / 2) * k;
      const n = normals[i] as Pt;
      return { x: p.x + n.x * w * side, y: p.y + n.y * w * side };
    });

  const body = dark ? shade(spec.color, 0.7) : spec.color;
  const upper = edge(-1, 1);
  const lower = edge(1, 1);
  inked(ctx, body, 2.6, () => {
    poly(ctx, [...upper, ...lower.reverse()].map((p) => [p.x, p.y] as const));
  });

  // The belly plates, along the underside.
  const bellyA = edge(1, 0.2);
  const bellyB = edge(1, 1);
  ctx.beginPath();
  poly(ctx, [...bellyA, ...bellyB.reverse()].map((p) => [p.x, p.y] as const));
  ctx.fillStyle = dark ? shade(spec.belly, 0.7) : spec.belly;
  ctx.fill();

  // Pattern along the back.
  if (spec.pattern !== 'none') {
    ctx.fillStyle = spec.patternColor;
    for (let i = 3; i < N - 3; i += 3) {
      const p = pts[i] as Pt;
      const n = normals[i] as Pt;
      const w = widthAt(spec, i / N) * 0.34;
      if (spec.pattern === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(p.x - n.y * w, p.y + n.x * w);
        ctx.lineTo(p.x - n.x * w * 0.6, p.y - n.y * w * 0.6);
        ctx.lineTo(p.x + n.y * w, p.y - n.x * w);
        ctx.lineTo(p.x + n.x * w * 0.2, p.y + n.y * w * 0.2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = spec.patternColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p.x - n.x * w * 1.1, p.y - n.y * w * 1.1);
        ctx.lineTo(p.x + n.x * w * 0.3, p.y + n.y * w * 0.3);
        ctx.stroke();
      }
    }
  }

  // Spines along the neck.
  if (spec.crest === true) {
    ctx.fillStyle = INK;
    for (let i = Math.floor(N * 0.58); i < N - 1; i += 2) {
      const p = pts[i] as Pt;
      const n = normals[i] as Pt;
      const w = widthAt(spec, i / N) / 2;
      ctx.beginPath();
      ctx.moveTo(p.x - n.x * w, p.y - n.y * w);
      ctx.lineTo(p.x - n.x * (w + 7), p.y - n.y * (w + 7) - 2);
      ctx.lineTo(p.x - n.x * w + 3, p.y - n.y * w);
      ctx.closePath();
      ctx.fill();
    }
  }

  // The head, at the end of the spine, tilted down along the neck's direction.
  const head = pts[N] as Pt;
  const prev = pts[N - 3] as Pt;
  const angle = Math.atan2(head.y - prev.y, head.x - prev.x);
  const size = spec.girth * (headScale > 0.95 ? 0.85 : 0.7);
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(Math.max(-0.5, Math.min(0.9, angle * 0.4 + 0.45 + pose.mouth * 0.15)));
  drawHead(ctx, spec, size, pose.mouth, dark);
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, spec: SerpentSpec, r: number, mouth: number, dark: boolean): void {
  const body = dark ? shade(spec.color, 0.7) : spec.color;
  const open = mouth * r * 0.9;

  if (spec.horns === true) {
    ctx.fillStyle = BONE;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    for (const dx of [-0.2, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(r * dx, -r * 0.5);
      ctx.quadraticCurveTo(r * (dx - 0.8), -r * 1.2, r * (dx - 1.4), -r * 1.0);
      ctx.quadraticCurveTo(r * (dx - 0.7), -r * 0.7, r * (dx + 0.3), -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Lower jaw, hinged open when the mouth is.
  ctx.save();
  ctx.translate(-r * 0.1, r * 0.25);
  ctx.rotate(open / (r * 3));
  inked(ctx, shade(spec.belly, 0.9), 1.8, () => poly(ctx, [[0, 0], [r * 2.0, r * 0.12], [r * 1.9, r * 0.5], [r * 0.2, r * 0.55]]));
  if (mouth > 0.15) {
    inked(ctx, BONE, 1, () => poly(ctx, [[r * 1.3, r * 0.1], [r * 1.4, -r * 0.2], [r * 1.55, r * 0.1]]));
    ctx.fillStyle = BLOOD;
    ctx.fillRect(r * 0.4, r * 0.05, r * 1.2, r * 0.12);
  }
  ctx.restore();

  // Skull and snout.
  inked(ctx, body, 2, () => {
    ctx.moveTo(-r * 0.7, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.95, r * 2.15, -r * 0.1);
    ctx.lineTo(r * 2.1, r * 0.22);
    ctx.lineTo(-r * 0.3, r * 0.3);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.1, -r * 0.7, -r * 0.55);
  });
  if (mouth > 0.15) inked(ctx, BONE, 1, () => poly(ctx, [[r * 1.5, r * 0.18], [r * 1.62, r * 0.55], [r * 1.74, r * 0.2]]));
  ctx.fillStyle = INK;
  ctx.fillRect(r * 2.0, -r * 0.1, 2, 2);
  inked(ctx, spec.eye, 1.2, () => ctx.ellipse(r * 0.8, -r * 0.35, r * 0.3, r * 0.2, 0.2, 0, Math.PI * 2));
  ctx.fillStyle = INK;
  ctx.fillRect(r * 0.82, -r * 0.4, 1.6, r * 0.32);
}

export function makeSerpent(spec: SerpentSpec): Figure {
  const heads = spec.heads ?? 1;
  const view: View = { x: -30, y: -(spec.rear + spec.girth * 0.5) - 38, w: 88, h: 72 };
  return {
    id: spec.id,
    name: spec.name,
    tier: spec.tier,
    body: 'serpent',
    view,
    draw(ctx, anim, t, time) {
      const pose = poseFor(anim, t, time);
      // Extra heads rise on their own necks, behind the main one.
      for (let i = heads - 1; i >= 1; i--) {
        const p = { ...pose, phase: pose.phase + i * 1.7, reach: pose.reach * (0.8 - i * 0.1) - 8 * i, lift: pose.lift * 0.6 + Math.sin(time * 1.4 + i * 2) * 3 };
        drawBody(ctx, spec, p, 0.78 - i * 0.12, -9 * i, true);
      }
      drawBody(ctx, spec, pose, 1, 0, false);
    },
  };
}
