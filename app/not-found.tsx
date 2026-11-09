import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-20 sm:py-28">
      <p className="font-mono text-sm font-medium text-ink-3">404</p>
      <h1 className="font-display text-[28px] font-bold leading-snug sm:text-[36px]">ไม่พบหน้านี้ในระบบ</h1>
      <p className="max-w-prose text-ink-2">
        ลิงก์อาจพิมพ์ผิด หรือเป็นเรื่องที่ยังไม่เปิดให้ตรวจ ตอนนี้ตรวจได้เฉพาะสัญญาเช่าที่อยู่อาศัย
      </p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Link href="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>กลับหน้าแรก</span>
        </Link>
        <Link href="/check/rental" className="btn-secondary">
          ตรวจสัญญาเช่า
        </Link>
      </div>
    </div>
  );
}
