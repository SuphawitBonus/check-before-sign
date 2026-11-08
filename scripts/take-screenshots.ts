import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { encodeAnswersToShareHash } from '../lib/engine/sharing';
import cases from '../packs/rental/cases.json';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('[Screenshots] Starting Next.js server on port 3020...');
  const nextBin = path.resolve(process.cwd(), 'node_modules/next/dist/bin/next');
  const server = spawn('node', [nextBin, 'start', '-p', '3020'], {
    stdio: 'ignore',
  });

  const isReady = await waitForServer('http://localhost:3020');
  if (!isReady) {
    console.error('[Screenshots] Error: Next.js server failed to respond on port 3020');
    server.kill();
    process.exit(1);
  }
  console.log('[Screenshots] Next.js server is online!');

  console.log(`[Screenshots] Launching browser: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Desktop Home
  console.log('[Screenshots] Capturing desktop-home.png (1280x900)...');
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:3020', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-home.png'), fullPage: false });

  // 2. Mobile Home (375px)
  console.log('[Screenshots] Capturing mobile-home-375px.png (375x812)...');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3020', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-home-375px.png'), fullPage: false });

  // 3. Desktop Check Questionnaire
  console.log('[Screenshots] Capturing desktop-check-rental.png (1280x900)...');
  await page.setViewport({ width: 1280, height: 900, isMobile: false });
  await page.goto('http://localhost:3020/check/rental', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-check-rental.png'), fullPage: false });

  // 4. Mobile Check Questionnaire (375px)
  console.log('[Screenshots] Capturing mobile-check-rental-375px.png (375x812)...');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3020/check/rental', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-check-rental-375px.png'), fullPage: false });

  // 5. Desktop Result Screen (Case 2: classic exploitative contract)
  const resultAnswers = cases[1].answers;
  const shareHash = encodeAnswersToShareHash(resultAnswers);
  const resultUrl = `http://localhost:3020/check/rental#share=${shareHash}`;

  console.log('[Screenshots] Capturing desktop-result-screen.png (1280x1000)...');
  await page.setViewport({ width: 1280, height: 1000, isMobile: false });
  await page.goto(resultUrl, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-result-screen.png'), fullPage: false });

  // 6. Mobile Result Screen (375px)
  console.log('[Screenshots] Capturing mobile-result-screen-375px.png (375x812)...');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(resultUrl, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-result-screen-375px.png'), fullPage: false });

  // 7. Desktop Out of Scope Screen (Case 3: university dorm)
  const outOfScopeAnswers = cases[2].answers;
  const outOfScopeHash = encodeAnswersToShareHash(outOfScopeAnswers);
  const outOfScopeUrl = `http://localhost:3020/check/rental#share=${outOfScopeHash}`;

  console.log('[Screenshots] Capturing desktop-out-of-scope.png...');
  await page.setViewport({ width: 1280, height: 900, isMobile: false });
  await page.goto(outOfScopeUrl, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-out-of-scope.png'), fullPage: false });

  await browser.close();
  console.log('[Screenshots] Browser closed. Terminating server...');
  server.kill();

  console.log('[Screenshots] All 7 screenshots generated successfully in docs/screenshots/!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Screenshots] Failed:', err);
  process.exit(1);
});
