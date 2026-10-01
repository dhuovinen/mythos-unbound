/**
 * Portraits for the team picker.
 *
 * A deity with a rig is drawn from it — the same figure that fights, cropped to head and chest.
 * Everyone else gets a heraldic crest: a monogram inside a frame that grows more elaborate with
 * tier, in the realm's accent colour, so the picker already has a consistent look while the rest of
 * the roster waits for a figure.
 *
 * Portraits are painted once and cached; the picker redraws them as cheap image blits.
 */

import { RECIPE_BY_ID } from '../render/rig/recipes';
import { animate, drawRig } from '../render/rig/rig';
import type { Deity, Pantheon, Tier } from '../sim/types';

export const REALM_ACCENT: Readonly<Record<Pantheon | 'openworld', string>> = {
  greek: '#8fb4e8',
  norse: '#7fd6d0',
  egyptian: '#e19a7e',
  openworld: '#c88be0',
};

const BG: Readonly<Record<Pantheon, readonly [string, string]>> = {
  greek: ['#26304d', '#141a2c'],
  norse: ['#1d3a46', '#0b1822'],
  egyptian: ['#5a3342', '#2a1520'],
};

const INK = '#1A1A1E';
const BONE = '#EDE6D6';

const cache = new Map<string, HTMLCanvasElement>();

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(2, 2);
  return { canvas, ctx };
}

function backdrop(ctx: CanvasRenderingContext2D, pantheon: Pantheon, w: number, h: number): void {
  const [top, bottom] = BG[pantheon];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** The frame ornament that tells you the tier at a glance. */
function crest(ctx: CanvasRenderingContext2D, tier: Tier, cx: number, cy: number, r: number, accent: string): void {
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (tier === 'chaff') return;

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.stroke();
  if (tier === 'demigod') return;

  // Gods are crowned with rays; titans with longer, sharper ones.
  const rays = tier === 'god' ? 12 : 16;
  const outer = r + (tier === 'god' ? 6 : 10);
  ctx.fillStyle = accent;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const a1 = a - 0.09;
    const a2 = a + 0.09;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    ctx.closePath();
    ctx.fill();
  }
}

function paintCrest(deity: Deity, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(w, h);
  backdrop(ctx, deity.pantheon, w, h);
  const accent = REALM_ACCENT[deity.pantheon];
  const r = Math.min(w, h) * 0.3;
  crest(ctx, deity.tier, w / 2, h / 2, r, accent);

  ctx.font = `800 ${Math.round(r * 1.25)}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.strokeText(deity.name.charAt(0).toUpperCase(), w / 2, h / 2 + 1);
  ctx.fillStyle = BONE;
  ctx.fillText(deity.name.charAt(0).toUpperCase(), w / 2, h / 2 + 1);
  return canvas;
}

function paintRig(deity: Deity, w: number, h: number): HTMLCanvasElement | null {
  const recipe = RECIPE_BY_ID.get(deity.id);
  if (recipe === undefined) return null;
  const { canvas, ctx } = makeCanvas(w, h);
  backdrop(ctx, deity.pantheon, w, h);
  // Head and chest fill the frame; the figure is 100 rig units tall with the head near the top.
  const scale = (h / 62) * (recipe.tier === 'titan' ? 0.92 : 1);
  ctx.save();
  ctx.translate(w / 2 - 6 * scale * 0.4, h * 0.97 + 38 * scale * 0.5);
  ctx.scale(scale, scale);
  drawRig(ctx, recipe, animate(recipe, 'idle', 0.4), 0.4);
  ctx.restore();
  // A soft fade at the bottom so the crop does not end on a hard cut through the body.
  const fade = ctx.createLinearGradient(0, h * 0.7, 0, h);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(10,8,12,0.75)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  return canvas;
}

/** A cached portrait canvas for the deity. Clone it with `cloneCanvas` before inserting twice. */
export function portraitFor(deity: Deity, w: number, h: number): HTMLCanvasElement {
  const key = `${deity.id}:${w}x${h}`;
  let canvas = cache.get(key);
  if (canvas === undefined) {
    canvas = paintRig(deity, w, h) ?? paintCrest(deity, w, h);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    cache.set(key, canvas);
  }
  return cloneCanvas(canvas);
}

/** Copies a painted canvas so the same portrait can sit in the tree, the tray and the dossier. */
export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  copy.style.width = source.style.width;
  copy.style.height = source.style.height;
  copy.getContext('2d')?.drawImage(source, 0, 0);
  return copy;
}
