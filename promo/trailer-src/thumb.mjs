import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const S = process.cwd(), SITE = '/Users/dhuovinen/Projects/games-strategy-001';
const types = { '.html': 'text/html', '.webp': 'image/webp' };
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.route('http://thumb.test/**', (r) => {
  const rel = decodeURIComponent(new URL(r.request().url()).pathname.slice(1));
  const f = rel.startsWith('site/') ? path.join(SITE, rel) : path.join(S, rel);
  r.fulfill({ status: fs.existsSync(f) ? 200 : 404, body: fs.existsSync(f) ? fs.readFileSync(f) : '', contentType: types[path.extname(f)] });
});
await p.goto('http://thumb.test/thumb.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const id of ['a', 'b']) await p.locator('#' + id).screenshot({ path: `thumb-${id}.png` });
await b.close();
