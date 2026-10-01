/**
 * Standalone preview page for the rig (rig.html). Not part of the game bundle.
 *
 * Shows every animated figure large with a portrait crop, the same figures at game scale on a real
 * backdrop, and a catalogue of the shared parts so the library can be reviewed as a contact sheet.
 */

import { drawBackdropScene } from '../backdrops';
import type { BackdropId } from '../backdrops';
import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS } from './figure';
import { FIGURES } from './figures';
import type { BeardKind, BehindKind, BodyKind, GearKind, HairKind, HeadKind, OffhandKind, Tones, WeaponKind } from './parts';
import { BEARDS, BEHIND, BODY, DEFAULT_TONES, GEAR, HAIR, HEADS, OFFHAND, WEAPONS } from './parts';
import { animate, drawRig } from './rig';
import type { Recipe } from './rig';
import { RECIPES } from './recipes';

const ANIMS: readonly AnimName[] = ['idle', 'walk', 'attack', 'hit', 'death'];
const TIER_SCALE = { chaff: 0.55, demigod: 0.7, god: 0.85, titan: 1 } as const;
const SCENES: readonly BackdropId[] = ['greek', 'norse', 'egyptian', 'openworld'];

let anim: AnimName = 'walk';
let scene: BackdropId = 'greek';

const bar = document.getElementById('bar') as HTMLElement;
const cardsHost = document.getElementById('cards') as HTMLElement;
const stageHost = document.getElementById('stage') as HTMLElement;
const partsHost = document.getElementById('parts') as HTMLElement;

function makeButtons<T extends string>(values: readonly T[], current: () => T, set: (v: T) => void): void {
  const nodes = values.map((v) => {
    const b = document.createElement('button');
    b.textContent = v;
    b.addEventListener('click', () => {
      set(v);
      nodes.forEach((n) => n.classList.toggle('on', n.textContent === current()));
    });
    bar.append(b);
    return b;
  });
  nodes.forEach((n) => n.classList.toggle('on', n.textContent === current()));
  const gap = document.createElement('span');
  gap.style.width = '14px';
  bar.append(gap);
}

makeButtons(ANIMS, () => anim, (v) => (anim = v));
makeButtons(SCENES, () => scene, (v) => (scene = v));

/** One-shots replay on a loop so they can be judged; looping animations just run. */
function animTime(seconds: number): number {
  if (anim === 'attack' || anim === 'hit' || anim === 'death') {
    return seconds % (ANIM_SECONDS[anim] + 0.7);
  }
  return seconds;
}

function hiDpi(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(dpr, dpr);
  return ctx;
}

interface Card {
  figure: Figure;
  big: CanvasRenderingContext2D;
  portrait: CanvasRenderingContext2D;
}

const cards: Card[] = FIGURES.map((figure) => {
  const node = document.createElement('div');
  node.className = 'card';
  node.innerHTML = `<h2>${figure.name}</h2><div class="meta">${figure.tier} · ${figure.body}</div>`;
  const big = document.createElement('canvas');
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Portrait crop';
  const portrait = document.createElement('canvas');
  node.append(big, label, portrait);
  cardsHost.append(node);
  return { figure, big: hiDpi(big, 212, 250), portrait: hiDpi(portrait, 212, 212) };
});

const stageCanvas = document.createElement('canvas');
const stageCtx = hiDpi(stageCanvas, 960, 540);
stageHost.append(stageCanvas);

// ---- parts catalogue ------------------------------------------------------------------------------

/** A plain mannequin that wears whichever single part is under review. */
function mannequin(wear: Partial<Pick<Recipe, 'drawBody' | 'drawOffhand' | 'drawBehind' | 'drawWeapon'>>): (ctx: CanvasRenderingContext2D) => void {
  const base = RECIPES[2] as Recipe;
  const recipe: Recipe = {
    ...base,
    skin: '#6a6455',
    drawBehind: wear.drawBehind,
    drawBody: wear.drawBody ?? ((): void => undefined),
    drawOffhand: wear.drawOffhand,
    drawHead: (ctx, s) => {
      ctx.save();
      ctx.translate(s.head.x, s.head.y);
      HEADS.human(ctx, s.headR, DEFAULT_TONES);
      ctx.restore();
    },
    drawWeapon: wear.drawWeapon ?? ((): void => undefined),
  };
  return (ctx) => {
    ctx.translate(58, 148);
    ctx.scale(1.35, 1.35);
    drawRig(ctx, recipe, animate(recipe, 'idle', 0), 0);
  };
}

const tones: Tones = { ...DEFAULT_TONES };
const catalogue: { title: string; items: { label: string; draw: (ctx: CanvasRenderingContext2D) => void; w?: number; h?: number }[] }[] = [
  {
    title: 'Heads',
    items: (Object.keys(HEADS) as HeadKind[]).map((k) => ({
      label: k,
      w: 110,
      h: 96,
      draw: (ctx) => {
        ctx.translate(34, 56);
        ctx.scale(2.2, 2.2);
        HEADS[k](ctx, 10, tones);
      },
    })),
  },
  {
    title: 'Headgear (on a human head)',
    items: (Object.keys(GEAR) as GearKind[]).map((k) => ({
      label: k,
      w: 110,
      h: 110,
      draw: (ctx) => {
        ctx.translate(55, 70);
        ctx.scale(2.2, 2.2);
        HEADS.human(ctx, 10, tones);
        GEAR[k](ctx, 10, tones);
      },
    })),
  },
  {
    title: 'Beards and hair',
    items: [
      ...(Object.keys(BEARDS) as BeardKind[]).map((k) => ({
        label: `beard: ${k}`,
        w: 110,
        h: 100,
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.translate(50, 40);
          ctx.scale(2.2, 2.2);
          HEADS.human(ctx, 10, tones);
          BEARDS[k](ctx, 10, tones.hair);
        },
      })),
      ...(Object.keys(HAIR) as HairKind[]).map((k) => ({
        label: `hair: ${k}`,
        w: 110,
        h: 100,
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.translate(55, 44);
          ctx.scale(2.2, 2.2);
          HAIR[k].back(ctx, 10, '#2b2a32');
          HEADS.human(ctx, 10, tones);
          HAIR[k].front(ctx, 10, '#2b2a32');
        },
      })),
    ],
  },
  {
    title: 'Weapons',
    items: (Object.keys(WEAPONS) as WeaponKind[]).map((k) => ({
      label: k,
      w: 96,
      h: 150,
      draw: (ctx) => {
        ctx.translate(48, 112);
        ctx.scale(1.3, 1.3);
        WEAPONS[k](ctx, tones);
      },
    })),
  },
  {
    title: 'Shields and offhand',
    items: (Object.keys(OFFHAND) as OffhandKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawOffhand: (ctx, sk) => OFFHAND[k](ctx, sk, tones) }),
    })),
  },
  {
    title: 'Clothing',
    items: (Object.keys(BODY) as BodyKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawBody: (ctx, sk) => BODY[k](ctx, sk, tones) }),
    })),
  },
  {
    title: 'Behind the body',
    items: (Object.keys(BEHIND) as BehindKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawBehind: (ctx, sk) => BEHIND[k](ctx, sk, tones) }),
    })),
  },
];

for (const group of catalogue) {
  const section = document.createElement('div');
  section.className = 'group';
  section.innerHTML = `<h3>${group.title}</h3>`;
  const row = document.createElement('div');
  row.className = 'row';
  for (const item of group.items) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const canvas = document.createElement('canvas');
    const ctx = hiDpi(canvas, item.w ?? 110, item.h ?? 110);
    ctx.save();
    item.draw(ctx);
    ctx.restore();
    const label = document.createElement('div');
    label.textContent = item.label;
    cell.append(canvas, label);
    row.append(cell);
  }
  section.append(row);
  partsHost.append(section);
}

// ---- animation loop -------------------------------------------------------------------------------

function draw(seconds: number): void {
  const t = animTime(seconds);
  for (const { figure, big, portrait } of cards) {
    big.clearRect(0, 0, 212, 250);
    big.save();
    big.translate(figure.body === 'serpent' ? 150 : figure.body === 'beast' ? 78 : 106, 236);
    const scale = figure.body === 'serpent' ? 1.25 : figure.body === 'beast' ? 1.45 : 2.25;
    big.scale(scale, scale);
    figure.draw(big, anim, t, seconds);
    big.restore();

    portrait.clearRect(0, 0, 212, 212);
    const v = figure.view;
    const k = Math.min(212 / v.w, 212 / v.h);
    portrait.save();
    portrait.translate(106 - (v.x + v.w / 2) * k, 106 - (v.y + v.h / 2) * k);
    portrait.scale(k, k);
    figure.draw(portrait, 'idle', seconds, seconds);
    portrait.restore();
  }

  stageCtx.clearRect(0, 0, 960, 540);
  drawBackdropScene(stageCtx, scene, seconds);
  const n = FIGURES.length;
  FIGURES.forEach((figure, i) => {
    const k = 0.98 * TIER_SCALE[figure.tier];
    const x = 70 + (i * (900 - 70)) / Math.max(1, n - 1);
    stageCtx.save();
    stageCtx.translate(x, 404);
    if (i >= n / 2) stageCtx.scale(-1, 1);
    stageCtx.scale(k, k);
    figure.draw(stageCtx, anim, t + i * 0.23, seconds);
    stageCtx.restore();
  });

  requestAnimationFrame((now) => draw(now / 1000));
}

requestAnimationFrame((now) => draw(now / 1000));
