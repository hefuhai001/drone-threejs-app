import { chromium } from 'playwright-core';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const url = 'https://drone-threejs-app.pages.dev/?quality=low';
const executablePath =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-first-run', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 820 }, reducedMotion: 'reduce' });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.classList.contains('is-ready'), null, { timeout: 30000 });
await page.waitForTimeout(700);
await page.evaluate(() => document.querySelector('.part-item[data-part-id="gimbal"]').click());
await page.waitForTimeout(900);
const result = await page.evaluate(() => ({
  title: document.title,
  ready: document.body.classList.contains('is-ready'),
  selected: document.querySelector('.part-item.is-active')?.dataset.partId || null,
  detailTitle: document.querySelector('.detail-title h2')?.textContent || null,
  exploded: document.getElementById('explodedCount').textContent,
  webgl: Boolean(document.querySelector('#scene').getContext('webgl2')),
}));
await page.screenshot({ path: path.join(root, 'test', 'shots', 'cloud-live.png') });
console.log('LIVE_RESULT', JSON.stringify(result, null, 2));
console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();
