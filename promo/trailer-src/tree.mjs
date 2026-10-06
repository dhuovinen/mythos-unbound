import { chromium } from 'playwright';
import fs from 'node:fs';
const out = 'clips/tree'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:3033/');
await p.locator('h2', { hasText: 'Greek' }).first().click();
await p.waitForTimeout(1500);
const box = async (name) => { const l = p.locator('.df-card, [class*="card"]', { hasText: name }).first(); return l.boundingBox(); };
const names = ['Cronus', 'Zeus', 'Hera', 'Ares', 'Aphrodite'];
const pts = [];
for (const n of names) { const bb = await box(n); if (bb) pts.push([bb.x + bb.width / 2, bb.y + bb.height / 2]); }
console.log(pts);
let f = 0;
await p.mouse.move(pts[0][0], pts[0][1]);
for (let i = 0; i < pts.length - 1; i++) {
  const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
  for (let k = 0; k < 6; k++) { await p.screenshot({ path: `${out}/${String(f++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
  for (let k = 1; k <= 8; k++) { const u = k / 8, e = u * u * (3 - 2 * u); await p.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); await p.screenshot({ path: `${out}/${String(f++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
}
for (let k = 0; k < 10; k++) await p.screenshot({ path: `${out}/${String(f++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
console.log('frames', f);
await b.close();
