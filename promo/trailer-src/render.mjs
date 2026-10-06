import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
// node render.mjs <h|v> [times comma list for stills]
const [ar, stills] = process.argv.slice(2);
const S = process.cwd(), SITE = '/Users/dhuovinen/Projects/games-strategy-001';
const W = ar === 'v' ? 1080 : 1920, H = ar === 'v' ? 1920 : 1080;
const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await ctx.route('http://trailer.test/**', (r) => {
  const rel = decodeURIComponent(new URL(r.request().url()).pathname.slice(1));
  const f = rel.startsWith('site/') ? path.join(SITE, rel) : path.join(S, rel);
  if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
  r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: types[path.extname(f)] || 'application/octet-stream' });
});
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(`http://trailer.test/trailer.html?ar=${ar}`);
await p.evaluate(() => window.ready);
const root = p.locator('#root');
if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await p.evaluate((t) => window.renderFrame(t), t);
    await root.screenshot({ path: `still-${ar}-${t}.jpg`, type: 'jpeg', quality: 85 });
  }
} else {
  const out = `frames-${ar}`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  for (let f = 0; f < 28 * 30; f++) {
    await p.evaluate((t) => window.renderFrame(t), f / 30);
    await root.screenshot({ path: `${out}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 94 });
  }
  console.log('frames', fs.readdirSync(out).length);
}
await b.close();
