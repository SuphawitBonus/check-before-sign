import Link from 'next/link';
import { ShieldCheck, Lock, BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 transition shadow-sm">
            ✓
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
              เช็กก่อนเซ็น
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Rule Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-500 leading-none">
              เทียบสัญญาจริงกับตัวบทกฎหมายราชกิจจานุเบกษา
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>คำนวณในเครื่อง 100% (ไม่บันทึกข้อมูล)</span>
          </div>
          <Link
            href="/#sources"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">ที่มาตัวบท</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
