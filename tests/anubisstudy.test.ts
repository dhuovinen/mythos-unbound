import { describe, expect, it } from 'vitest';
import { ANUBIS_STUDIES, anubisStudyFrame, sampleAnubisStudy } from '../src/render/rig/anubisstudies';
import { FIGURE_BY_ID } from '../src/render/rig/figures';
import { ANIM_SECONDS } from '../src/render/rig/figure';

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


describe('Anubis evaluation rigs', () => {
  it('leaves the battle figure intact and keeps three distinct silhouettes and motion styles', () => {
    expect(FIGURE_BY_ID.get('anubis')?.id).toBe('anubis');
    for (const study of ANUBIS_STUDIES) expect(FIGURE_BY_ID.has(study.figure.id)).toBe(false);
    expect(new Set(ANUBIS_STUDIES.map((s) => s.recipe.attack)).size).toBe(3);
    expect(new Set(ANUBIS_STUDIES.map((s) => JSON.stringify(sampleAnubisStudy(s.recipe, s.direction, 'walk', .2).pose))).size).toBe(3);
  });
  it('keeps all drawn poses inside the detail stage in both directions', () => {
    for (const study of ANUBIS_STUDIES) for (const anim of ['idle', 'walk', 'attack', 'hit', 'death'] as const) {
      for (const mirrored of [false, true]) for (let i = 0; i <= 30; i++) {
        const t = i / 30, { ctx, bounds } = pathBounds(), frame = anubisStudyFrame(anim, mirrored);
        ctx.translate(frame.x, frame.y); ctx.scale(mirrored ? -frame.scale : frame.scale, frame.scale);
        study.figure.draw(ctx, anim, t, t);
        const label = study.direction + ' ' + anim + ' t=' + t + ' mirror=' + mirrored;
        expect(bounds.left, label).toBeGreaterThanOrEqual(4);
        expect(bounds.right, label).toBeLessThanOrEqual(436);
        expect(bounds.top, label).toBeGreaterThanOrEqual(4);
        expect(bounds.bottom, label).toBeLessThanOrEqual(326);
      }
    }
  });
  it('holds each final death pose and produces finite joints throughout every animation', () => {
    for (const study of ANUBIS_STUDIES) {
      for (const anim of ['idle', 'walk', 'attack', 'hit', 'death'] as const) {
        for (const t of [0, .2, .55, 1, 10]) expect(JSON.stringify(sampleAnubisStudy(study.recipe, study.direction, anim, t))).not.toContain('null');
      }
      expect(sampleAnubisStudy(study.recipe, study.direction, 'death', 10)).toEqual(sampleAnubisStudy(study.recipe, study.direction, 'death', ANIM_SECONDS.death));
    }
  });
});
