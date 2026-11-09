import { ExternalLink, Scale } from 'lucide-react';
import LogoMark from './Logo';

const SOURCES = [
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

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="border-b border-line bg-sunk/60 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-start gap-3">
          <Scale className="mt-1 h-5 w-5 shrink-0 text-ink-2" aria-hidden="true" />
          <p className="max-w-prose text-sm leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">นี่คือการเทียบกับตัวบท ไม่ใช่คำปรึกษาทางกฎหมาย</strong>{' '}
            ระบบตรวจจากคำตอบที่คุณเลือก ไม่ได้อ่านสัญญาจริงของคุณ ถ้ามีข้อพิพาทหรือต้องการความช่วยเหลือทางคดี
            ติดต่อ สคบ. (สายด่วน 1166) สภาองค์กรของผู้บริโภค (1502) หรือสภาทนายความ
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 text-sm md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="font-display text-base font-bold text-ink">เช็กก่อนเซ็น</span>
            </div>
            <p className="leading-relaxed text-ink-2">
              โครงการโอเพนซอร์สสำหรับเทียบข้อสัญญากับตัวบทกฎหมายที่ประกาศจริง ผลตัดสินมาจากโค้ดที่เปิดให้ตรวจสอบได้
              ไม่ใช้ AI ตัดสิน
            </p>
            <p className="leading-relaxed text-ink-3">
              ความเป็นส่วนตัว: คำตอบประมวลผลในเบราว์เซอร์ของคุณ ไม่ถูกส่งหรือบันทึกที่เซิร์ฟเวอร์
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-ink">แหล่งอ้างอิงทางการ</h2>
            <ul className="space-y-2">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 text-ink-2 underline decoration-line-strong hover:text-primary hover:decoration-primary"
                  >
                    <span>{s.label}</span>
                    <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(เปิดในแท็บใหม่)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-ink">ช่องทางร้องเรียนหลัก</h2>
            <ul className="space-y-1.5 text-ink-2">
              {HOTLINES.map((h) => (
                <li key={h.name}>
                  <span className="font-medium text-ink">{h.name}</span> — {h.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-meta text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>โครงการภาคพลเมือง ไม่ใช่หน่วยงานราชการ และไม่ได้แอบอ้างเป็นหน่วยงานใด</p>
          <p>กฎหมายหลักที่เกี่ยวข้อง: พ.ร.บ.คุ้มครองผู้บริโภค พ.ศ. 2522 และที่แก้ไขเพิ่มเติม</p>
        </div>
      </div>
    </footer>
  );
}
