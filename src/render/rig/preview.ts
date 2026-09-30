/**
 * Standalone preview page for the rig prototype (rig.html). Not part of the game bundle.
 */

import { drawBackdropScene } from '../backdrops';
import type { BackdropId } from '../backdrops';
import type { AnimName, Recipe } from './rig';
import { ANIM_SECONDS, animate, drawRig } from './rig';
import { RECIPES } from './recipes';

const ANIMS: readonly AnimName[] = ['idle', 'walk', 'attack', 'hit', 'death'];
const TIER_SCALE = { chaff: 0.55, demigod: 0.7, god: 0.85, titan: 1 } as const;
const SCENES: readonly BackdropId[] = ['greek', 'norse', 'egyptian', 'openworld'];

let anim: AnimName = 'walk';
let scene: BackdropId = 'greek';

const bar = document.getElementById('bar') as HTMLElement;
const cardsHost = document.getElementById('cards') as HTMLElement;
const stageHost = document.getElementById('stage') as HTMLElement;

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
    const length = ANIM_SECONDS[anim] + 0.7;
    return seconds % length;
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
  recipe: Recipe;
  big: CanvasRenderingContext2D;
  portrait: CanvasRenderingContext2D;
}

const cards: Card[] = RECIPES.map((recipe) => {
  const node = document.createElement('div');
  node.className = 'card';
  node.innerHTML = `<h2>${recipe.name}</h2><div class="meta">${recipe.tier}</div>`;
  const big = document.createElement('canvas');
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Portrait crop';
  const portrait = document.createElement('canvas');
  node.append(big, label, portrait);
  cardsHost.append(node);
  return { recipe, big: hiDpi(big, 212, 250), portrait: hiDpi(portrait, 212, 212) };
});

const stageCanvas = document.createElement('canvas');
const stageCtx = hiDpi(stageCanvas, 960, 540);
stageHost.append(stageCanvas);

function draw(seconds: number): void {
  const t = animTime(seconds);
  for (const { recipe, big, portrait } of cards) {
    const state = animate(recipe, anim, t);

    big.clearRect(0, 0, 212, 250);
    big.save();
    big.translate(106, 236);
    big.scale(2.25, 2.25);
    drawRig(big, recipe, state, seconds);
    big.restore();

    portrait.clearRect(0, 0, 212, 212);
    portrait.save();
    portrait.translate(106 - 14, 318);
    portrait.scale(3.1, 3.1);
    drawRig(portrait, recipe, animate(recipe, 'idle', seconds), seconds);
    portrait.restore();
  }

  stageCtx.clearRect(0, 0, 960, 540);
  drawBackdropScene(stageCtx, scene, seconds);
  const xs = [150, 330, 500, 680, 840];
  RECIPES.forEach((recipe, i) => {
    const k = 0.98 * TIER_SCALE[recipe.tier];
    const state = animate(recipe, anim, t + i * 0.23);
    stageCtx.save();
    stageCtx.translate(xs[i] as number, 404);
    // Units face right on the left half and left on the right half, like the two sides of a battle.
    if (i >= 3) stageCtx.scale(-1, 1);
    stageCtx.scale(k, k);
    drawRig(stageCtx, recipe, state, seconds);
    stageCtx.restore();
  });

  requestAnimationFrame((now) => draw(now / 1000));
}

requestAnimationFrame((now) => draw(now / 1000));
