import { afterEach, describe, expect, it } from 'vitest';
import { EGYPTIAN_DEITIES } from '../src/data/egyptian';
import { EGYPTIAN_V2_DESIGNS, EGYPTIAN_V2_FIGURES, EGYPTIAN_V2_RECIPES, egyptianV2Pose } from '../src/render/rig/egyptianv2';
import { ANIM_SECONDS } from '../src/render/rig/figure';
import type { AnimName, Figure } from '../src/render/rig/figure';
import { FIGURE_BY_ID, RIG_ROSTER, V1_FIGURE_BY_ID, figureFor } from '../src/render/rig/figures';
import { buildSkel } from '../src/render/rig/rig';
import { getSettings, setSetting } from '../src/ui/settings';

/** Conservative bounds of the actual drawn paths, including transforms and curve control points. */
function pathBounds() {
  type Matrix = [number, number, number, number, number, number];
  let m: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];
  const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  const point = (x: number, y: number) => {
    const px = m[0] * x + m[2] * y + m[4], py = m[1] * x + m[3] * y + m[5];
    bounds.left = Math.min(bounds.left, px); bounds.right = Math.max(bounds.right, px);
    bounds.top = Math.min(bounds.top, py); bounds.bottom = Math.max(bounds.bottom, py);
  };
  const rect = (x: number, y: number, w: number, h: number) => {
    point(x, y); point(x + w, y); point(x, y + h); point(x + w, y + h);
  };
  const ellipse = (x: number, y: number, rx: number, ry: number, rotation: number) => {
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16;
      point(x + rx * Math.cos(a) * Math.cos(rotation) - ry * Math.sin(a) * Math.sin(rotation),
        y + rx * Math.cos(a) * Math.sin(rotation) + ry * Math.sin(a) * Math.cos(rotation));
    }
  };
  const ctx = {
    save() { stack.push([...m]); }, restore() { m = stack.pop()!; },
    translate(x: number, y: number) { m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
    scale(x: number, y: number) { m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; },
    rotate(a: number) {
      const [v0, v1, v2, v3] = m, c = Math.cos(a), s = Math.sin(a);
      m[0] = v0 * c + v2 * s; m[1] = v1 * c + v3 * s;
      m[2] = v2 * c - v0 * s; m[3] = v3 * c - v1 * s;
    },
    moveTo: point, lineTo: point, rect, fillRect: rect,
    quadraticCurveTo(cx: number, cy: number, x: number, y: number) { point(cx, cy); point(x, y); },
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) { point(x1, y1); point(x2, y2); point(x, y); },
    arc(x: number, y: number, r: number) { ellipse(x, y, r, r, 0); }, ellipse,
    beginPath() {}, closePath() {}, fill() {}, stroke() {},
  } as unknown as CanvasRenderingContext2D;
  return { ctx, bounds };
}

/** Record actual draw geometry rather than accepting an animation name as proof of movement. */
function geometry(figure: Figure, anim: AnimName, t: number, time = t) {
  const commands: (string | number | boolean)[][] = [];
  let saves = 0;
  const ctx = new Proxy({ globalAlpha: 1 }, {
    get(target, key) {
      if (key in target) return target[key as keyof typeof target];
      return (...args: (number | boolean)[]) => {
        if (key === 'save') saves++;
        if (key === 'restore') saves--;
        expect(saves, `${figure.id}: balanced context`).toBeGreaterThanOrEqual(0);
        for (const n of args) if (typeof n === 'number') expect(Number.isFinite(n), `${figure.id}: ${String(key)}`).toBe(true);
        commands.push([String(key), ...args]);
      };
    },
  }) as unknown as CanvasRenderingContext2D;
  figure.draw(ctx, anim, t, time);
  expect(saves, figure.id).toBe(0);
  expect(commands.length, figure.id).toBeGreaterThan(40);
  return commands;
}
const original = getSettings().egyptianRigVersion;
afterEach(() => setSetting('egyptianRigVersion', original));

describe('Egyptian v2 delivery', () => {
  it('replaces every Egyptian figure, preserving roster identity and the Greek/Norse figures', () => {
    expect(EGYPTIAN_V2_FIGURES.map(f => f.id)).toEqual(EGYPTIAN_DEITIES.map(d => d.id));
    expect(Object.keys(EGYPTIAN_V2_DESIGNS)).toHaveLength(22);
    expect(new Set(Object.values(EGYPTIAN_V2_DESIGNS).map(d => d.title)).size).toBe(22);
    for (const d of RIG_ROSTER) {
      const v1 = V1_FIGURE_BY_ID.get(d.id)!, v2 = FIGURE_BY_ID.get(d.id)!;
      expect(v2.name).toBe(d.name); expect(v2.tier).toBe(d.tier); expect(v2.body).toBe(v1.body);
      if (d.pantheon === 'egyptian') expect(v2).not.toBe(v1);
      else expect(v2).toBe(v1);
    }
    expect(EGYPTIAN_V2_DESIGNS.anubis.title).toBe('Guide of the Duat');
  });
  it('selects preserved v1 and new v2 rigs for real battle rendering', () => {
    for (const version of ['v1', 'v2'] as const) {
      setSetting('egyptianRigVersion', version);
      for (const d of EGYPTIAN_DEITIES) expect(figureFor(d, 'rig')).toBe((version === 'v1' ? V1_FIGURE_BY_ID : FIGURE_BY_ID).get(d.id));
    }
  });
  it.each(EGYPTIAN_V2_FIGURES.map(f => [f.id, f] as const))('%s changes its drawn geometry in all five animation states', (_id, figure) => {
    for (const anim of ['idle', 'walk', 'attack', 'hit', 'death'] as const) {
      const end = anim === 'idle' || anim === 'walk' ? .61 : ANIM_SECONDS[anim] * .55;
      expect(geometry(figure, anim, end), `${figure.id} ${anim}`).not.toEqual(geometry(figure, anim, 0));
    }
    // A collapsed body must not continue waving wings, veils or coils as the wall clock runs.
    expect(geometry(figure, 'death', 10, 40)).toEqual(geometry(figure, 'death', ANIM_SECONDS.death, 1));
  });
  it('keeps every v2 pose inside the detail preview in both directions', () => {
    for(const figure of EGYPTIAN_V2_FIGURES) for(const facing of [-1,1]) {
      for(const anim of ['idle','walk','attack','hit','death'] as const) for(let frame=0;frame<=30;frame++) {
        const {ctx,bounds}=pathBounds(), anchor=figure.body==='serpent'?400:figure.body==='beast'?280:320;
        const t=frame/30*(anim==='idle'||anim==='walk'?3:ANIM_SECONDS[anim]);
        const fall=anim==='death'?frame/30:0, scale=2.05-fall*.4;
        ctx.translate(facing===1?anchor:640-anchor,390-fall*40);ctx.scale(facing*scale,scale);
        figure.draw(ctx,anim,t,1.2+t);
        const label=`${figure.id} ${anim} ${frame} ${facing}`;
        expect(bounds.left,label).toBeGreaterThanOrEqual(2);expect(bounds.right,label).toBeLessThanOrEqual(638);
        expect(bounds.top,label).toBeGreaterThanOrEqual(2);expect(bounds.bottom,label).toBeLessThanOrEqual(478);
      }
    }
  });
  it('keeps the bottom row of the animated Egyptian lineup visible through every fall', () => {
    for(const [i,figure] of EGYPTIAN_V2_FIGURES.entries()) for(const facing of [-1,1]) {
      const cell=920/6, x=20+cell*((i%6)+.5)+(figure.body==='serpent'?cell*.17*facing:0);
      const scale={chaff:.57,demigod:.7,god:.8,titan:.85}[figure.tier]*.83;
      for(let frame=0;frame<=30;frame++) {
        const {ctx,bounds}=pathBounds(),fall=frame/30,y=160+Math.floor(i/6)*(355/3)-fall*45;
        ctx.translate(x,y);ctx.scale(facing*scale,scale);figure.draw(ctx,'death',fall*ANIM_SECONDS.death,fall);
        expect(bounds.left,figure.id).toBeGreaterThanOrEqual(2);expect(bounds.right,figure.id).toBeLessThanOrEqual(958);
        expect(bounds.top,figure.id).toBeGreaterThanOrEqual(2);expect(bounds.bottom,figure.id).toBeLessThanOrEqual(538);
      }
    }
  });
  it('moves biped bodies and limbs, including the floating Guide, rather than only decorative effects', () => {
    for (const recipe of EGYPTIAN_V2_RECIPES) {
      const design = EGYPTIAN_V2_DESIGNS[recipe.id];
      for (const anim of ['idle', 'walk'] as const) {
        const a = egyptianV2Pose(recipe, design, anim, 0), b = egyptianV2Pose(recipe, design, anim, .6);
        const skA = buildSkel(recipe, a.pose, 0), skB = buildSkel(recipe, b.pose, .6);
        expect(Math.hypot(skA.head.x-skB.head.x, skA.head.y-skB.head.y), `${recipe.id} ${anim} head`).toBeGreaterThan(.5);
        expect(Math.hypot(skA.armF.hand.x-skB.armF.hand.x, skA.armF.hand.y-skB.armF.hand.y), `${recipe.id} ${anim} hand`).toBeGreaterThan(.5);
      }
    }
  });
});
