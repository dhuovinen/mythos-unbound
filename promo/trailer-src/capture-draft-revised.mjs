import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = path.resolve(process.argv[2] || '/tmp/mythos-trailer-revision/draft');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(process.env.GAME_URL || 'http://localhost:3033/');
  await page.locator('.df-realmcard').filter({ has: page.getByRole('heading', { name: 'Greek', exact: true }) }).click();
  await page.locator('.df-card[data-id="zeus"]').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  });
  await page.screenshot({ path: path.join(out, 'overview.png') });
  const boxes = {};
  for (const id of ['cronus', 'zeus', 'hera', 'ares', 'aphrodite']) {
    boxes[id] = await page.locator(`.df-card[data-id="${id}"]`).boundingBox();
  }
  console.log(JSON.stringify(boxes));
  if (process.argv.includes('--inspect')) process.exitCode = 0;
  else {
    // Record a real selection in the game; only the pointer visualization is added.
    await page.addStyleTag({ content: '* { transition: none !important; } #record-pointer { position:fixed; width:28px;height:28px;border:3px solid #ede6d6;border-radius:50%;background:rgba(143,180,232,.25);box-shadow:0 0 15px #000;pointer-events:none;z-index:9999;transform:translate(-50%,-50%); }' });
    await page.evaluate(() => { const p = document.createElement('div'); p.id = 'record-pointer'; document.body.append(p); });
    const z = boxes.zeus, c = boxes.cronus;
    const clip = {
      x: Math.max(0, Math.min(720, z.x + z.width / 2 - 600)),
      y: Math.max(0, Math.min(405, c.y - 35)),
      width: 1200, height: 675,
    };
    const target = [z.x + z.width / 2, z.y + z.height / 2];
    const start = [target[0] - 180, target[1] + 110];
    let selected = false;
    for (let f = 0; f < 90; f++) {
      const u = Math.min(1, Math.max(0, (f - 8) / 19));
      const e = u * u * (3 - 2 * u);
      const x = start[0] + (target[0] - start[0]) * e;
      const y = start[1] + (target[1] - start[1]) * e;
      await page.mouse.move(x, y);
      if (f === 32) {
        await page.mouse.click(...target);
        selected = await page.locator('.df-card[data-id="zeus"]').evaluate(el => el.classList.contains('picked'));
        if (!selected) throw new Error('Zeus selection did not register');
      }
      await page.evaluate(({ x, y, f }) => {
        const p = document.getElementById('record-pointer');
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        p.style.background = f >= 32 && f < 39 ? '#8fb4e8' : 'rgba(143,180,232,.25)';
      }, { x, y, f });
      await page.screenshot({ path: path.join(out, `${String(f).padStart(4, '0')}.jpg`), clip, type: 'jpeg', quality: 96 });
    }
    console.log(`Recorded 90 frames; Zeus selected: ${selected}`);
  }
} finally { await browser.close(); }
