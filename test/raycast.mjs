import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const url = `${pathToFileURL(path.join(root, 'index.html')).href}?quality=low`;
const executablePath =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-first-run', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, reducedMotion: 'reduce' });
page.setDefaultTimeout(25000);
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.classList.contains('is-ready'), null, { timeout: 30000 });
await page.waitForTimeout(600);

let hit = null;
outer: for (let y = 280; y <= 520; y += 20) {
  for (let x = 430; x <= 760; x += 20) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(25);
    const tip = await page.evaluate(() => {
      const el = document.getElementById('hoverTip');
      if (!el.classList.contains('is-visible')) return null;
      return el.textContent.replace(/\s+/g, ' ').trim();
    });
    if (tip) {
      hit = { x, y, tip };
      break outer;
    }
  }
}
console.log('HOVER_HIT', JSON.stringify(hit));
if (hit) {
  await page.mouse.click(hit.x, hit.y);
  await page.waitForTimeout(450);
  console.log('CLICK_RESULT', JSON.stringify(await page.evaluate(() => ({
    exploded: document.getElementById('explodedCount').textContent,
    selected: document.querySelector('.part-item.is-active')?.dataset.partId || null,
    detailOpen: !document.getElementById('detailView').hidden,
    hoverHidden: !document.getElementById('hoverTip').classList.contains('is-visible'),
  }))));
}

// Drag should not open a new selection.
await page.mouse.move(600, 400);
await page.mouse.down();
await page.mouse.move(700, 430, { steps: 5 });
await page.mouse.up();
await page.waitForTimeout(250);
console.log('AFTER_DRAG', JSON.stringify(await page.evaluate(() => ({
  exploded: document.getElementById('explodedCount').textContent,
  selected: document.querySelector('.part-item.is-active')?.dataset.partId || null,
}))));

// Keyboard reset.
await page.keyboard.press('r');
await page.waitForTimeout(1300);
console.log('AFTER_RESET', JSON.stringify(await page.evaluate(() => ({
  exploded: document.getElementById('explodedCount').textContent,
  detailHidden: document.getElementById('detailView').hidden,
}))));

console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();
console.log('DONE');
