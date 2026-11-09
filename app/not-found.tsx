import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">ไม่พบหน้านี้ในระบบ</h1>
      <p className="text-sm text-slate-600">
        หมวดสัญญาหรือหน้าที่คุณเปิดอาจยังไม่เปิดให้บริการ หรือลิงก์ไม่ถูกต้อง
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </Link>
      </div>
    </div>
  );
}
