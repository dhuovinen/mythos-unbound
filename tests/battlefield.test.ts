import { afterEach, describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, ENEMY_BASE_X, PLAYER_BASE_X } from '../src/sim/constants';
import { unitBodyHeight, worldToScreen } from '../src/render/draw';
import { FIGURE_BY_ID, RIG_ROSTER } from '../src/render/rig/figures';
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

const original = { unitGraphics: getSettings().unitGraphics, unitScale: getSettings().unitScale };
afterEach(() => { setSetting('unitGraphics', original.unitGraphics); setSetting('unitScale', original.unitScale); });

describe('battlefield framing', () => {
  it.each([0.8, 1.45, 2.2])('keeps every rig pose inside both ends of the field at scale %s', (size) => {
    setSetting('unitGraphics', 'rig'); setSetting('unitScale', size);
    for (const deity of RIG_ROSTER) {
      const figure = FIGURE_BY_ID.get(deity.id)!;
      for (const x of [PLAYER_BASE_X, ENEMY_BASE_X]) for (const facing of [-1, 1]) {
        for (const anim of ['idle', 'walk', 'attack', 'hit', 'death'] as const) for (const t of [0, 0.28, 0.4, 0.7, 1]) {
          const { ctx, bounds } = pathBounds();
          ctx.translate(worldToScreen(x), 445);
          const scale = unitBodyHeight(deity) / 100;
          ctx.scale(facing * scale, scale); figure.draw(ctx, anim, t, 1.23);
          const label = `${deity.id} ${anim} t=${t} x=${x} facing=${facing}`;
          expect(bounds.left, label).toBeGreaterThanOrEqual(2);
          expect(bounds.right, label).toBeLessThanOrEqual(CANVAS_WIDTH - 2);
          expect(bounds.top, label).toBeGreaterThanOrEqual(2);
          expect(bounds.bottom, label).toBeLessThanOrEqual(CANVAS_HEIGHT - 2);
        }
      }
    }
  });
});
