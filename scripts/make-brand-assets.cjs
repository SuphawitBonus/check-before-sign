// Generates the image assets described in DESIGN.md §5 from the running production build.
// Usage: npm run build && npm start   (in another terminal), then: node scripts/make-brand-assets.cjs
// Writes: public/hero-result.png, app/opengraph-image.png, app/apple-icon.png, app/favicon.ico
// After running it, build again so Next picks up the new files.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const repo = path.resolve(__dirname, '..');
const BASE = 'http://localhost:3020';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath = fs.existsSync(CHROME) ? CHROME : EDGE;

// Made-up answers (not a real contract) chosen so the result shows all three verdicts: 4 ขัด / 11 ไม่ขัด / 3 บอกไม่ได้.
const DEMO_ANSWERS = {
  q_scope: 'in_scope',
  q_contract_date: 'on_or_after_effective',
  q_contract_form: 'short_monthly',
  q_deposit: 3,
  q_advance_rent: 1,
  q_electricity_rate: 'above_actual_rate',
  q_water_rate: '__unsure__',
  q_deposit_refund_period: 'within_7_days',
  q_deposit_refund_after_deduction: 'within_14_days',
  q_deposit_forfeiture: 'has_clause',
  q_tenant_termination: 'conforms',
  q_lessor_termination_notice: 'notice_30_days_or_more',
  q_lessor_termination_disturbance: 'notice_7_days_or_more',
  q_lessor_terminate_without_breach: 'no_clause',
  q_inspection_without_notice: 'notice_required',
  q_lockout_and_seizure: 'has_clause',
  q_exemption_of_liability: 'no_clause',
  q_rent_change_during_term: 'no_clause',
  q_renewal_fee: '__unsure__',
  q_normal_wear_liability: '__unsure__',
  q_force_majeure_liability: 'no_clause',
};
const shareHash = Buffer.from(JSON.stringify(DEMO_ANSWERS), 'utf8')
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

// Minimal ICO writer: embeds PNG images (supported by every current browser).
function pngsToIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function run() {
  fs.mkdirSync(path.join(repo, 'public'), { recursive: true });
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 1. Hero screenshot: the real result page, top part (title, summary, first violated rules).
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/check/rental#share=${shareHash}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const summary = await page.evaluate(() => {
    document.querySelector('header')?.remove(); // site header is not part of the result
    document.querySelector('a[href="#main"]')?.remove();
    window.scrollTo(0, 0);
    const t = document.body.innerText;
    return { v: (t.match(/ขัด\s*(\d+)\s*ข้อ/) || [])[1] };
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(repo, 'public/hero-result.png'), clip: { x: 0, y: 0, width: 1200, height: 900 } });
  console.log('public/hero-result.png', summary);

  // 2. Icons from app/icon.svg.
  const svg = fs.readFileSync(path.join(repo, 'app/icon.svg'), 'utf8');
  const renderIcon = async (size, pad = 0, bg = 'transparent') => {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(
      `<html><body style="margin:0;background:${bg}"><div style="width:${size}px;height:${size}px;box-sizing:border-box;padding:${pad}px">${svg.replace(
        '<svg ',
        '<svg style="width:100%;height:100%;display:block" '
      )}</div></body></html>`
    );
    return page.screenshot({ omitBackground: bg === 'transparent', clip: { x: 0, y: 0, width: size, height: size } });
  };
  fs.writeFileSync(path.join(repo, 'app/apple-icon.png'), await renderIcon(180, 0, '#1E3A5F'));
  const ico = pngsToIco([
    { size: 16, data: await renderIcon(16) },
    { size: 32, data: await renderIcon(32) },
    { size: 48, data: await renderIcon(48) },
  ]);
  fs.writeFileSync(path.join(repo, 'app/favicon.ico'), ico);
  console.log('app/apple-icon.png, app/favicon.ico');

  // 3. Open Graph card, rendered on the real site so it uses the self-hosted fonts.
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.evaluate((svgMarkup) => {
    const chip = (bg, fg, line, label, glyph) =>
      `<span style="display:inline-flex;align-items:center;gap:10px;padding:10px 22px;border-radius:999px;background:${bg};color:${fg};border:2px solid ${line};font-weight:600;font-size:28px">${glyph}${label}</span>`;
    const g = (d) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    document.body.innerHTML = `
      <div style="width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;background:linear-gradient(135deg,#101A2B 0%,#101A2B 45%,#1E3658 100%);color:#F7F2E8;font-family:var(--font-body);display:flex;flex-direction:column;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:18px">
          <div style="width:64px;height:64px">${svgMarkup.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div>
          <span style="font-family:var(--font-display);font-weight:700;font-size:34px">เช็กก่อนเซ็น</span>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:66px;line-height:1.3">ก่อนเซ็นสัญญาเช่า<br><span style="color:#E0B25B">เช็กว่าข้อไหนขัดกฎหมาย</span></div>
          <div style="margin-top:18px;font-size:27px;color:#C9C2B4">เทียบกับประกาศ สคบ. พ.ศ. 2568 ทีละข้อ · ไม่ใช่คำปรึกษาทางกฎหมาย</div>
        </div>
        <div style="display:flex;gap:16px">
          ${chip('#FBEAE7', '#A3201B', '#D9938A', 'ขัด', g('<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86"/><path d="m15 9-6 6M9 9l6 6"/>'))}
          ${chip('#E6F2EA', '#1D6340', '#7FB896', 'ไม่ขัด', g('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'))}
          ${chip('#FAF0D9', '#7A4B00', '#CFA554', 'บอกไม่ได้', g('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'))}
        </div>
      </div>`;
    document.body.style.margin = '0';
    document.documentElement.style.background = '#101A2B';
  }, svg);
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(repo, 'app/opengraph-image.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('app/opengraph-image.png');

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
