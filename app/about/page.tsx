import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getPackById, FUTURE_PACKS } from '../../lib/packs/registry';
import { toArabicDigits } from '../../lib/format';
import rentalCases from '../../packs/rental/cases.json';

export const metadata: Metadata = {
  title: 'ข้อจำกัด วิธีทำงาน และตัวบท — เช็กก่อนเซ็น',
  description: 'สิ่งที่ระบบทำไม่ได้ วิธีที่ระบบตัดสิน ตัวบทที่ใช้พร้อมลิงก์ราชกิจจานุเบกษา และช่องทางร้องเรียน',
};

// Counted from the real test suite at the time of writing (npm test → 135 passed).
// Update together with the tests; coverage has never been measured.
const AUTOMATED_TEST_COUNT = 135;

const OFFICIAL_SITES = [
  { href: 'https://ratchakitcha.soc.go.th', label: 'ราชกิจจานุเบกษา (ratchakitcha.soc.go.th)' },
  { href: 'https://www.ocpb.go.th', label: 'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)' },
  { href: 'https://www.tcc.or.th', label: 'สภาองค์กรของผู้บริโภค' },
];

const HOTLINES = [
  { name: 'สายด่วน สคบ.', detail: 'โทร 1166 (วันและเวลาราชการ)' },
  { name: 'ร้องเรียน สคบ. ออนไลน์', detail: 'complaint.ocpb.go.th' },
  { name: 'สภาองค์กรของผู้บริโภค', detail: 'โทร 1502' },
  { name: 'ศูนย์ดำรงธรรม', detail: 'โทร 1567' },
  { name: 'กระทรวงแรงงาน', detail: 'โทร 1506' },
];

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link inline-flex items-start gap-1 font-medium">
      <span>{children}</span>
      <ExternalLink className="mt-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">(เปิดในแท็บใหม่)</span>
    </a>
  );
}

export default function AboutPage() {
  const rental = getPackById('rental')!;
  const scope = rental.meta.scopeClarification;
  const caseCount = ((rentalCases as any).cases ?? rentalCases).length as number;

  return (
    <article className="mx-auto max-w-3xl space-y-20 px-4 py-14 sm:px-6 sm:py-20">
      <header className="space-y-5">
        <h1 className="font-display text-[30px] font-bold leading-tight sm:text-[40px]">ข้อจำกัด วิธีทำงาน และตัวบทที่ใช้</h1>
        <p className="max-w-prose text-[17px] leading-relaxed text-ink-2">
          เช็กก่อนเซ็นเป็นโครงการโอเพนซอร์สสำหรับเทียบข้อสัญญากับตัวบทกฎหมายที่ประกาศจริง ผลตัดสินมาจากโค้ดที่เปิดให้ตรวจสอบได้
        </p>
        <nav aria-label="หัวข้อในหน้านี้">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><a href="#limits" className="link">สิ่งที่ระบบทำไม่ได้</a></li>
            <li><a href="#how" className="link">ทำงานอย่างไร</a></li>
            <li><a href="#sources" className="link">ตัวบทที่ใช้</a></li>
            <li><a href="#complaints" className="link">ช่องทางร้องเรียน</a></li>
          </ul>
        </nav>
      </header>

      <section id="limits" aria-labelledby="limits-title" className="scroll-mt-24 space-y-6">
        <h2 id="limits-title" className="font-display text-[24px] font-bold sm:text-[28px]">สิ่งที่ระบบนี้ทำไม่ได้</h2>
        <ul className="space-y-6">
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ไม่ใช่คำปรึกษาทางกฎหมาย</h3>
            <p className="max-w-prose text-ink-2">
              เป็นการเทียบคำตอบของคุณกับตัวบทเท่านั้น ถ้ามีข้อพิพาทหรือต้องการความช่วยเหลือทางคดี ติดต่อ สคบ. (สายด่วน 1166)
              สภาองค์กรของผู้บริโภค (1502) หรือสภาทนายความ
            </p>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ไม่ได้อ่านสัญญาของคุณ</h3>
            <p className="max-w-prose text-ink-2">ระบบตรวจจากคำตอบที่คุณเลือก ถ้าตอบไม่ตรงกับที่เขียนในสัญญา ผลก็จะไม่ตรง</p>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ตรวจเฉพาะประกาศ พ.ศ. 2568</h3>
            <p className="max-w-prose text-ink-2">
              สัญญาที่ทำก่อนวันที่ประกาศนี้มีผล (ดูวันที่ใน<a href="#sources" className="link">ตัวบทที่ใช้</a>) อาจยังอยู่ภายใต้ประกาศ พ.ศ. 2562
              ซึ่งระบบยังไม่ได้ตรวจ ผลจะเป็น &ldquo;บอกไม่ได้&rdquo; ทั้งชุด
            </p>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ไม่ครอบคลุมทุกการเช่า</h3>
            <p className="max-w-prose text-ink-2">{toArabicDigits(scope.inScopeDescription)}</p>
            <p className="max-w-prose text-ink-2">ไม่รวม:</p>
            <ul className="list-disc space-y-1 pl-6 text-ink-2">
              {scope.outOfScopeExamples.map((e) => (
                <li key={e}>{toArabicDigits(e)}</li>
              ))}
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ไม่เดา</h3>
            <p className="max-w-prose text-ink-2">ถ้าคุณตอบว่าไม่แน่ใจ หรือข้อมูลไม่พอ ข้อนั้นจะเป็น &ldquo;บอกไม่ได้&rdquo;</p>
          </li>
        </ul>
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-24 space-y-6">
        <h2 id="how-title" className="font-display text-[24px] font-bold sm:text-[28px]">ทำงานอย่างไร</h2>
        <p className="max-w-prose text-ink-2">
          เบื้องหลังคือ Rule Engine ที่อ่านชุดกฎ (Rule Pack) ของแต่ละเรื่อง ชุดกฎหนึ่งชุดประกอบด้วยคำถาม ตัวบทที่อ้างอิง
          และโค้ดตัดสินของแต่ละข้อ
        </p>
        <ul className="space-y-6">
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ตัวบทจากราชกิจจานุเบกษา</h3>
            <p className="max-w-prose text-ink-2">ทุกข้อมีเลขข้อ ข้อความตัวบท และลิงก์เอกสารทางการ เปิดดูได้จากหน้าผล</p>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ตัดสินด้วยโค้ด ไม่ใช้ AI</h3>
            <p className="max-w-prose text-ink-2">
              โค้ด TypeScript ตายตัว คำตอบเดิมได้ผลเดิมทุกครั้ง มี test อัตโนมัติ {AUTOMATED_TEST_COUNT} รายการ รวมกรณีสมมติของสัญญาเช่า{' '}
              {caseCount} กรณี (ยังไม่ได้วัด coverage)
            </p>
          </li>
          <li className="space-y-1">
            <h3 className="font-semibold text-ink">ประมวลผลในเครื่องคุณ</h3>
            <p className="max-w-prose text-ink-2">
              คำตอบประมวลผลในเบราว์เซอร์ของคุณ ไม่ถูกส่งหรือบันทึกที่เซิร์ฟเวอร์ ลิงก์แชร์เก็บแค่รหัสตัวเลือกไว้หลังเครื่องหมาย #
              ฟอนต์ฝังมากับเว็บ ไม่เรียก Google Fonts
            </p>
          </li>
        </ul>
      </section>

      <section id="sources" aria-labelledby="sources-title" className="scroll-mt-24 space-y-6">
        <h2 id="sources-title" className="font-display text-[24px] font-bold sm:text-[28px]">ตัวบทที่ใช้</h2>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">{rental.meta.title}</h3>
          <p className="text-meta text-ink-3">หมวด: {rental.meta.category}</p>
          <p className="max-w-prose text-ink-2">{toArabicDigits(rental.meta.description)}</p>
          <p className="max-w-prose text-ink-2" data-effective-date>
            <span className="font-semibold text-ink">วันมีผล:</span> {toArabicDigits(rental.meta.effectiveDateDisplay)}
          </p>
        </div>
        <ul className="space-y-5">
          {rental.meta.officialSources.map((src) => (
            <li key={src.url} className="space-y-1">
              <ExtLink href={src.url}>{toArabicDigits(src.title)}</ExtLink>
              <p className="max-w-prose text-sm text-ink-3">{toArabicDigits(src.gazetteRef)}</p>
            </li>
          ))}
        </ul>
        <p className="max-w-prose text-ink-2">
          กฎหมายหลักที่เกี่ยวข้อง: พ.ร.บ.คุ้มครองผู้บริโภค พ.ศ. 2522 และที่แก้ไขเพิ่มเติม
        </p>

        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold text-ink">เรื่องที่กำลังเตรียม (ยังไม่เปิดให้ตรวจ)</h3>
          <ul className="space-y-4">
            {FUTURE_PACKS.map((f) => (
              <li key={f.id} className="space-y-1">
                <div className="font-medium text-ink">{f.title}</div>
                <p className="max-w-prose text-sm text-ink-2">{toArabicDigits(f.description)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="complaints" aria-labelledby="complaints-title" className="scroll-mt-24 space-y-6">
        <h2 id="complaints-title" className="font-display text-[24px] font-bold sm:text-[28px]">ช่องทางร้องเรียน</h2>
        <ul className="space-y-2 text-ink-2">
          {HOTLINES.map((h) => (
            <li key={h.name}>
              <span className="font-semibold text-ink">{h.name}</span> — {h.detail}
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <h3 className="font-semibold text-ink">เว็บไซต์ทางการ</h3>
          <ul className="space-y-2">
            {OFFICIAL_SITES.map((s) => (
              <li key={s.href}>
                <ExtLink href={s.href}>{s.label}</ExtLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-ink-2">
        <Link href="/check/rental" className="link">
          เริ่มตรวจสัญญาเช่า
        </Link>
      </p>
    </article>
  );
}
