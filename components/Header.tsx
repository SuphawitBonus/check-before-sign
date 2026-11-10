import Link from 'next/link';
import LogoMark from './Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg">
          <LogoMark className="h-9 w-9 shrink-0" />
          <span className="font-display text-lg font-bold text-ink">เช็กก่อนเซ็น</span>
        </Link>
        <nav aria-label="เมนูหลัก">
          <Link href="/about" className="rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:bg-sunk hover:text-ink">
            ข้อจำกัดและตัวบท
          </Link>
        </nav>
      </div>
    </header>
  );
}
