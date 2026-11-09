import Link from 'next/link';
import { Lock } from 'lucide-react';
import LogoMark from './Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg">
          <LogoMark className="h-9 w-9 shrink-0" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-ink">เช็กก่อนเซ็น</span>
            <span className="hidden text-meta text-ink-3 sm:block">เทียบสัญญากับตัวบทกฎหมาย ก่อนลงชื่อ</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="flex items-center gap-1 text-sm">
          <span className="mr-2 hidden items-center gap-1.5 text-meta text-ink-2 md:inline-flex">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            คำตอบอยู่ในเครื่องคุณ ไม่ถูกส่งออก
          </span>
          <Link href="/#limits" className="rounded-full px-3 py-2 font-medium text-ink-2 hover:bg-sunk hover:text-ink">
            ข้อจำกัด
          </Link>
          <Link href="/#how" className="hidden rounded-full px-3 py-2 font-medium sm:inline-block text-ink-2 hover:bg-sunk hover:text-ink">
            ทำงานอย่างไร
          </Link>
        </nav>
      </div>
    </header>
  );
}
