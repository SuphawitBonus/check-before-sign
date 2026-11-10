import React from 'react';
import Link from 'next/link';
import { getPackById, FUTURE_PACKS } from '../lib/packs/registry';
import { VERDICT, VERDICT_ORDER, VerdictChip } from '../components/Verdict';
import { ArrowRight } from 'lucide-react';

// Four parts only (hero, how, the rental pack, limits). Everything longer lives on /about.
export default function HomePage() {
  const rental = getPackById('rental')!;
  const questionCount = rental.pack.questions.length;
  const ruleCount = rental.pack.rules.length;

  return (
    <div>
      {/* 1. Hero */}
      <section aria-labelledby="hero-title" className="on-dark bg-gradient-to-br from-hero-from via-hero-from to-hero-to text-hero-text">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-16 sm:px-6 sm:py-24">
          <h1 id="hero-title" className="font-display text-[32px] font-bold leading-[1.3] sm:text-[48px]">
            <span className="block">ก่อนเซ็นสัญญาเช่า</span>
            <span className="block text-brass">เช็กว่าข้อไหนขัดกฎหมาย</span>
          </h1>
          <p className="max-w-3xl text-[17px] leading-relaxed text-hero-muted sm:text-lg">
            ตอบคำถามเกี่ยวกับสัญญาของคุณ แล้วดูทีละข้อว่าขัดประกาศ สคบ. หรือไม่ พร้อมเลขข้อที่อ้างอิง
          </p>
          <div className="space-y-3">
            <Link href="/check/rental" className="btn bg-hero-text text-hero-from hover:bg-white">
              เริ่มตรวจสัญญาเช่า
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="text-meta text-hero-muted" data-hero-note>
              ไม่เก็บคำตอบ · ไม่ใช่คำปรึกษากฎหมาย
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-24 px-4 py-20 sm:space-y-32 sm:px-6 sm:py-28">
        {/* 2. Three steps (includes the meaning of the three results) */}
        <section aria-labelledby="steps-title" className="space-y-10">
          <h2 id="steps-title" className="font-display text-[24px] font-bold leading-snug sm:text-[28px]">
            ทำงานอย่างไร
          </h2>
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            <li className="space-y-2">
              <span className="font-mono text-sm font-medium text-ink-3" aria-hidden="true">1</span>
              <h3 className="text-lg font-semibold text-ink">ตอบคำถาม</h3>
              <p className="text-ink-2">{questionCount} คำถามเกี่ยวกับสิ่งที่เขียนไว้ในสัญญา ไม่แน่ใจข้อไหนก็ตอบว่าไม่แน่ใจได้</p>
            </li>
            <li className="space-y-2">
              <span className="font-mono text-sm font-medium text-ink-3" aria-hidden="true">2</span>
              <h3 className="text-lg font-semibold text-ink">เทียบตัวบท</h3>
              <p className="text-ink-2">ระบบเทียบคำตอบกับ {ruleCount} ข้อของประกาศคณะกรรมการว่าด้วยสัญญา พ.ศ. 2568 ด้วยโค้ด ไม่ใช้ AI</p>
            </li>
            <li className="space-y-3">
              <span className="font-mono text-sm font-medium text-ink-3" aria-hidden="true">3</span>
              <h3 className="text-lg font-semibold text-ink">ได้ผลทีละข้อ</h3>
              <dl className="space-y-3">
                {VERDICT_ORDER.map((status) => (
                  <div key={status} className="space-y-1">
                    <dt>
                      <VerdictChip status={status} size="sm" />
                    </dt>
                    <dd className="text-sm text-ink-2">{VERDICT[status].meaning}</dd>
                  </div>
                ))}
              </dl>
            </li>
          </ol>
        </section>

        {/* 3. The rental pack */}
        <section aria-labelledby="packs-title" className="space-y-6">
          <h2 id="packs-title" className="font-display text-[24px] font-bold leading-snug sm:text-[28px]">
            เลือกสัญญาที่จะตรวจ
          </h2>
          <article className="card flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold leading-snug text-ink sm:text-2xl">{rental.meta.title}</h3>
              <p className="max-w-prose text-ink-2" data-pack-summary>
                ห้องพัก อพาร์ตเมนต์ คอนโด หรือบ้านเช่า ที่ผู้ให้เช่ามีตั้งแต่ 3 หน่วยขึ้นไป
              </p>
            </div>
            <Link href={`/check/${rental.meta.id}`} className="btn-secondary w-full shrink-0 md:w-auto">
              เริ่มตรวจสัญญา
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
          <p className="text-ink-2" data-coming-soon>
            <span className="font-semibold text-ink">เร็ว ๆ นี้:</span>{' '}
            {FUTURE_PACKS.map((f, i) => (
              <React.Fragment key={f.id}>
                {i > 0 && ' · '}
                <span className="whitespace-nowrap">{f.soonLabel}</span>
              </React.Fragment>
            ))}
          </p>
        </section>

        {/* 4. Limits (short) */}
        <section aria-labelledby="limits-title" className="space-y-6">
          <h2 id="limits-title" className="font-display text-[24px] font-bold leading-snug sm:text-[28px]">
            ข้อจำกัด
          </h2>
          <ul className="space-y-3 text-ink" data-limits>
            <li>ตรวจจากคำตอบของคุณ ไม่ได้อ่านสัญญาจริง</li>
            <li>ตรวจได้เฉพาะสัญญาที่ทำตั้งแต่ 5 ก.ย. 2568</li>
            <li>ไม่ครอบคลุมหอพัก โรงแรม และการเช่าเพื่อทำธุรกิจ</li>
          </ul>
          <Link href="/about" className="link inline-flex items-center gap-1">
            อ่านข้อจำกัดและตัวบททั้งหมด
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
