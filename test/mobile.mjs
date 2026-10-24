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

const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
page.setDefaultTimeout(25000);
const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.classList.contains('is-ready'), null, { timeout: 30000 });
await page.waitForTimeout(450);
await page.screenshot({ path: path.join(root, 'test', 'shots', 'mobile-ready.png') });
console.log('MOBILE_READY', JSON.stringify(await page.evaluate(() => ({
  bootHidden: document.getElementById('bootScreen').classList.contains('is-hidden'),
  toggleDisplay: getComputedStyle(document.getElementById('partsToggle')).display,
  partsPanelTransform: getComputedStyle(document.getElementById('partsPanel')).transform,
  toastVisible: document.getElementById('toast').classList.contains('is-visible'),
}))));

await page.evaluate(() => document.getElementById('partsToggle').click());
await page.waitForTimeout(450);
await page.screenshot({ path: path.join(root, 'test', 'shots', 'mobile-list.png') });
console.log('LIST_OPEN', await page.evaluate(() => document.body.classList.contains('parts-open')));

await page.evaluate(() => document.querySelector('.part-item[data-part-id="battery"]').click());
await page.waitForTimeout(950);
await page.screenshot({ path: path.join(root, 'test', 'shots', 'mobile-part.png') });
console.log('MOBILE_PART', JSON.stringify(await page.evaluate(() => ({
  detailShown: document.getElementById('infoPanel').classList.contains('has-selection'),
  title: document.querySelector('.detail-title h2')?.textContent || null,
  bodyClasses: document.body.className,
  exploded: document.getElementById('explodedCount').textContent,
  calloutVisible: [...document.querySelectorAll('.part-callout.is-visible')].map((el) => el.dataset.partId),
}))));

console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();
console.log('DONE');
