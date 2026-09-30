/**
 * Battlefield backdrops and the base structures that stand on them.
 *
 * One scene per realm — Greek, Norse, Egyptian — plus an open-world city for decks that mix
 * pantheons. Each scene is painted once into an offscreen canvas and blitted every frame; only a
 * thin layer of ambient motion (stars, aurora, snow, neon, traffic) is redrawn live.
 *
 * Rules inherited from the art direction:
 *  - **No gold.** Oxidized gold is reserved for relational VFX, so nothing here may read as gold or
 *    amber-yellow. Warm light is rose, terracotta or salmon; lamps and screens are cool white.
 *  - **The unit band stays quiet.** Units stand around y=400 and are up to ~100px tall, so the
 *    region behind them is kept dark and low-contrast. Scenery gets busy above it and below it.
 *  - **No Math.random().** Everything varies by hashing an index, so a scene is identical every
 *    frame and every reload.
 */

import { CANVAS_HEIGHT as H, CANVAS_WIDTH as W, LANE_Y } from '../sim/constants';
import type { Side } from '../sim/types';
import type { BackdropChoice } from '../ui/settings';

export type BackdropId = Exclude<BackdropChoice, 'auto'>;

export const BACKDROPS: readonly { id: BackdropId; label: string }[] = [
  { id: 'greek', label: 'Greek' },
  { id: 'norse', label: 'Norse' },
  { id: 'egyptian', label: 'Egyptian' },
  { id: 'openworld', label: 'Open World' },
];

const INK = '#1A1A1E';
const BONE = '#EDE6D6';
const BONE_SHADE = '#c4baa3';
const BLOOD_DARK = '#8C2F20';
const BLOOD_SHADE = '#5e1f15';

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

/** Integer hash to [0, 1). */
function hash(n: number): number {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function vnoise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i * 7919 + seed) * (1 - u) + hash((i + 1) * 7919 + seed) * u;
}

function fbm(x: number, seed: number): number {
  return vnoise(x, seed) * 0.6 + vnoise(x * 2.3, seed + 11) * 0.3 + vnoise(x * 5.1, seed + 23) * 0.1;
}

type Ctx = CanvasRenderingContext2D;
type Stops = readonly (readonly [number, string])[];

function vgrad(ctx: Ctx, y0: number, y1: number, stops: Stops): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

/** Fills a mountain or dune silhouette. Returns the peak points so callers can dress them. */
function ridge(
  ctx: Ctx,
  baseY: number,
  amp: number,
  seed: number,
  freq: number,
  color: string,
  ridged = false,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  ctx.beginPath();
  ctx.moveTo(0, baseY + 200);
  for (let x = 0; x <= W; x += 4) {
    const n = fbm(x * freq, seed);
    const shaped = ridged ? 1 - Math.abs(n * 2 - 1) : n;
    const y = baseY - amp * shaped;
    points.push({ x, y });
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, baseY + 200);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  return points;
}

function stars(ctx: Ctx, count: number, maxY: number, seed: number, t: number, alpha: number): void {
  ctx.fillStyle = BONE;
  for (let i = 0; i < count; i++) {
    const x = hash(i * 3 + seed) * W;
    const y = hash(i * 3 + seed + 1) * maxY;
    const twinkle = 0.55 + 0.45 * Math.sin(t * (0.6 + hash(i + seed) * 1.4) + i * 7);
    ctx.globalAlpha = alpha * twinkle * (0.4 + hash(i * 3 + seed + 2) * 0.6);
    const s = hash(i + seed + 40) > 0.85 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

function inked(ctx: Ctx, fill: string, lineWidth: number, path: () => void): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** Edge darkening shared by every scene, which also keeps the HUD corners calm. */
function vignette(ctx: Ctx): void {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = vgrad(ctx, H - 50, H, [
    [0, 'rgba(0,0,0,0)'],
    [1, 'rgba(0,0,0,0.5)'],
  ]);
  ctx.fillRect(0, H - 50, W, 50);
}

// ---------------------------------------------------------------------------
// Greek — a marble acropolis above a dusk sea
// ---------------------------------------------------------------------------

function temple(ctx: Ctx, cx: number, baseY: number, width: number, colH: number, fill: string, edge: string): void {
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    const w = width + (steps - i) * 10;
    inked(ctx, fill, 1.5, () => ctx.rect(cx - w / 2, baseY - (steps - i) * 4, w, 4));
  }
  const cols = 8;
  const span = width - 14;
  for (let i = 0; i < cols; i++) {
    const x = cx - span / 2 + (span / (cols - 1)) * i;
    inked(ctx, fill, 1.2, () => ctx.rect(x - 3, baseY - 12 - colH, 6, colH));
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 0.5, baseY - 12 - colH + 2);
    ctx.lineTo(x - 0.5, baseY - 14);
    ctx.stroke();
  }
  inked(ctx, fill, 1.5, () => ctx.rect(cx - width / 2, baseY - 20 - colH, width, 8));
  inked(ctx, fill, 1.5, () => {
    ctx.moveTo(cx - width / 2 - 4, baseY - 20 - colH);
    ctx.lineTo(cx, baseY - 20 - colH - width * 0.14);
    ctx.lineTo(cx + width / 2 + 4, baseY - 20 - colH);
    ctx.closePath();
  });
}

function paintGreek(ctx: Ctx): void {
  ctx.fillStyle = vgrad(ctx, 0, 372, [
    [0, '#0e1325'],
    [0.5, '#20243f'],
    [0.85, '#4b3f58'],
    [1, '#7c5a64'],
  ]);
  ctx.fillRect(0, 0, W, 372);

  // Moon and a soft halo.
  glow(ctx, 740, 92, 90, '#8a93b8', 0.35);
  ctx.fillStyle = '#d9d6cf';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(740, 92, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ridge(ctx, 318, 80, 101, 0.006, '#2b2c47', true);
  ridge(ctx, 338, 44, 207, 0.009, '#222238', true);

  // The sea, with the horizon line lifted by a pale band.
  ctx.fillStyle = vgrad(ctx, 326, 376, [
    [0, '#34406a'],
    [1, '#1a2036'],
  ]);
  ctx.fillRect(0, 326, W, 50);

  // The acropolis: a rocky mound carrying a temple.
  ctx.beginPath();
  ctx.moveTo(240, 382);
  for (let x = 240; x <= 730; x += 6) {
    const t = (x - 240) / 490;
    const dome = Math.sin(t * Math.PI);
    const y = 382 - 100 * Math.pow(dome, 0.6) - fbm(x * 0.05, 311) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(730, 382);
  ctx.closePath();
  ctx.fillStyle = '#1f1d2d';
  ctx.fill();
  ctx.strokeStyle = '#15131f';
  ctx.lineWidth = 2;
  ctx.stroke();
  temple(ctx, 486, 286, 210, 36, '#34314a', '#1e1c2c');
  temple(ctx, 630, 312, 70, 16, '#2e2c43', '#1e1c2c');

  // Cypress trees flank the lane and frame the scene.
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? 0 : 1;
    const x = side === 0 ? 10 + hash(i + 50) * 210 : 740 + hash(i + 50) * 210;
    const h = 52 + hash(i + 70) * 46;
    ctx.fillStyle = '#10171a';
    ctx.beginPath();
    ctx.ellipse(x, 388 - h / 2, 8 + hash(i + 90) * 4, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass verge, then the marble causeway the units walk on.
  ctx.fillStyle = '#1b201f';
  ctx.fillRect(0, 376, W, 20);
  ctx.fillStyle = vgrad(ctx, LANE_Y - 8, H, [
    [0, '#46403f'],
    [0.12, '#302c2d'],
    [1, '#1a1718'],
  ]);
  ctx.fillRect(0, LANE_Y - 8, W, H - LANE_Y + 8);
  ctx.strokeStyle = '#5a5250';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y - 8);
  ctx.lineTo(W, LANE_Y - 8);
  ctx.stroke();

  // Paving courses get taller toward the viewer, with staggered joints.
  const rows = [LANE_Y - 8, 424, 450, 484, H];
  ctx.strokeStyle = '#151314';
  ctx.lineWidth = 1.5;
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r] as number;
    const y1 = rows[r + 1] as number;
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(W, y1);
    ctx.stroke();
    const step = 52 + r * 26;
    const offset = r % 2 === 0 ? 0 : step / 2;
    for (let x = -offset; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
    }
  }

  // A toppled column drum and a broken capital in the near corners.
  for (const [cx, cy] of [[70, 508], [880, 514]] as const) {
    inked(ctx, '#2a2627', 2, () => ctx.ellipse(cx, cy, 34, 12, 0, 0, Math.PI * 2));
    inked(ctx, '#3a3536', 2, () => ctx.ellipse(cx + 8, cy - 4, 26, 8, 0, 0, Math.PI * 2));
  }
  vignette(ctx);
}

function animateGreek(ctx: Ctx, t: number): void {
  stars(ctx, 60, 230, 10, t, 0.7);
  // Slow clouds catching the last of the light.
  ctx.fillStyle = '#9a7f8c';
  for (let i = 0; i < 4; i++) {
    const x = ((hash(i + 300) * (W + 500) + t * (5 + i * 2)) % (W + 500)) - 250;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.ellipse(x, 120 + i * 34, 140 + i * 18, 7 + i * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glints on the water.
  ctx.fillStyle = '#b8c3e8';
  for (let i = 0; i < 26; i++) {
    const x = hash(i + 400) * W;
    const y = 332 + hash(i + 450) * 38;
    ctx.globalAlpha = 0.25 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.1));
    ctx.fillRect(x, y, 10 + hash(i) * 14, 1.5);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Norse — a frozen fjord under the aurora
// ---------------------------------------------------------------------------

function pine(ctx: Ctx, x: number, baseY: number, h: number, color: string): void {
  ctx.fillStyle = color;
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const w = (h * 0.34) * (1 - i * 0.2);
    const y = baseY - (h / tiers) * i;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y - (h / tiers) * 1.5);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
  }
}

function longhouse(ctx: Ctx, x: number, baseY: number, w: number, h: number): void {
  inked(ctx, '#0c151c', 1.5, () => {
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x - w / 2, baseY - h * 0.45);
    ctx.lineTo(x - w * 0.36, baseY - h);
    ctx.lineTo(x + w * 0.36, baseY - h);
    ctx.lineTo(x + w / 2, baseY - h * 0.45);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath();
  });
  ctx.fillStyle = '#c27a55';
  ctx.globalAlpha = 0.75;
  ctx.fillRect(x - 3, baseY - h * 0.4, 6, 7);
  ctx.globalAlpha = 1;
}

function paintNorse(ctx: Ctx): void {
  ctx.fillStyle = vgrad(ctx, 0, 372, [
    [0, '#060b18'],
    [0.6, '#0e2232'],
    [1, '#1d3c47'],
  ]);
  ctx.fillRect(0, 0, W, 372);

  glow(ctx, 210, 96, 120, '#9ec3d4', 0.3);
  ctx.fillStyle = '#e4ecef';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(210, 96, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const far = ridge(ctx, 318, 130, 511, 0.0055, '#22374a', true);
  ctx.strokeStyle = '#a9c3cf';
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 2;
  ctx.beginPath();
  far.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ridge(ctx, 352, 56, 633, 0.008, '#12202c', true);

  // Fjord water with a moon path.
  ctx.fillStyle = vgrad(ctx, 346, 380, [
    [0, '#14293a'],
    [1, '#0b1721'],
  ]);
  ctx.fillRect(0, 346, W, 34);

  // Pine forest thick at the edges, thin through the middle so the lane stays readable.
  for (let i = 0; i < 70; i++) {
    const edge = hash(i + 800) < 0.75;
    const x = edge ? (hash(i + 810) < 0.5 ? hash(i + 820) * 230 : W - hash(i + 820) * 230) : hash(i + 830) * W;
    pine(ctx, x, 384 - hash(i + 840) * 8, 44 + hash(i + 850) * 54, '#091219');
  }
  longhouse(ctx, 330, 384, 70, 28);
  longhouse(ctx, 640, 384, 58, 24);

  // Snowfield, then the frozen road.
  ctx.fillStyle = '#2b3944';
  ctx.fillRect(0, 378, W, 20);
  ctx.fillStyle = vgrad(ctx, LANE_Y - 6, H, [
    [0, '#3d4953'],
    [0.1, '#2a3239'],
    [1, '#151b20'],
  ]);
  ctx.fillRect(0, LANE_Y - 6, W, H - LANE_Y + 6);
  ctx.strokeStyle = '#6f8491';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y - 6);
  ctx.lineTo(W, LANE_Y - 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Wind-packed ruts and ice cracks.
  ctx.strokeStyle = '#10161a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 22; i++) {
    const x = hash(i + 900) * W;
    const y = 412 + hash(i + 910) * 120;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 + hash(i) * 30, y + (hash(i + 5) - 0.5) * 10);
    ctx.lineTo(x + 40 + hash(i) * 40, y + (hash(i + 6) - 0.5) * 16);
    ctx.stroke();
  }
  // Rune stones in the foreground.
  for (const [sx, sy] of [[90, 500], [860, 506], [480, 528]] as const) {
    inked(ctx, '#232c33', 2, () => {
      ctx.moveTo(sx - 12, sy + 16);
      ctx.lineTo(sx - 9, sy - 18);
      ctx.lineTo(sx + 4, sy - 24);
      ctx.lineTo(sx + 12, sy - 12);
      ctx.lineTo(sx + 10, sy + 16);
      ctx.closePath();
    });
    ctx.strokeStyle = '#6b8c99';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy - 14);
    ctx.lineTo(sx + 3, sy - 4);
    ctx.lineTo(sx - 3, sy + 4);
    ctx.lineTo(sx + 3, sy + 12);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  vignette(ctx);
}

function animateNorse(ctx: Ctx, t: number): void {
  stars(ctx, 90, 240, 20, t, 0.75);

  // Aurora ribbons, added to the sky with additive light.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const palette = ['rgba(46,196,140,', 'rgba(70,150,220,', 'rgba(150,90,200,'];
  for (let k = 0; k < 3; k++) {
    const color = palette[k] as string;
    const g = vgrad(ctx, 30, 230, [
      [0, `${color}0)`],
      [0.3, `${color}0.22)`],
      [1, `${color}0)`],
    ]);
    ctx.fillStyle = g;
    ctx.beginPath();
    const base = 70 + k * 30;
    for (let x = 0; x <= W; x += 16) {
      const y = base + 34 * Math.sin(x * 0.008 + t * (0.25 + k * 0.08) + k * 2) + 18 * Math.sin(x * 0.021 - t * 0.4);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = W; x >= 0; x -= 16) {
      const y = base + 34 * Math.sin(x * 0.008 + t * (0.25 + k * 0.08) + k * 2) + 18 * Math.sin(x * 0.021 - t * 0.4);
      ctx.lineTo(x, y + 110 + 30 * Math.sin(x * 0.013 + t * 0.3));
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Moon path on the water.
  ctx.fillStyle = '#b5d3df';
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.22 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.9));
    ctx.fillRect(190 + hash(i + 70) * 40, 350 + i * 2, 8 + hash(i) * 14, 1.5);
  }

  // Snowfall, drifting with a little sway.
  ctx.fillStyle = '#dce8ee';
  for (let i = 0; i < 90; i++) {
    const speed = 16 + hash(i + 900) * 26;
    const x = hash(i) * W + Math.sin(t * 0.6 + i) * 14;
    const y = (hash(i + 500) * H + t * speed) % H;
    ctx.globalAlpha = 0.3 + hash(i + 200) * 0.4;
    const s = hash(i + 300) > 0.8 ? 2.2 : 1.3;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Egyptian — pyramids and the Nile at sunset
// ---------------------------------------------------------------------------

function pyramid(ctx: Ctx, cx: number, baseY: number, w: number, h: number, lit: string, dark: string): void {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.lineTo(cx + w * 0.04, baseY - h);
  ctx.lineTo(cx, baseY);
  ctx.closePath();
  ctx.fillStyle = lit;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.lineTo(cx + w * 0.04, baseY - h);
  ctx.lineTo(cx + w / 2, baseY);
  ctx.closePath();
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.lineTo(cx + w * 0.04, baseY - h);
  ctx.lineTo(cx + w / 2, baseY);
  ctx.stroke();
}

function palm(ctx: Ctx, x: number, baseY: number, h: number, lean: number): void {
  ctx.strokeStyle = '#140f14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.3, baseY - h * 0.6, x + lean, baseY - h);
  ctx.stroke();
  ctx.lineWidth = 2;
  const tx = x + lean;
  const ty = baseY - h;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.55;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * 16, ty + Math.sin(a) * 16 - 4, tx + Math.cos(a) * 28, ty + Math.sin(a) * 22 + 12);
    ctx.stroke();
  }
}

function obelisk(ctx: Ctx, x: number, baseY: number, h: number): void {
  inked(ctx, '#3c2a33', 1.5, () => {
    ctx.moveTo(x - 7, baseY);
    ctx.lineTo(x - 4, baseY - h);
    ctx.lineTo(x, baseY - h - 10);
    ctx.lineTo(x + 4, baseY - h);
    ctx.lineTo(x + 7, baseY);
    ctx.closePath();
  });
}

function paintEgyptian(ctx: Ctx): void {
  ctx.fillStyle = vgrad(ctx, 0, 372, [
    [0, '#170f2c'],
    [0.5, '#472b49'],
    [0.85, '#9a5248'],
    [1, '#b8705a'],
  ]);
  ctx.fillRect(0, 0, W, 372);

  glow(ctx, 480, 318, 230, '#e09a82', 0.45);
  ctx.fillStyle = '#eab59a';
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(480, 318, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ridge(ctx, 346, 28, 71, 0.008, '#6b3c44');
  pyramid(ctx, 235, 352, 210, 132, '#573544', '#3a2233');
  pyramid(ctx, 110, 352, 120, 74, '#4d2f3e', '#33202f');
  pyramid(ctx, 730, 352, 250, 152, '#573544', '#3a2233');

  // The Nile with a sun path.
  ctx.fillStyle = vgrad(ctx, 350, 384, [
    [0, '#3a4a66'],
    [1, '#1a2438'],
  ]);
  ctx.fillRect(0, 350, W, 34);

  // Palms and obelisks along the bank.
  for (const [x, h, lean] of [[60, 70, 10], [108, 54, -8], [856, 66, -12], [910, 78, 9], [390, 40, 6], [590, 44, -6]] as const) {
    palm(ctx, x, 386, h, lean);
  }
  obelisk(ctx, 330, 386, 70);
  obelisk(ctx, 660, 386, 82);

  // Sand, and a paved processional avenue down the lane.
  ctx.fillStyle = '#4a342f';
  ctx.fillRect(0, 380, W, 22);
  ctx.fillStyle = vgrad(ctx, LANE_Y - 6, H, [
    [0, '#5d4640'],
    [0.1, '#3f2e2c'],
    [1, '#1d1416'],
  ]);
  ctx.fillRect(0, LANE_Y - 6, W, H - LANE_Y + 6);
  ctx.strokeStyle = '#7a5c54';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y - 6);
  ctx.lineTo(W, LANE_Y - 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Wind ripples in the sand.
  ctx.strokeStyle = '#7a5c54';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const x = hash(i + 1000) * W;
    const y = 416 + hash(i + 1010) * 116;
    ctx.globalAlpha = 0.14 + hash(i) * 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 22, y - 5, x + 50 + hash(i + 3) * 30, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sphinx-style guardian silhouettes at the near edges.
  for (const [sx, dir] of [[78, 1], [882, -1]] as const) {
    inked(ctx, '#2a1b22', 2, () => {
      ctx.moveTo(sx - dir * 36, 530);
      ctx.lineTo(sx - dir * 36, 512);
      ctx.lineTo(sx - dir * 10, 508);
      ctx.lineTo(sx - dir * 6, 490);
      ctx.lineTo(sx + dir * 4, 486);
      ctx.lineTo(sx + dir * 12, 494);
      ctx.lineTo(sx + dir * 10, 512);
      ctx.lineTo(sx + dir * 30, 516);
      ctx.lineTo(sx + dir * 30, 530);
      ctx.closePath();
    });
  }
  vignette(ctx);
}

function animateEgyptian(ctx: Ctx, t: number): void {
  stars(ctx, 55, 190, 30, t, 0.6);
  glow(ctx, 480, 318, 260, '#e9a78d', 0.07 + 0.04 * Math.sin(t * 0.7));

  ctx.fillStyle = '#f0b9a0';
  for (let i = 0; i < 16; i++) {
    ctx.globalAlpha = 0.22 * (0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.7));
    ctx.fillRect(450 + hash(i + 60) * 60, 352 + i * 2, 8 + hash(i) * 16, 1.5);
  }

  // Wind-blown dust streaks low over the sand.
  ctx.fillStyle = '#c99a86';
  for (let i = 0; i < 12; i++) {
    const speed = 30 + hash(i + 70) * 40;
    const x = ((hash(i) * (W + 200) + t * speed) % (W + 200)) - 100;
    const y = 404 + hash(i + 80) * 120;
    ctx.globalAlpha = 0.07;
    ctx.fillRect(x, y, 60 + hash(i + 90) * 80, 1.5);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Open world — a downtown street at night
// ---------------------------------------------------------------------------

interface Building {
  readonly x: number;
  readonly w: number;
  readonly h: number;
}

const skylines = new Map<string, Building[]>();

function skyline(key: string, seed: number, minW: number, maxW: number, minH: number, maxH: number): Building[] {
  const cached = skylines.get(key);
  if (cached !== undefined) return cached;
  const out: Building[] = [];
  let x = -10;
  let i = 0;
  while (x < W + 10) {
    const w = minW + hash(seed + i * 3) * (maxW - minW);
    const h = minH + hash(seed + i * 3 + 1) * (maxH - minH);
    out.push({ x, w, h });
    x += w + hash(seed + i * 3 + 2) * 4;
    i++;
  }
  skylines.set(key, out);
  return out;
}

const FAR_SKY = (): Building[] => skyline('far', 5000, 26, 60, 60, 190);
const MID_SKY = (): Building[] => skyline('mid', 6000, 30, 70, 40, 120);

function windows(ctx: Ctx, b: Building, baseY: number, seed: number, lit: string, density: number): void {
  const cols = Math.max(1, Math.floor(b.w / 9));
  const rows = Math.max(1, Math.floor(b.h / 11));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (hash(seed + r * 31 + c * 7 + Math.floor(b.x)) > density) continue;
      ctx.fillStyle = lit;
      ctx.fillRect(b.x + 4 + c * 9, baseY - b.h + 6 + r * 11, 4, 5);
    }
  }
}

function paintOpenWorld(ctx: Ctx): void {
  ctx.fillStyle = vgrad(ctx, 0, 372, [
    [0, '#090a17'],
    [0.6, '#1b1632'],
    [0.9, '#4b2b4d'],
    [1, '#6a3d5a'],
  ]);
  ctx.fillRect(0, 0, W, 372);

  glow(ctx, 760, 86, 80, '#8a93b8', 0.25);
  ctx.fillStyle = '#d6d6dc';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(760, 86, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // City glow rising off the horizon.
  glow(ctx, 480, 372, 420, '#9a4a7a', 0.28);

  for (const b of FAR_SKY()) {
    ctx.fillStyle = '#1e1a36';
    ctx.fillRect(b.x, 376 - b.h, b.w, b.h);
    windows(ctx, b, 376, 11, 'rgba(150,170,220,0.4)', 0.22);
  }

  // Landmarks: a tall mast tower, an art-deco stepped tower and a domed hall.
  const mast = 560;
  inked(ctx, '#161228', 1.5, () => {
    ctx.moveTo(mast - 18, 376);
    ctx.lineTo(mast - 14, 150);
    ctx.lineTo(mast - 6, 140);
    ctx.lineTo(mast - 6, 100);
    ctx.lineTo(mast - 2, 100);
    ctx.lineTo(mast - 1, 70);
    ctx.lineTo(mast + 1, 70);
    ctx.lineTo(mast + 2, 100);
    ctx.lineTo(mast + 6, 100);
    ctx.lineTo(mast + 6, 140);
    ctx.lineTo(mast + 14, 150);
    ctx.lineTo(mast + 18, 376);
    ctx.closePath();
  });
  inked(ctx, '#161228', 1.5, () => {
    ctx.moveTo(300, 376);
    ctx.lineTo(300, 210);
    ctx.lineTo(312, 210);
    ctx.lineTo(312, 170);
    ctx.lineTo(326, 170);
    ctx.lineTo(326, 140);
    ctx.lineTo(334, 120);
    ctx.lineTo(342, 140);
    ctx.lineTo(342, 170);
    ctx.lineTo(356, 170);
    ctx.lineTo(356, 210);
    ctx.lineTo(368, 210);
    ctx.lineTo(368, 376);
    ctx.closePath();
  });
  inked(ctx, '#161228', 1.5, () => {
    ctx.rect(690, 290, 110, 86);
    ctx.moveTo(700, 290);
    ctx.arc(745, 290, 38, Math.PI, 0);
  });

  for (const b of MID_SKY()) {
    ctx.fillStyle = '#100e1e';
    ctx.fillRect(b.x, 378 - b.h, b.w, b.h);
    windows(ctx, b, 378, 22, 'rgba(170,190,235,0.45)', 0.2);
  }

  // Shopfront row just behind the sidewalk, with neon signs.
  ctx.fillStyle = '#0e0c19';
  ctx.fillRect(0, 346, W, 50);
  for (let i = 0; i < 12; i++) {
    const x = 6 + i * 80;
    ctx.fillStyle = 'rgba(120,150,200,0.22)';
    ctx.fillRect(x + 6, 362, 52, 28);
    ctx.fillStyle = hash(i + 700) > 0.5 ? '#6a2f66' : '#1f5560';
    ctx.fillRect(x + 4, 354, 56, 6);
  }

  // Street: sidewalk, curb, asphalt.
  ctx.fillStyle = '#2c2938';
  ctx.fillRect(0, 392, W, 10);
  ctx.fillStyle = vgrad(ctx, LANE_Y - 8, H, [
    [0, '#2b2836'],
    [0.1, '#201e2a'],
    [1, '#100f16'],
  ]);
  ctx.fillRect(0, LANE_Y - 8, W, H - LANE_Y + 8);
  ctx.strokeStyle = '#4a4660';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y - 8);
  ctx.lineTo(W, LANE_Y - 8);
  ctx.stroke();

  // Lane markings — bone, not yellow, per the no-gold rule.
  ctx.fillStyle = BONE;
  ctx.globalAlpha = 0.35;
  for (let x = 10; x < W; x += 78) ctx.fillRect(x, 452, 42, 4);
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, 510, W, 3);
  // Crosswalk at mid-street.
  for (let i = 0; i < 9; i++) ctx.fillRect(430 + i * 11, 414, 6, 36);
  ctx.globalAlpha = 1;

  // Streetlamps: cool-white heads with a soft pool of light.
  for (const lx of [150, 390, 640, 850]) {
    glow(ctx, lx, 420, 90, '#9fb8ff', 0.12);
    ctx.strokeStyle = '#0d0c14';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, 398);
    ctx.lineTo(lx, 300);
    ctx.quadraticCurveTo(lx, 286, lx + 14, 286);
    ctx.stroke();
    ctx.fillStyle = '#dbe6ff';
    ctx.fillRect(lx + 9, 284, 12, 4);
  }
  // Manholes.
  for (const mx of [230, 560, 790]) {
    inked(ctx, '#17151f', 1.5, () => ctx.ellipse(mx, 490, 18, 5, 0, 0, Math.PI * 2));
  }
  vignette(ctx);
}

function animateOpenWorld(ctx: Ctx, t: number): void {
  stars(ctx, 30, 160, 40, t, 0.4);

  // Office windows switching on and off.
  for (const b of FAR_SKY()) {
    const cols = Math.max(1, Math.floor(b.w / 9));
    const rows = Math.max(1, Math.floor(b.h / 11));
    for (let k = 0; k < 3; k++) {
      const r = Math.floor(hash(b.x * 13 + k) * rows);
      const c = Math.floor(hash(b.x * 17 + k) * cols);
      const on = Math.floor(t * 0.35 + hash(b.x + k) * 10) % 2 === 0;
      ctx.fillStyle = on ? 'rgba(190,205,245,0.6)' : 'rgba(10,10,24,0.9)';
      ctx.fillRect(b.x + 4 + c * 9, 376 - b.h + 6 + r * 11, 4, 5);
    }
  }

  // Aircraft beacon on the mast.
  if (Math.floor(t * 1.1) % 2 === 0) {
    glow(ctx, 560, 68, 14, '#ff4a3a', 0.9);
  }

  // Neon signs breathing, with the occasional stutter.
  const signs: readonly [number, number, number, string][] = [[70, 356, 30, '#e04aa8'], [310, 356, 38, '#3ad0e0'], [690, 356, 34, '#e04aa8'], [890, 356, 30, '#3ad0e0']];
  for (const [x, y, w, color] of signs) {
    const stutter = Math.sin(t * 19 + x) > 0.96 ? 0.25 : 1;
    ctx.globalAlpha = (0.55 + 0.25 * Math.sin(t * 2.2 + x)) * stutter;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 3);
    glow(ctx, x + w / 2, y + 2, 40, color, 0.22 * stutter);
  }
  ctx.globalAlpha = 1;

  // Traffic on the elevated road behind the shops: headlights one way, tail-lights the other.
  for (let i = 0; i < 9; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = 50 + hash(i + 77) * 50;
    const x = (((hash(i) * W + dir * t * speed) % W) + W) % W;
    ctx.fillStyle = dir > 0 ? '#e8efff' : '#ff5a4a';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, 342 + (dir > 0 ? 0 : 3), 3, 2);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Public API: scenes
// ---------------------------------------------------------------------------

const PAINT: Readonly<Record<BackdropId, (ctx: Ctx) => void>> = {
  greek: paintGreek,
  norse: paintNorse,
  egyptian: paintEgyptian,
  openworld: paintOpenWorld,
};

const ANIMATE: Readonly<Record<BackdropId, (ctx: Ctx, t: number) => void>> = {
  greek: animateGreek,
  norse: animateNorse,
  egyptian: animateEgyptian,
  openworld: animateOpenWorld,
};

const cache = new Map<BackdropId, HTMLCanvasElement>();

function staticLayer(id: BackdropId): HTMLCanvasElement {
  const existing = cache.get(id);
  if (existing !== undefined) return existing;
  const layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  const ctx = layer.getContext('2d');
  if (ctx !== null) PAINT[id](ctx);
  cache.set(id, layer);
  return layer;
}

/** Draws the scene for `id`. `seconds` drives ambient motion only — it never affects gameplay. */
export function drawBackdropScene(ctx: Ctx, id: BackdropId, seconds: number): void {
  ctx.drawImage(staticLayer(id), 0, 0);
  ctx.save();
  ANIMATE[id](ctx, seconds);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Public API: bases
// ---------------------------------------------------------------------------

/** Tallest any base may stand above the lane; the health bar is positioned from this. */
export const BASE_HEIGHT = 104;

/** Draws the structure a realm's bases take: temple, hall, pylon, or tower. */
export function drawBaseStructure(ctx: Ctx, id: BackdropId, sx: number, side: Side): void {
  const fill = side === 'player' ? BONE : BLOOD_DARK;
  const shade = side === 'player' ? BONE_SHADE : BLOOD_SHADE;
  const B = LANE_Y;

  switch (id) {
    case 'greek': {
      inked(ctx, fill, 2, () => ctx.rect(sx - 34, B - 5, 68, 5));
      inked(ctx, fill, 2, () => ctx.rect(sx - 30, B - 10, 60, 5));
      for (let i = 0; i < 4; i++) {
        const x = sx - 22 + i * 14.7;
        inked(ctx, fill, 2, () => ctx.rect(x - 4, B - 66, 8, 56));
        ctx.strokeStyle = shade;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 1, B - 62);
        ctx.lineTo(x - 1, B - 14);
        ctx.stroke();
      }
      inked(ctx, fill, 2, () => ctx.rect(sx - 30, B - 76, 60, 10));
      inked(ctx, fill, 2, () => {
        ctx.moveTo(sx - 35, B - 76);
        ctx.lineTo(sx, B - 102);
        ctx.lineTo(sx + 35, B - 76);
        ctx.closePath();
      });
      inked(ctx, shade, 1.5, () => {
        ctx.moveTo(sx - 20, B - 79);
        ctx.lineTo(sx, B - 93);
        ctx.lineTo(sx + 20, B - 79);
        ctx.closePath();
      });
      return;
    }
    case 'norse': {
      inked(ctx, fill, 2, () => ctx.rect(sx - 26, B - 46, 52, 46));
      ctx.strokeStyle = shade;
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 10, B - 44);
        ctx.lineTo(sx + i * 10, B - 2);
        ctx.stroke();
      }
      inked(ctx, INK, 1.5, () => ctx.rect(sx - 6, B - 26, 12, 26));
      for (const dx of [-18, 18]) {
        inked(ctx, shade, 1.5, () => ctx.arc(sx + dx, B - 34, 5, 0, Math.PI * 2));
      }
      inked(ctx, shade, 2, () => {
        ctx.moveTo(sx - 34, B - 44);
        ctx.lineTo(sx, B - 84);
        ctx.lineTo(sx + 34, B - 44);
        ctx.closePath();
      });
      inked(ctx, fill, 2, () => {
        ctx.moveTo(sx - 22, B - 76);
        ctx.lineTo(sx, B - 100);
        ctx.lineTo(sx + 22, B - 76);
        ctx.lineTo(sx + 14, B - 76);
        ctx.lineTo(sx, B - 90);
        ctx.lineTo(sx - 14, B - 76);
        ctx.closePath();
      });
      // Dragon-head finials crossing at the gable peak.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx, B - 98);
        ctx.quadraticCurveTo(sx + dir * 8, B - 106, sx + dir * 13, B - 100);
        ctx.stroke();
      }
      return;
    }
    case 'egyptian': {
      for (const dir of [-1, 1]) {
        inked(ctx, fill, 2, () => {
          ctx.moveTo(sx + dir * 34, B);
          ctx.lineTo(sx + dir * 28, B - 76);
          ctx.lineTo(sx + dir * 10, B - 76);
          ctx.lineTo(sx + dir * 8, B);
          ctx.closePath();
        });
        ctx.strokeStyle = shade;
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 5; r++) {
          const y = B - 14 - r * 12;
          ctx.beginPath();
          ctx.moveTo(sx + dir * (13 + r * 0.8), y);
          ctx.lineTo(sx + dir * (27 - r * 0.6), y);
          ctx.stroke();
        }
        inked(ctx, INK, 1.5, () => ctx.rect(sx + dir * 20 - 1, B - 100, 2, 24));
        inked(ctx, shade, 1, () => {
          ctx.moveTo(sx + dir * 21, B - 100);
          ctx.lineTo(sx + dir * 32, B - 96);
          ctx.lineTo(sx + dir * 21, B - 92);
          ctx.closePath();
        });
      }
      inked(ctx, fill, 2, () => ctx.rect(sx - 10, B - 62, 20, 10));
      inked(ctx, INK, 1.5, () => ctx.rect(sx - 7, B - 52, 14, 52));
      inked(ctx, shade, 1.5, () => ctx.arc(sx, B - 57, 4, 0, Math.PI * 2));
      inked(ctx, fill, 2, () => ctx.rect(sx - 38, B - 82, 76, 7));
      return;
    }
    case 'openworld': {
      inked(ctx, fill, 2, () => ctx.rect(sx - 28, B - 48, 56, 48));
      inked(ctx, fill, 2, () => ctx.rect(sx - 22, B - 82, 44, 34));
      inked(ctx, fill, 2, () => ctx.rect(sx - 14, B - 100, 28, 18));
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, B - 100);
      ctx.lineTo(sx, B - 112);
      ctx.stroke();
      const lit = side === 'player' ? '#8fb0d8' : '#f0a08a';
      // Window grids per setback: [half-width, top y, bottom y, columns].
      const bands: readonly [number, number, number, number][] = [
        [28, B - 44, B - 18, 5],
        [22, B - 78, B - 52, 4],
        [14, B - 96, B - 86, 3],
      ];
      for (const [half, top, bottom, cols] of bands) {
        const rows = Math.max(1, Math.floor((bottom - top) / 11) + 1);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const lx = sx - half + 5 + c * ((half * 2 - 10) / cols);
            ctx.fillStyle = hash(Math.floor(sx) + r * 13 + c * 5 + top) > 0.3 ? lit : shade;
            ctx.fillRect(lx, top + r * 11, 4, 6);
          }
        }
      }
      inked(ctx, INK, 1.5, () => ctx.rect(sx - 5, B - 14, 10, 14));
      return;
    }
  }
}
