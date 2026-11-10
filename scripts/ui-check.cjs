// Drives the real production build (npm start on :3020) through the main flows and the
// measurable layout rules of report 5 (home ≤ 4 sections, /about, no repeated notices,
// one card style, font-size floor, plain footer).
// Usage: npm run build && npm start   (in another terminal)
//        node scripts/ui-check.cjs [repoDir=.] [screenshotDir]   (screenshots only when a dir is given)
// Needs Chrome or Edge installed (puppeteer-core does not download a browser).
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const repo = path.resolve(process.argv[2] || process.cwd());
const outDir = process.argv[3] ? path.resolve(process.argv[3]) : null;
const req = createRequire(path.join(repo, 'package.json'));
const puppeteer = req('puppeteer-core');
const rentalPack = JSON.parse(fs.readFileSync(path.join(repo, 'packs/rental/pack.json'), 'utf8'));
const registrySrc = fs.readFileSync(path.join(repo, 'lib/packs/registry.ts'), 'utf8');

const BASE = 'http://localhost:3020';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath = fs.existsSync(CHROME) ? CHROME : EDGE;

const VIEWPORTS = {
  m375: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  d1366: { width: 1366, height: 900 },
};

// Made-up answers giving all three verdicts (4 ขัด / 11 ไม่ขัด / 3 บอกไม่ได้).
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

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
const arabic = (t) => t.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)));

// Everything that used to be on the home page / footer and must now be findable on /about.
const ABOUT_MUST_CONTAIN = [
  'สิ่งที่ระบบนี้ทำไม่ได้', 'ไม่ใช่คำปรึกษาทางกฎหมาย', 'ไม่ได้อ่านสัญญาของคุณ', 'ตรวจเฉพาะประกาศ พ.ศ. 2568', 'ไม่ครอบคลุมทุกการเช่า', 'ไม่เดา',
  'Rule Engine', 'ตัวบทจากราชกิจจานุเบกษา', 'ตัดสินด้วยโค้ด ไม่ใช้ AI', 'test อัตโนมัติ', 'ยังไม่ได้วัด coverage', 'ประมวลผลในเครื่องคุณ', 'ไม่เรียก Google Fonts',
  arabic(rentalPack.meta.title), arabic(rentalPack.meta.category), arabic(rentalPack.meta.description), arabic(rentalPack.meta.effectiveDateDisplay),
  arabic(rentalPack.meta.scopeClarification.inScopeDescription),
  ...rentalPack.meta.scopeClarification.outOfScopeExamples.map(arabic),
  ...rentalPack.meta.officialSources.flatMap((s) => [arabic(s.title), arabic(s.gazetteRef)]),
  ...[...registrySrc.matchAll(/^\s{4}(?:title|description): '([^']+)'/gm)].map((m) => arabic(m[1])),
  'พ.ร.บ.คุ้มครองผู้บริโภค พ.ศ. 2522 และที่แก้ไขเพิ่มเติม',
  'โทร 1166', 'complaint.ocpb.go.th', 'โทร 1502', 'ศูนย์ดำรงธรรม', 'โทร 1567', 'โทร 1506',
  'ราชกิจจานุเบกษา (ratchakitcha.soc.go.th)', 'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)', 'สภาองค์กรของผู้บริโภค',
];

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
    const m = document.body.innerText.match(/ข้อ(?:ที่)? (\d+) จาก (\d+)/);
    return m ? { n: Number(m[1]), of: Number(m[2]) } : null;
  });
const isResultPage = (page) =>
  page.evaluate(() => document.body.innerText.includes('ผลการตรวจสัญญา') && !document.querySelector('[data-question-card]'));
const shot = (page, name, fullPage = true) => (outDir ? page.screenshot({ path: path.join(outDir, name), fullPage }) : Promise.resolve());

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

// Report-5 layout rules that apply to every page.
async function layoutRules(page, label, { resultPage = false } = {}) {
  const r = await page.evaluate(() => {
    const visible = (el) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && !el.closest('.sr-only');
    };
    // Font-size floor: content ≥ 15px; only `.text-meta` (secondary) may be 13px; nothing below 13px.
    const small = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!walker.currentNode.textContent.trim() || seen.has(el) || !visible(el)) continue;
      seen.add(el);
      const size = parseFloat(getComputedStyle(el).fontSize);
      const secondary = !!el.closest('.text-meta');
      if (size < 13 || (!secondary && size < 15)) small.push(`${size}px "${walker.currentNode.textContent.trim().slice(0, 24)}"`);
    }
    const all = [...document.querySelectorAll('body *')].filter(visible);
    const dashed = all.filter((e) => ['Top', 'Right', 'Bottom', 'Left'].some((s) => getComputedStyle(e)[`border${s}Style`] === 'dashed'));
    const thickLeft = all.filter((e) => {
      const cs = getComputedStyle(e);
      return parseFloat(cs.borderLeftWidth) > 1 && parseFloat(cs.borderRightWidth) <= 1 && cs.borderLeftStyle !== 'none';
    });
    // No boxes inside cards: descendants of .card with their own background, except controls and chips.
    const nested = [...document.querySelectorAll('.card')].flatMap((card) =>
      [...card.querySelectorAll('*')].filter((e) => {
        if (!visible(e) || e.closest('button, a, input, summary, [role=progressbar]') || e.matches('span.rounded-full, span.rounded-full *')) return false;
        const bg = getComputedStyle(e).backgroundColor;
        return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      })
    );
    const nestedCards = [...document.querySelectorAll('.card .card')].length;
    const text = document.body.innerText;
    const count = (re) => (text.match(re) || []).length;
    const footer = document.querySelector('footer');
    return {
      small,
      dashed: dashed.length,
      thickLeft: thickLeft.map((e) => e.tagName + '.' + [...e.classList].slice(0, 3).join('.')),
      nested: nested.map((e) => e.tagName + '.' + [...e.classList].slice(0, 3).join('.')).slice(0, 5),
      nestedCards,
      privacy: count(/ไม่เก็บ|ไม่ถูกส่ง|ไม่ส่งข้อมูล|ไม่บันทึก/g),
      advice: count(/ไม่ใช่คำปรึกษา/g),
      effective: count(/5 (?:กันยายน|ก\.ย\.) 2568/g),
      adviceNearResult: !!document.querySelector('section[aria-labelledby="summary-title"] [data-result-disclaimer]')?.innerText.includes('ไม่ใช่คำปรึกษา'),
      footer: footer
        ? {
            tel: !!footer.querySelector('a[href="tel:1166"]'),
            about: !!footer.querySelector('a[href="/about"]'),
            github: !!footer.querySelector('a[href*="github.com"]'),
            noBand: !/ไม่ใช่คำปรึกษา|ข้อสงวน/.test(footer.innerText),
            blocks: footer.children.length,
          }
        : null,
      headerAbout: !!document.querySelector('header a[href="/about"]'),
    };
  });
  check(r.small.length === 0, `${label}: content text ≥15px, secondary (.text-meta) ≥13px${r.small.length ? ' → ' + r.small.slice(0, 5).join(' | ') : ''}`);
  check(r.dashed === 0, `${label}: no dashed borders (${r.dashed})`);
  check(r.thickLeft.length === 0, `${label}: no thick coloured left border${r.thickLeft.length ? ' → ' + r.thickLeft.join(' | ') : ''}`);
  check(r.nested.length === 0 && r.nestedCards === 0, `${label}: no boxes or cards inside a card${r.nested.length ? ' → ' + r.nested.join(' | ') : ''}`);
  check(r.privacy <= 1, `${label}: "ไม่เก็บ/ไม่ถูกส่ง…" appears at most once (${r.privacy})`);
  if (resultPage) check(r.advice === 1 && r.adviceNearResult, `${label}: "ไม่ใช่คำปรึกษา" exactly once, right under the result summary (${r.advice})`);
  else check(r.advice <= 1, `${label}: "ไม่ใช่คำปรึกษา" appears at most once (${r.advice})`);
  check(r.effective <= 1, `${label}: the effective date (5 ก.ย. 2568) appears at most once (${r.effective})`);
  check(!!r.footer && r.footer.tel && r.footer.about && r.footer.github && r.footer.noBand && r.footer.blocks === 1,
    `${label}: one plain footer with สคบ. 1166, /about and GitHub, no disclaimer band (${JSON.stringify(r.footer)})`);
  check(r.headerAbout, `${label}: header links to /about`);
}

async function run() {
  if (outDir) fs.mkdirSync(outDir, { recursive: true });
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

    // 1. Home — at most 4 parts before the footer
    let res = await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `${P} GET / → ${res.status()}`);
    const home = await page.evaluate(() => {
      const main = document.querySelector('main');
      const sections = [...main.querySelectorAll('section')].filter((s) => !s.parentElement.closest('section'));
      const hero = sections[0];
      const h1 = hero.querySelector('h1');
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
      const linesOf = (el) => {
        if (!el) return -1;
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        return Math.round(el.getBoundingClientRect().height / lh);
      };
      return {
        sectionCount: sections.length,
        sectionTitles: sections.map((s) => (s.querySelector('h1, h2')?.innerText || '').trim()),
        heroActions: hero.querySelectorAll('a, button').length,
        heroParagraphs: [...hero.querySelectorAll('p')].filter((p) => !p.hasAttribute('data-hero-note')).length,
        heroNote: hero.querySelector('[data-hero-note]')?.innerText.trim(),
        heroImages: hero.querySelectorAll('img, figure').length,
        h1MinRatio: Math.min(...widths) / Math.max(...widths),
        stepsHaveVerdicts: sections[1]?.querySelectorAll('span.rounded-full').length === 3,
        packSummaryLines: linesOf(document.querySelector('[data-pack-summary]')),
        soonLines: linesOf(document.querySelector('[data-coming-soon]')),
        soonText: document.querySelector('[data-coming-soon]')?.innerText,
        limits: [...document.querySelectorAll('[data-limits] li')].map((li) => linesOf(li)),
        limitsLink: !!sections[3]?.querySelector('a[href="/about"]'),
        ruleEngine: /Rule Engine/.test(main.innerText),
        coverageClaim: /ครอบคลุม 100%/.test(document.body.innerText),
        scrollHeight: document.documentElement.scrollHeight,
        ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
      };
    });
    check(home.sectionCount <= 4, `${P} home has ${home.sectionCount} parts before the footer (≤ 4): ${home.sectionTitles.join(' | ')}`);
    check(home.heroActions === 1 && home.heroParagraphs === 1 && home.heroImages === 0, `${P} hero = heading + one sentence + one button, no screenshot (actions ${home.heroActions}, paragraphs ${home.heroParagraphs}, images ${home.heroImages})`);
    check(home.heroNote === 'ไม่เก็บคำตอบ · ไม่ใช่คำปรึกษากฎหมาย', `${P} hero note reads "ไม่เก็บคำตอบ · ไม่ใช่คำปรึกษากฎหมาย" (got "${home.heroNote}")`);
    check(home.h1MinRatio >= 0.35, `${P} hero heading has no near-empty line (shortest/longest ${home.h1MinRatio.toFixed(2)})`);
    check(home.stepsHaveVerdicts, `${P} the 3 steps include the three verdicts (ขัด / บอกไม่ได้ / ไม่ขัด)`);
    check(home.packSummaryLines >= 1 && home.packSummaryLines <= 2, `${P} rental card description ≤ 2 lines (${home.packSummaryLines})`);
    check(vpName === 'm375' || home.soonLines === 1, `${P} "เร็ว ๆ นี้" is a single line (${home.soonLines} line(s): ${home.soonText})`);
    check(home.limits.length === 3 && home.limits.every((n) => n === 1), `${P} 3 limits, one line each (${JSON.stringify(home.limits)})`);
    check(home.limitsLink, `${P} limits link to /about`);
    check(!home.ruleEngine, `${P} no "Rule Engine" on the home page (kept on /about)`);
    check(!home.coverageClaim, `${P} no "ครอบคลุม 100%" claim`);
    check(!!home.ogImage, `${P} og:image meta present → ${home.ogImage}`);
    info(`${P} home scrollHeight = ${home.scrollHeight}px`);
    await layoutRules(page, `${P} home`);
    await noHorizontalScroll(page, `${P} home`);
    await contrastAudit(page, `${P} home`);
    await shot(page, `${vpName}-1-home.png`);

    // 2. Question 1 — legal help only for the chosen option; no percentage label
    res = await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `${P} GET /check/rental → ${res.status()}`);
    const q1 = await page.evaluate(() => ({
      step: document.querySelector('[data-step-label]')?.innerText.trim(),
      percent: /\d+\s?%/.test(document.querySelector('main').innerText),
      bar: !!document.querySelector('[role=progressbar]'),
      optionHelpBefore: document.querySelectorAll('[data-option-help]').length,
      questionHelpOpen: document.querySelector('[data-question-help]')?.open ?? null,
    }));
    check(q1.step === 'ข้อ 1 จาก 21' && q1.bar && !q1.percent, `${P} question 1: "ข้อ 1 จาก 21" + progress bar, no percentage (step "${q1.step}", % shown: ${q1.percent})`);
    check(q1.optionHelpBefore === 0 && q1.questionHelpOpen === false, `${P} question 1: no legal text under options before choosing; question background behind "ดูตัวบท" (closed)`);
    await layoutRules(page, `${P} question 1`);
    await contrastAudit(page, `${P} question 1`);
    await shot(page, `${vpName}-2-question-1.png`);
    await clickButtonContaining(page, 'ฉันเป็นบุคคลธรรมดา');
    const q1sel = await page.evaluate(() => {
      const helps = [...document.querySelectorAll('[data-option-help]')];
      return { n: helps.length, inSelected: helps.every((h) => h.closest('button')?.getAttribute('aria-pressed') === 'true') };
    });
    check(q1sel.n === 1 && q1sel.inSelected, `${P} question 1: after choosing, legal text shows only under the chosen option (${q1sel.n})`);
    if (vpName === 'd1366') {
      await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
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
            return { idx: opts.indexOf(el), want: idx, fv: el.matches(':focus-visible'), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
          }, i)
        );
      }
      check(ring.every((r) => r.idx === r.want), `${P} keyboard: Tab visits all ${optionCount} options in order (incl. "ไม่แน่ใจ")`);
      check(ring.every((r) => r.fv && r.style === 'solid' && r.width >= 3), `${P} keyboard: each focused option shows a solid ≥3px focus ring`);
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
    }

    // 3. Normal path to the end (first option / quick-pick 1)
    await page.goto(BASE + '/check/rental', { waitUntil: 'networkidle0' });
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
        card.querySelector('button[data-option]').click();
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
    await clickButtonContaining(page, 'ดูผลการตรวจสัญญา');
    check(await isResultPage(page), `${P} ended early: result page shown immediately after question 2`);
    const ended = await page.evaluate(() => {
      const box = document.querySelector('[role=status]');
      return {
        box: !!box && box.innerText.includes('ระบบหยุดถามเพราะตรวจตามเกณฑ์นี้ไม่ได้') && box.innerText.includes('แก้คำตอบข้อนี้'),
        counts: [...document.querySelectorAll('button[aria-pressed] .font-mono')].map((e) => parseInt(e.innerText, 10)),
      };
    });
    check(ended.box && JSON.stringify(ended.counts) === '[0,0,18]', `${P} ended early: box shown, counters ${JSON.stringify(ended.counts)} (want [0,0,18])`);
    await layoutRules(page, `${P} ended-early result`, { resultPage: true });
    await contrastAudit(page, `${P} ended-early result`);

    // 5. Result with all three verdicts (share link)
    await page.goto('about:blank');
    await page.goto(`${BASE}/check/rental#share=${MIXED_HASH}`, { waitUntil: 'networkidle0' });
    await sleep(300);
    const mixed = await page.evaluate(() => {
      const items = [...document.querySelectorAll('li[data-status]')];
      const order = items.map((l) => l.dataset.status);
      const rank = { violated: 0, undetermined: 1, compliant: 2 };
      const firstClause = items[0]?.querySelector('.font-mono');
      return {
        counts: [...document.querySelectorAll('button[aria-pressed] .font-mono')].map((e) => parseInt(e.innerText, 10)),
        sorted: order.every((s, i) => i === 0 || rank[order[i - 1]] <= rank[s]) && order[0] === 'violated',
        chips: items.every((l) => {
          const chip = l.querySelector('span.rounded-full');
          return chip && chip.querySelector('svg') && /ขัด|บอกไม่ได้/.test(chip.innerText);
        }),
        clauseMono: firstClause ? getComputedStyle(firstClause).fontFamily.split(',')[0] : null,
        thaiDigits: /[๐-๙]/.test(document.body.innerText),
      };
    });
    check(JSON.stringify(mixed.counts) === '[4,11,3]', `${P} mixed result: counters ขัด/ไม่ขัด/บอกไม่ได้ = ${JSON.stringify(mixed.counts)} (want [4,11,3])`);
    check(mixed.sorted && mixed.chips, `${P} mixed result: ขัด first; every verdict chip has an icon and a word`);
    check(mixed.clauseMono?.includes('IBM Plex Mono') && !mixed.thaiDigits, `${P} mixed result: clause numbers in ${mixed.clauseMono}; no Thai numerals`);
    await layoutRules(page, `${P} mixed result`, { resultPage: true });
    await noHorizontalScroll(page, `${P} mixed result`);
    await contrastAudit(page, `${P} mixed result`);
    await shot(page, `${vpName}-3-result.png`);

    // 6. /about holds everything moved off the home page and footer
    res = await page.goto(BASE + '/about', { waitUntil: 'networkidle0' });
    check(res.status() === 200, `${P} GET /about → ${res.status()}`);
    const about = await page.evaluate((needles) => {
      const t = document.querySelector('main').innerText.replace(/\s+/g, ' ');
      return {
        missing: needles.filter((n) => !t.includes(n.replace(/\s+/g, ' '))),
        sections: ['limits', 'how', 'sources', 'complaints'].filter((id) => document.getElementById(id)),
        gazetteLinks: [...document.querySelectorAll('main a[href*="ratchakitcha.soc.go.th"]')].length,
      };
    }, ABOUT_MUST_CONTAIN);
    check(about.missing.length === 0, `${P} /about contains all ${ABOUT_MUST_CONTAIN.length} moved items${about.missing.length ? ' → missing: ' + about.missing.map((m) => m.slice(0, 30)).join(' | ') : ''}`);
    check(about.sections.length === 4, `${P} /about has limits, how, sources and complaints sections (${about.sections.join(', ')})`);
    check(about.gazetteLinks >= 1, `${P} /about links to ratchakitcha.soc.go.th (${about.gazetteLinks})`);
    await layoutRules(page, `${P} /about`);
    await noHorizontalScroll(page, `${P} /about`);
    await contrastAudit(page, `${P} /about`);
    await shot(page, `${vpName}-4-about.png`);

    // 7. Unknown pack → real HTTP 404
    res = await page.goto(BASE + '/check/' + encodeURIComponent('ไม่มีอยู่จริง'), { waitUntil: 'networkidle0' });
    check(res.status() === 404, `${P} GET /check/ไม่มีอยู่จริง → HTTP ${res.status()}`);
    check(await page.evaluate(() => document.body.innerText.includes('ไม่พบหน้านี้ในระบบ')), `${P} 404 page shows the Thai not-found message`);
    await layoutRules(page, `${P} 404`);
    await contrastAudit(page, `${P} 404`);

    // 8. Brand assets are served
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
