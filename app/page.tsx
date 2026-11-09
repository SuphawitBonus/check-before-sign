import Link from 'next/link';
import Image from 'next/image';
import { getAllActivePacks, getPackById, FUTURE_PACKS } from '../lib/packs/registry';
import { toArabicDigits } from '../lib/format';
import { VERDICT, VERDICT_ORDER, VerdictChip } from '../components/Verdict';
import rentalCases from '../packs/rental/cases.json';
import { Building, ArrowRight, ExternalLink, Lock, FileText, Code2, ListChecks } from 'lucide-react';

// Counted from the real test suite at the time of writing (npm test → 135 passed).
// Update this number together with the tests; coverage has never been measured.
const AUTOMATED_TEST_COUNT = 135;

export default function HomePage() {
  const activePacks = getAllActivePacks();
  const rental = getPackById('rental')!;
  const questionCount = rental.pack.questions.length;
  const ruleCount = rental.pack.rules.length;
  const caseCount = ((rentalCases as any).cases ?? rentalCases).length as number;
  const scope = rental.meta.scopeClarification;

  return (
    <div>
      {/* Hero */}
      <section className="on-dark relative overflow-hidden bg-gradient-to-br from-hero-from via-hero-from to-hero-to text-hero-text">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-14">
          <div className="space-y-6 lg:col-span-7 lg:pt-6">
            <p className="eyebrow text-brass">
              <FileText className="h-4 w-4" aria-hidden="true" />
              สัญญาเช่าที่อยู่อาศัย · ประกาศ สคบ. พ.ศ. 2568
            </p>
            <h1 className="font-display text-[32px] font-bold leading-[1.3] sm:text-[44px]">
              <span className="block">ก่อนเซ็นสัญญาเช่า</span>
              <span className="block text-brass">เช็กว่าข้อไหนขัดกฎหมาย</span>
            </h1>
            <p className="max-w-prose text-[17px] leading-relaxed text-hero-muted">
              ตอบคำถามเกี่ยวกับสิ่งที่เขียนไว้ในสัญญา ระบบจะเทียบกับประกาศคณะกรรมการว่าด้วยสัญญาทีละข้อ
              แล้วบอกว่าข้อไหน <strong className="font-semibold text-hero-text">ขัด ไม่ขัด หรือบอกไม่ได้</strong>{' '}
              พร้อมเลขข้อที่อ้างอิง คำตอบของคุณอยู่ในเบราว์เซอร์ ไม่ถูกส่งไปที่ไหน
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/check/rental" className="btn bg-hero-text text-hero-from hover:bg-white">
                เริ่มตรวจสัญญาเช่า
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="#limits" className="btn border border-hero-muted/60 text-hero-text hover:bg-white/10">
                ดูก่อนว่าระบบตรวจอะไรไม่ได้
              </Link>
            </div>
          </div>

          <figure className="lg:col-span-5 lg:pt-4">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-surface shadow-card">
              <Image
                src="/hero-result.png"
                alt="ภาพหน้าจอหน้าผลตรวจ: สรุปว่าขัด 4 ข้อ ไม่ขัด 11 ข้อ บอกไม่ได้ 3 ข้อ และรายการข้อที่ขัดพร้อมเลขข้ออ้างอิง"
                width={1200}
                height={900}
                priority
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-2 text-meta text-hero-muted">
              ภาพหน้าจอจริงจากหน้าผลตรวจของเว็บนี้ · คำตอบตัวอย่างที่แต่งขึ้น
            </figcaption>
          </figure>
        </div>

        {/* Stats strip — computed from the pack, not typed in */}
        <div className="border-t border-white/10">
          <dl className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-white/10 px-4 sm:px-6">
            {[
              { n: ruleCount, label: 'ข้อที่ตรวจ' },
              { n: questionCount, label: 'คำถาม' },
              { n: 3, label: 'ผลที่เป็นไปได้' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-start gap-0.5 px-3 py-5 first:pl-0 sm:flex-row sm:items-baseline sm:gap-2 sm:px-6">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-mono text-3xl font-medium text-brass sm:text-4xl">{s.n}</dd>
                <dd className="text-sm text-hero-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        {/* Three verdicts */}
        <section aria-labelledby="verdicts-title" className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <h2 id="verdicts-title" className="font-display text-[22px] font-bold leading-snug sm:text-[26px]">
              ผลมีได้ 3 แบบ
            </h2>
            <p className="text-ink-2">
              สีและไอคอนของแต่ละผลหมายถึงสิ่งเดียวกันทุกหน้า ถ้าข้อมูลไม่พอ ระบบจะตอบว่า &ldquo;บอกไม่ได้&rdquo;
              แทนการเดา
            </p>
          </div>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-surface lg:col-span-8">
            {VERDICT_ORDER.map((status) => (
              <div key={status} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6">
                <dt className="w-32 shrink-0">
                  <VerdictChip status={status} />
                </dt>
                <dd className="text-ink-2">{VERDICT[status].meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Packs */}
        <section aria-labelledby="packs-title" className="space-y-6">
          <h2 id="packs-title" className="font-display text-[22px] font-bold leading-snug sm:text-[26px]">
            เลือกสัญญาที่จะตรวจ
          </h2>

          {activePacks.map((pack) => (
            <article key={pack.id} className="card p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Building className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-line-strong px-3 py-0.5 text-meta font-semibold text-ink-2">
                      {pack.category}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-compliant-bg px-3 py-0.5 text-meta font-semibold text-compliant-fg">
                      เปิดให้ตรวจแล้ว
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold leading-snug sm:text-2xl">{pack.title}</h3>
                  <p className="max-w-prose text-ink-2">{pack.description}</p>
                  <p className="max-w-prose text-sm text-ink-3">{toArabicDigits(pack.effectiveDateDisplay)}</p>
                </div>
                <Link href={`/check/${pack.id}`} className="btn-primary w-full shrink-0 md:w-auto">
                  เริ่มตรวจสัญญา
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}

          <div className="rounded-2xl border border-dashed border-line-strong p-6">
            <h3 className="text-base font-semibold text-ink">
              <span className="inline-block">ยังไม่เปิดให้ตรวจ</span>{' '}
              <span className="inline-block text-ink-2">— กำลังเตรียมชุดกฎและตัวบท</span>
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {FUTURE_PACKS.map((f) => (
                <li key={f.id} className="space-y-1">
                  <div className="font-medium text-ink">{f.title}</div>
                  <p className="text-sm text-ink-3">{toArabicDigits(f.description)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Limits */}
        <section id="limits" aria-labelledby="limits-title" className="scroll-mt-24 grid gap-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <h2 id="limits-title" className="font-display text-[22px] font-bold leading-snug sm:text-[26px]">
              สิ่งที่ระบบนี้ทำไม่ได้
            </h2>
            <p className="text-ink-2">อ่านก่อนใช้ผลตรวจไปคุยกับผู้ให้เช่า</p>
          </div>
          <ol className="space-y-4 lg:col-span-8">
            {[
              ['ไม่ใช่คำปรึกษาทางกฎหมาย', 'เป็นการเทียบคำตอบของคุณกับตัวบทเท่านั้น ถ้ามีข้อพิพาท ให้ติดต่อ สคบ. หรือทนายความ'],
              ['ไม่ได้อ่านสัญญาของคุณ', 'ระบบตรวจจากคำตอบที่คุณเลือก ถ้าตอบไม่ตรงกับที่เขียนในสัญญา ผลก็จะไม่ตรง'],
              [
                'ตรวจเฉพาะประกาศ พ.ศ. 2568',
                'ตรวจได้เมื่อทำสัญญาตั้งแต่ 5 กันยายน 2568 สัญญาที่ทำก่อนนั้นอาจยังอยู่ภายใต้ประกาศ พ.ศ. 2562 ซึ่งระบบยังไม่ได้ตรวจ ผลจะเป็น "บอกไม่ได้" ทั้งชุด',
              ],
              ['ไม่ครอบคลุมทุกการเช่า', `${scope.inScopeDescription} ไม่รวม: ${scope.outOfScopeExamples.map((e) => e.split(' (')[0]).join(' / ')}`],
              ['ไม่เดา', 'ถ้าคุณตอบว่าไม่แน่ใจ หรือข้อมูลไม่พอ ข้อนั้นจะเป็น "บอกไม่ได้"'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 font-mono text-sm font-medium text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="font-semibold text-ink">{title}</div>
                  <p className="text-ink-2">{toArabicDigits(body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* How it works — technical terms are allowed here */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-24 space-y-8">
          <div className="max-w-prose space-y-3">
            <h2 id="how-title" className="font-display text-[22px] font-bold leading-snug sm:text-[26px]">
              ทำงานอย่างไร
            </h2>
            <p className="text-ink-2">
              เบื้องหลังคือ Rule Engine ที่อ่านชุดกฎ (Rule Pack) ของแต่ละเรื่อง ชุดกฎหนึ่งชุดประกอบด้วยคำถาม
              ตัวบทที่อ้างอิง และโค้ดตัดสินของแต่ละข้อ
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-ink">ตัวบทจากราชกิจจานุเบกษา</h3>
              <p className="text-sm text-ink-2">
                ทุกข้อมีเลขข้อ ข้อความตัวบท และลิงก์เอกสารทางการ เปิดดูได้จากหน้าผล
              </p>
            </div>
            <div className="space-y-2">
              <Code2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-ink">ตัดสินด้วยโค้ด ไม่ใช้ AI</h3>
              <p className="text-sm text-ink-2">
                โค้ด TypeScript ตายตัว คำตอบเดิมได้ผลเดิมทุกครั้ง มี test อัตโนมัติ {AUTOMATED_TEST_COUNT} รายการ
                รวมกรณีสมมติของสัญญาเช่า {caseCount} กรณี (ยังไม่ได้วัด coverage)
              </p>
            </div>
            <div className="space-y-2">
              <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-ink">ประมวลผลในเครื่องคุณ</h3>
              <p className="text-sm text-ink-2">
                คำตอบไม่ถูกส่งไปเซิร์ฟเวอร์ ลิงก์แชร์เก็บแค่รหัสตัวเลือกไว้หลังเครื่องหมาย # ฟอนต์ฝังมากับเว็บ
                ไม่เรียก Google Fonts
              </p>
            </div>
          </div>

          <div id="sources" className="scroll-mt-24 rounded-2xl border border-line bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
              ตัวบทที่ใช้กับสัญญาเช่า
            </h3>
            <ul className="mt-4 space-y-4">
              {rental.meta.officialSources.map((src) => (
                <li key={src.url} className="space-y-1">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-medium text-primary underline decoration-primary/40 hover:decoration-primary"
                  >
                    <span>{toArabicDigits(src.title)}</span>
                    <ExternalLink className="mt-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(เปิดในแท็บใหม่)</span>
                  </a>
                  <p className="text-sm text-ink-3">{toArabicDigits(src.gazetteRef)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
