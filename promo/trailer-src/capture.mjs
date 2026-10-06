import { chromium } from 'playwright';
import fs from 'node:fs';
// usage: node capture.mjs <name> <warmupSeconds> <captureSeconds> '<deckJSON>' '<oppJSON>' [summonEvery] [w h]
const [name, warm, cap, deck, opp, every = '2.2', W = '1600', H = '900'] = process.argv.slice(2);
const FPS = 30, DT = 1000 / FPS;
const out = `clips/${name}`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
await ctx.addInitScript(({ deck, opp }) => {
  let t = 0; const q = [];
  performance.now = () => t;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__step = (ms, n = 1) => { for (let i = 0; i < n; i++) { t += ms; for (const cb of q.splice(0)) cb(t); } };
  const s = { unitGraphics: 'sprites', backdrop: 'auto', unitScale: 2.0, deck: deck ? JSON.parse(deck) : null, opponentDeck: opp ? JSON.parse(opp) : null };
  localStorage.setItem('mythos-unbound.settings.v1', JSON.stringify(s));
}, { deck: deck === 'null' ? null : deck, opp: opp === 'null' ? null : opp });
const p = await ctx.newPage();
await p.goto('http://localhost:3033/');
await p.waitForTimeout(1500); // let images load (real time)
// close the picker if it opened
const back = p.getByRole('button', { name: 'Back to the battle' });
if (await back.isVisible().catch(() => false)) await back.click();
const close = p.getByRole('button', { name: 'Close', exact: true });
if (await close.isVisible().catch(() => false)) await close.click();
await p.evaluate(() => document.activeElement?.blur());
let key = 0, sinceSummon = 0;
const tick = async (frames) => {
  for (let i = 0; i < frames; i++) {
    sinceSummon += 1 / FPS;
    if (sinceSummon >= +every) { sinceSummon = 0; await p.keyboard.press(String(1 + (key++ % 3))); }
    await p.evaluate((dt) => window.__step(dt), DT);
  }
};
await tick(Math.round(+warm * FPS));
const canvas = await p.locator('canvas').first().boundingBox();
for (let f = 0; f < Math.round(+cap * FPS); f++) {
  await tick(1);
  await p.screenshot({ path: `${out}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92, clip: canvas });
}
console.log(name, 'canvas', canvas, 'frames', fs.readdirSync(out).length);
await b.close();
