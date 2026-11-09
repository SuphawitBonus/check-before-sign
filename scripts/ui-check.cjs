// Drives the real production build (npm start on :3020) through the flows required by report 2.
// Usage: npm run build && npm start   (in another terminal)
//        node scripts/ui-check.cjs [repoDir=.] [screenshotDir=docs/screenshots/report-2]
// Needs Chrome or Edge installed (puppeteer-core does not download a browser).
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const repo = path.resolve(process.argv[2] || process.cwd());
const outDir = path.resolve(process.argv[3] || path.join(repo, 'docs/screenshots/report-2'));
const req = createRequire(path.join(repo, 'package.json'));
const puppeteer = req('puppeteer-core');

const BASE = 'http://localhost:3020';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(CHROME) ? CHROME : EDGE;

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile375: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

const log = [];
const check = (ok, msg) => {
  log.push(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
};

async function clickButtonContaining(page, text) {
  const ok = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.includes(t) && !b.disabled);
    if (!btn) return false;
    btn.click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found / disabled: ${text}`);
  await new Promise((r) => setTimeout(r, 150));
}

const stepLabel = (page) =>
  page.evaluate(() => {
    const m = document.body.innerText.match(/ข้อที่ (\d+) จาก (\d+)/);
    return m ? { n: Number(m[1]), of: Number(m[2]) } : null;
  });
const isResultPage = (page) => page.evaluate(() => document.body.innerText.includes('ผลการตรวจสัญญา') && !/ข้อที่ \d+ จาก/.test(document.body.innerText));
const shot = (page, name, fullPage = false) => page.screenshot({ path: path.join(outDir, name), fullPage });

async function noHorizontalScroll(page, label) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check(sw <= cw, `${label}: no horizontal scroll (scrollWidth ${sw} <= clientWidth ${cw})`);
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.createBrowserContext(); // fresh cache/cookies per viewport
    const page = await ctx.newPage();
    const failed = [];
    page.on('response', (r) => r.status() >= 400 && failed.push(r.status() + ' ' + decodeURIComponent(r.url())));
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.setViewport(vp);

    // 1. Home
    let res = await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `[${vpName}] GET / → ${res.status()}`);
    check(await page.evaluate(() => document.body.innerText.includes('เริ่มตรวจสัญญา')), `[${vpName}] home shows the rental pack card`);
    await noHorizontalScroll(page, `[${vpName}] home`);
    await shot(page, `${vpName}-01-home.png`);

    // 2. Normal path: in scope + contract after 4 Sep 2568 → must continue to question 3, then all the way to results
    res = await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `[${vpName}] GET /check/rental → ${res.status()}`);
    await shot(page, `${vpName}-02-question-1.png`);
    await clickButtonContaining(page, 'ฉันเป็นบุคคลธรรมดา');
    await clickButtonContaining(page, 'ข้อถัดไป');
    check((await stepLabel(page))?.n === 2, `[${vpName}] normal: question 2 (contract date) shown after scope`);
    await clickButtonContaining(page, 'ทำสัญญาตั้งแต่วันที่ 5 กันยายน 2568');
    await shot(page, `${vpName}-03-question-2-after-effective.png`);
    await clickButtonContaining(page, 'ข้อถัดไป');
    const s3 = await stepLabel(page);
    check(s3?.n === 3 && s3?.of === 21, `[${vpName}] normal: continues to question 3 of 21 (got ${JSON.stringify(s3)})`);
    // Answer the rest: first option for choice questions, quick-pick "1" for number questions.
    for (let guard = 0; guard < 25; guard++) {
      if (await isResultPage(page)) break;
      const answered = await page.evaluate(() => {
        const card = document.querySelector('h2')?.closest('div.bg-white');
        if (!card) return 'no-card';
        const num = card.querySelector('input[type=number]');
        if (num) {
          const quick = [...card.querySelectorAll('button')].find((b) => b.innerText.trim().startsWith('1 '));
          quick.click();
          return 'number';
        }
        const opt = card.querySelector('div.grid button');
        opt.click();
        return 'choice';
      });
      await new Promise((r) => setTimeout(r, 120));
      const nextText = (await page.evaluate(() => document.body.innerText.includes('ดูผลการตรวจสัญญา'))) ? 'ดูผลการตรวจสัญญา' : 'ข้อถัดไป';
      await clickButtonContaining(page, nextText);
      if (answered === 'no-card') break;
    }
    check(await isResultPage(page), `[${vpName}] normal: reached the result page after all 21 questions`);
    const normalSummary = await page.evaluate(() => document.body.innerText.includes('ระบบหยุดถาม'));
    check(!normalSummary, `[${vpName}] normal: no "ended early" banner on the normal path`);
    await noHorizontalScroll(page, `[${vpName}] normal result`);
    await shot(page, `${vpName}-04-normal-result.png`);

    // 3. Legacy path: contract before 4 Sep 2568 → result page immediately after question 2
    await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    await clickButtonContaining(page, 'ฉันเป็นบุคคลธรรมดา');
    await clickButtonContaining(page, 'ข้อถัดไป');
    await clickButtonContaining(page, 'ทำสัญญาก่อนวันที่ 4 กันยายน 2568');
    const btnText = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).find((t) => t.includes('ดูผล') || t.includes('ข้อถัดไป')));
    check(btnText?.includes('ดูผลการตรวจสัญญา'), `[${vpName}] legacy: button on question 2 reads "ดูผลการตรวจสัญญา" (got "${btnText}")`);
    await shot(page, `${vpName}-05-question-2-before-effective.png`);
    await clickButtonContaining(page, 'ดูผลการตรวจสัญญา');
    check(await isResultPage(page), `[${vpName}] legacy: result page shown immediately after question 2`);
    const legacy = await page.evaluate(() => {
      const t = document.body.innerText;
      return {
        banner: t.includes('ระบบหยุดถามเพราะตรวจตามเกณฑ์นี้ไม่ได้'),
        clause10: t.includes('ข้อ 10 ของประกาศ พ.ศ. 2568'),
        undetermined: (t.match(/บอกไม่ได้ \((\d+)\)/) || [])[1],
        violated: (t.match(/ขัดกฎหมาย \((\d+)\)/) || [])[1],
      };
    });
    check(legacy.banner && legacy.clause10, `[${vpName}] legacy: banner with the clause 10 explanation is shown`);
    check(legacy.undetermined === '18', `[${vpName}] legacy: filter tab "บอกไม่ได้ (${legacy.undetermined})" = 18`);
    await noHorizontalScroll(page, `[${vpName}] legacy result`);
    await shot(page, `${vpName}-06-legacy-result-top.png`);
    await page.evaluate(() => document.querySelector('[role=status]')?.scrollIntoView({ block: 'start' }));
    await shot(page, `${vpName}-07-legacy-result-banner.png`);

    // 4. Unknown pack → real HTTP 404
    res = await page.goto(BASE + '/check/' + encodeURIComponent('ไม่มีอยู่จริง'), { waitUntil: 'networkidle0' });
    check(res.status() === 404, `[${vpName}] GET /check/ไม่มีอยู่จริง → HTTP ${res.status()}`);
    check(await page.evaluate(() => document.body.innerText.includes('ไม่พบหน้านี้ในระบบ')), `[${vpName}] 404 page shows the Thai not-found message`);
    await shot(page, `${vpName}-08-not-found-404.png`);

    log.push('INFO  [' + vpName + '] responses >= 400: ' + (failed.join(' | ') || 'none'));
    const unexpected = failed.filter((f) => !f.includes('/check/ไม่มีอยู่จริง'));
    check(unexpected.length === 0, '[' + vpName + '] no unexpected failed requests (only the deliberate 404 page): ' + (unexpected.join(' | ') || 'none'));
    log.push('INFO  ' + `[${vpName}] browser console errors: ${consoleErrors.length}${consoleErrors.length ? ' → ' + consoleErrors.slice(0, 5).join(' | ') : ''}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`browser: ${executablePath}`);
  console.log(log.join('\n'));
}

run().catch((e) => {
  console.log(log.join('\n'));
  console.error('UI CHECK CRASHED:', e);
  process.exit(1);
});
