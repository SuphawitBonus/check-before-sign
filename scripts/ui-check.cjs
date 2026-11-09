// Drives the real production build (npm start on :3020) through the flows checked in report 3.
// Usage: npm run build && npm start   (in another terminal)
//        node scripts/ui-check.cjs [repoDir=.] [screenshotDir=docs/screenshots/report-3]
// Needs Chrome or Edge installed (puppeteer-core does not download a browser).
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const repo = path.resolve(process.argv[2] || process.cwd());
const outDir = path.resolve(process.argv[3] || path.join(repo, 'docs/screenshots/report-3'));
const req = createRequire(path.join(repo, 'package.json'));
const puppeteer = req('puppeteer-core');

const BASE = 'http://localhost:3020';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath = fs.existsSync(CHROME) ? CHROME : EDGE;

const VIEWPORTS = {
  m375: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  d1366: { width: 1366, height: 900 },
};

// Made-up answers giving all three verdicts (4 ขัด / 11 ไม่ขัด / 3 บอกไม่ได้). Same set as scripts/make-brand-assets.cjs.
const MIXED = {
  q_scope: 'in_scope', q_contract_date: 'on_or_after_effective', q_contract_form: 'short_monthly', q_deposit: 3,
  q_advance_rent: 1, q_electricity_rate: 'above_actual_rate', q_water_rate: '__unsure__',
  q_deposit_refund_period: 'within_7_days', q_deposit_refund_after_deduction: 'within_14_days',
  q_deposit_forfeiture: 'has_clause', q_tenant_termination: 'conforms', q_lessor_termination_notice: 'notice_30_days_or_more',
  q_lessor_termination_disturbance: 'notice_7_days_or_more', q_lessor_terminate_without_breach: 'no_clause',
  q_inspection_without_notice: 'notice_required', q_lockout_and_seizure: 'has_clause', q_exemption_of_liability: 'no_clause',
  q_rent_change_during_term: 'no_clause', q_renewal_fee: '__unsure__', q_normal_wear_liability: '__unsure__',
  q_force_majeure_liability: 'no_clause',
};
const MIXED_HASH = Buffer.from(JSON.stringify(MIXED)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const log = [];
const check = (ok, msg) => {
  log.push(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
};
const info = (msg) => log.push(`INFO  ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickButtonContaining(page, text) {
  const ok = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.includes(t) && !b.disabled);
    if (!btn) return false;
    btn.click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found / disabled: ${text}`);
  await sleep(200);
}

const stepLabel = (page) =>
  page.evaluate(() => {
    const m = document.body.innerText.match(/ข้อที่ (\d+) จาก (\d+)/);
    return m ? { n: Number(m[1]), of: Number(m[2]) } : null;
  });
const isResultPage = (page) =>
  page.evaluate(() => document.body.innerText.includes('ผลการตรวจสัญญา') && !document.querySelector('[data-question-card]'));
const shot = (page, name, fullPage = true) => page.screenshot({ path: path.join(outDir, name), fullPage });

async function noHorizontalScroll(page, label) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check(sw <= cw, `${label}: no horizontal scroll (scrollWidth ${sw} <= clientWidth ${cw})`);
}

// WCAG contrast of every visible text node against its nearest opaque background.
// Text inside the dark hero (.on-dark, a gradient) is measured against the gradient's lightest stop (#1E3658).
async function contrastAudit(page, label) {
  const bad = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r, g, b, a };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const bgOf = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        if (e.classList?.contains('on-dark')) return { r: 0x1e, g: 0x36, b: 0x58, a: 1 };
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
      }
      let acc = { r: 255, g: 255, b: 255, a: 1 };
      for (const l of layers.reverse()) acc = blend(l, acc);
      return acc;
    };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.sr-only')) continue;
      const fg = parse(cs.color);
      const bg = bgOf(el);
      const cr = ratio(blend(fg, bg), bg);
      const size = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      if (cr < need) out.push(`${cr.toFixed(2)}<${need} "${n.textContent.trim().slice(0, 30)}"`);
    }
    return out;
  });
  check(bad.length === 0, `${label}: every text meets WCAG AA contrast${bad.length ? ' → ' + bad.slice(0, 6).join(' | ') : ''}`);
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.createBrowserContext(); // fresh cache/cookies per viewport
    const page = await ctx.newPage();
    const failed = [];
    const external = [];
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('about:')) external.push(u);
    });
    page.on('response', (r) => r.status() >= 400 && failed.push(r.status() + ' ' + decodeURIComponent(r.url())));
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.setViewport(vp);
    const P = `[${vpName}]`;

    // 1. Home
    let res = await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `${P} GET / → ${res.status()}`);
    const home = await page.evaluate(() => {
      const t = document.body.innerText;
      const h1 = document.querySelector('h1');
      // Line widths of the hero heading: rects of its text nodes only, grouped by line (top edge).
      const lines = {};
      const tw = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(tw.currentNode);
        for (const r of range.getClientRects()) {
          const k = Math.round(r.top / 8);
          lines[k] = (lines[k] || 0) + r.width;
        }
      }
      const widths = Object.values(lines);
      const badges = [...document.querySelectorAll('article span.rounded-full')].map((b) => ({
        text: b.innerText,
        oneLine: b.getClientRects().length === 1 && b.offsetHeight < 34,
      }));
      return {
        hasCta: t.includes('เริ่มตรวจสัญญา'),
        ruleEngineOutsideHow: [...document.querySelectorAll('body *:not(script):not(style)')]
          .filter((e) => e.children.length === 0 && /Rule Engine/.test(e.textContent) && !e.closest('#how'))
          .map((e) => e.textContent.slice(0, 40)),
        coverageClaim: /ครอบคลุม 100%/.test(t),
        h1Lines: widths.length,
        h1MinRatio: Math.min(...widths) / Math.max(...widths),
        badges,
        heroImg: (() => {
          const img = document.querySelector('figure img');
          return img ? { ok: img.complete && img.naturalWidth > 0, w: img.naturalWidth } : null;
        })(),
        stats: [...document.querySelectorAll('dl dd.font-mono')].map((d) => d.innerText),
        ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
        icons: [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map((l) => l.getAttribute('href')),
      };
    });
    check(home.hasCta, `${P} home shows the start button`);
    check(home.ruleEngineOutsideHow.length === 0, `${P} "Rule Engine" only appears inside "ทำงานอย่างไร" (outside: ${JSON.stringify(home.ruleEngineOutsideHow)})`);
    check(!home.coverageClaim, `${P} no "ครอบคลุม 100%" claim`);
    check(home.h1MinRatio >= 0.35, `${P} hero heading has no near-empty line (lines ${home.h1Lines}, shortest/longest ${home.h1MinRatio.toFixed(2)})`);
    check(home.badges.length > 0 && home.badges.every((b) => b.oneLine), `${P} pack-card badges stay on one line: ${JSON.stringify(home.badges)}`);
    check(home.heroImg?.ok, `${P} hero shows the real result screenshot (naturalWidth ${home.heroImg?.w})`);
    check(JSON.stringify(home.stats) === JSON.stringify(['18', '21', '3']), `${P} stats strip = 18 · 21 · 3 (got ${home.stats.join(' · ')})`);
    check(!!home.ogImage, `${P} og:image meta present → ${home.ogImage}`);
    info(`${P} icon links: ${home.icons.join(', ')}`);
    await noHorizontalScroll(page, `${P} home`);
    await contrastAudit(page, `${P} home`);
    await shot(page, `after-${vpName}-1-home.png`);

    // 2. Question 1 + keyboard
    res = await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `${P} GET /check/rental → ${res.status()}`);
    await contrastAudit(page, `${P} question 1`);
    await shot(page, `after-${vpName}-2-question-1.png`);
    if (vpName === 'd1366') {
      // Tab from the top of the page until focus reaches the first answer option, then through every option.
      await page.evaluate(() => document.activeElement?.blur());
      const optionCount = await page.evaluate(() => document.querySelectorAll('[data-question-card] [aria-pressed]').length);
      let reachedFirst = false;
      for (let i = 0; i < 20 && !reachedFirst; i++) {
        await page.keyboard.press('Tab');
        reachedFirst = await page.evaluate(() => document.activeElement === document.querySelector('[data-question-card] [aria-pressed]'));
      }
      check(reachedFirst, `${P} keyboard: Tab reaches the first answer option`);
      const ring = [];
      for (let i = 0; i < optionCount; i++) {
        if (i > 0) await page.keyboard.press('Tab');
        ring.push(
          await page.evaluate((idx) => {
            const el = document.activeElement;
            const opts = [...document.querySelectorAll('[data-question-card] [aria-pressed]')];
            const cs = getComputedStyle(el);
            return { idx: opts.indexOf(el), want: idx, fv: el.matches(':focus-visible'), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor };
          }, i)
        );
        if (i === 1) await shot(page, `after-${vpName}-keyboard-focus-ring.png`, false);
      }
      check(ring.every((r) => r.idx === r.want), `${P} keyboard: Tab visits all ${optionCount} options in order (incl. "ไม่แน่ใจ")`);
      check(ring.every((r) => r.fv && r.style === 'solid' && r.width >= 3), `${P} keyboard: each focused option shows a solid ≥3px focus ring (${ring[0]?.color})`);
      // Select with Space, move to "ข้อถัดไป" with Tab, press Enter.
      await page.keyboard.down('Shift');
      for (let i = 1; i < optionCount; i++) await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await page.keyboard.press('Space');
      await sleep(150);
      const pressed = await page.evaluate(() => document.querySelector('[data-question-card] [aria-pressed]').getAttribute('aria-pressed'));
      check(pressed === 'true', `${P} keyboard: Space selects the focused option (aria-pressed=${pressed})`);
      let onNext = false;
      for (let i = 0; i < optionCount + 3 && !onNext; i++) {
        await page.keyboard.press('Tab');
        onNext = await page.evaluate(() => document.activeElement?.innerText.includes('ข้อถัดไป'));
      }
      await page.keyboard.press('Enter');
      await sleep(250);
      check((await stepLabel(page))?.n === 2, `${P} keyboard: Enter on "ข้อถัดไป" opens question 2`);
      await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    }

    // 3. Normal path to the end (first option / quick-pick 1)
    await clickButtonContaining(page, 'ฉันเป็นบุคคลธรรมดา');
    await clickButtonContaining(page, 'ข้อถัดไป');
    check((await stepLabel(page))?.n === 2, `${P} normal: question 2 (contract date) shown after scope`);
    await clickButtonContaining(page, 'ทำสัญญาตั้งแต่วันที่ 5 กันยายน 2568');
    await clickButtonContaining(page, 'ข้อถัดไป');
    const s3 = await stepLabel(page);
    check(s3?.n === 3 && s3?.of === 21, `${P} normal: continues to question 3 of 21 (got ${JSON.stringify(s3)})`);
    for (let guard = 0; guard < 25; guard++) {
      if (await isResultPage(page)) break;
      await page.evaluate(() => {
        const card = document.querySelector('[data-question-card]');
        const quick = [...card.querySelectorAll('button')].find((b) => b.innerText.trim().startsWith('1 '));
        if (card.querySelector('input[type=number]') && quick) return quick.click();
        card.querySelector('[data-options] button').click();
      });
      await sleep(120);
      const nextText = (await page.evaluate(() => document.body.innerText.includes('ดูผลการตรวจสัญญา'))) ? 'ดูผลการตรวจสัญญา' : 'ข้อถัดไป';
      await clickButtonContaining(page, nextText);
    }
    check(await isResultPage(page), `${P} normal: reached the result page after all 21 questions`);
    check(!(await page.evaluate(() => !!document.querySelector('#ended-early-title'))), `${P} normal: no "ended early" box on the normal path`);

    // 4. Ended-early path: contract before 4 Sep 2568 → result right after question 2
    await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    await clickButtonContaining(page, 'ฉันเป็นบุคคลธรรมดา');
    await clickButtonContaining(page, 'ข้อถัดไป');
    await clickButtonContaining(page, 'ทำสัญญาก่อนวันที่ 4 กันยายน 2568');
    const btnText = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).find((t) => t.includes('ดูผล') || t.includes('ข้อถัดไป')));
    check(btnText?.includes('ดูผลการตรวจสัญญา'), `${P} ended early: button on question 2 reads "ดูผลการตรวจสัญญา" (got "${btnText}")`);
    await clickButtonContaining(page, 'ดูผลการตรวจสัญญา');
    check(await isResultPage(page), `${P} ended early: result page shown immediately after question 2`);
    const ended = await page.evaluate(() => {
      const box = document.querySelector('[role=status]');
      const counts = [...document.querySelectorAll('button[aria-pressed] .font-mono')].map((e) => parseInt(e.innerText, 10));
      return {
        box: !!box && box.innerText.includes('ระบบหยุดถามเพราะตรวจตามเกณฑ์นี้ไม่ได้'),
        clause10: !!box && box.innerText.includes('ข้อ 10 ของประกาศ พ.ศ. 2568'),
        editBtn: !!box && box.innerText.includes('แก้คำตอบข้อนี้'),
        counts,
        statuses: [...new Set([...document.querySelectorAll('li[data-status]')].map((l) => l.dataset.status))],
      };
    });
    check(ended.box && ended.clause10 && ended.editBtn, `${P} ended early: box with the clause 10 reason and "แก้คำตอบข้อนี้"`);
    check(JSON.stringify(ended.counts) === '[0,0,18]', `${P} ended early: counters ขัด/ไม่ขัด/บอกไม่ได้ = ${JSON.stringify(ended.counts)} (want [0,0,18])`);
    await noHorizontalScroll(page, `${P} ended-early result`);
    await contrastAudit(page, `${P} ended-early result`);
    await shot(page, `after-${vpName}-3-ended-early.png`);
    await clickButtonContaining(page, 'แก้คำตอบข้อนี้');
    check((await stepLabel(page))?.n === 2, `${P} ended early: "แก้คำตอบข้อนี้" reopens question 2`);

    // 5. Result with all three verdicts (share link)
    await page.goto('about:blank');
    await page.goto(`${BASE}/check/rental#share=${MIXED_HASH}`, { waitUntil: 'networkidle0' });
    await sleep(300);
    const mixed = await page.evaluate(() => {
      const items = [...document.querySelectorAll('li[data-status]')];
      const order = items.map((l) => l.dataset.status);
      const rank = { violated: 0, undetermined: 1, compliant: 2 };
      const counts = [...document.querySelectorAll('button[aria-pressed] .font-mono')].map((e) => parseInt(e.innerText, 10));
      const firstClause = items[0]?.querySelector('.font-mono');
      return {
        counts,
        sorted: order.every((s, i) => i === 0 || rank[order[i - 1]] <= rank[s]),
        first: order[0],
        chipsHaveIconAndWord: items.every((l) => {
          const chip = l.querySelector('span.rounded-full');
          return chip && chip.querySelector('svg') && /ขัด|บอกไม่ได้/.test(chip.innerText);
        }),
        clauseMono: firstClause ? { text: firstClause.innerText, family: getComputedStyle(firstClause).fontFamily.split(',')[0] } : null,
        thaiDigits: /[๐-๙]/.test(document.body.innerText),
      };
    });
    check(JSON.stringify(mixed.counts) === '[4,11,3]', `${P} mixed result: counters ขัด/ไม่ขัด/บอกไม่ได้ = ${JSON.stringify(mixed.counts)} (want [4,11,3])`);
    check(mixed.sorted && mixed.first === 'violated', `${P} mixed result: "ขัด" listed first, then บอกไม่ได้, then ไม่ขัด`);
    check(mixed.chipsHaveIconAndWord, `${P} mixed result: every verdict chip has an icon and a word`);
    check(mixed.clauseMono?.family.includes('IBM Plex Mono'), `${P} mixed result: clause number "${mixed.clauseMono?.text}" set in ${mixed.clauseMono?.family}`);
    check(!mixed.thaiDigits, `${P} mixed result: no Thai numerals on the page (Arabic everywhere)`);
    await noHorizontalScroll(page, `${P} mixed result`);
    await contrastAudit(page, `${P} mixed result`);
    await shot(page, `after-${vpName}-4-result-mixed.png`);

    // 6. Unknown pack → real HTTP 404
    res = await page.goto(BASE + '/check/' + encodeURIComponent('ไม่มีอยู่จริง'), { waitUntil: 'networkidle0' });
    check(res.status() === 404, `${P} GET /check/ไม่มีอยู่จริง → HTTP ${res.status()}`);
    check(await page.evaluate(() => document.body.innerText.includes('ไม่พบหน้านี้ในระบบ')), `${P} 404 page shows the Thai not-found message`);
    await contrastAudit(page, `${P} 404`);
    await shot(page, `after-${vpName}-5-not-found.png`);

    // 7. Brand assets are served
    for (const p of ['/favicon.ico', '/icon.svg', '/apple-icon.png', '/opengraph-image.png']) {
      const r = await page.goto(BASE + p);
      check(r.status() === 200, `${P} GET ${p} → ${r.status()} ${r.headers()['content-type']}`);
    }

    check(external.length === 0, `${P} no requests leave the site (fonts self-hosted, no Google Fonts): ${external.slice(0, 5).join(' | ') || 'none'}`);
    info(`${P} responses >= 400: ${failed.join(' | ') || 'none'}`);
    const unexpected = failed.filter((f) => !f.includes('/check/ไม่มีอยู่จริง'));
    check(unexpected.length === 0, `${P} no unexpected failed requests (only the deliberate 404 page): ${unexpected.join(' | ') || 'none'}`);
    const realErrors = consoleErrors.filter((e) => !/404 \(Not Found\)/.test(e));
    info(`${P} browser console errors: ${consoleErrors.length}${consoleErrors.length ? ' → ' + consoleErrors.slice(0, 5).join(' | ') : ''}`);
    check(realErrors.length === 0, `${P} no JavaScript errors in the console (the deliberate 404 load excluded)`);
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
