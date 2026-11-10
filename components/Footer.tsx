import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import LogoMark from './Logo';

const GITHUB_URL = 'https://github.com/SuphawitBonus/check-before-sign';

// One plain footer. The long disclaimer, sources and hotline list live on /about.
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="font-display font-bold text-ink">เช็กก่อนเซ็น</span>
          </div>
          <p className="text-meta text-ink-3">โครงการภาคพลเมือง ไม่ใช่หน่วยงานราชการ</p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" data-footer-links>
          <li>
            <a href="tel:1166" className="text-ink-2 hover:text-ink">
              สายด่วน สคบ. <span className="font-mono font-medium text-ink">1166</span>
            </a>
          </li>
          <li>
            <Link href="/about" className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
              ข้อจำกัดและตัวบท
            </Link>
          </li>
          <li>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(เปิดในแท็บใหม่)</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
