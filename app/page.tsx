import Link from 'next/link';
import { getAllActivePacks, FUTURE_PACKS } from '../lib/packs/registry';
import {
  Building,
  BadgePercent,
  Briefcase,
  Plane,
  Building2,
  ShieldCheck,
  CheckCircle,
  FileCheck2,
  Lock,
  ArrowRight,
  Scale,
  Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Building,
  BadgePercent,
  Briefcase,
  Plane,
  Building2,
};

export default function HomePage() {
  const activePacks = getAllActivePacks();

  return (
    <div className="space-y-16 py-8 sm:py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Rule Engine ตรวจสัญญาตามตัวบทราชกิจจานุเบกษา</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          เช็กข้อสัญญาก่อนลงชื่อเซ็น <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            รู้ทันข้อเอาเปรียบ ขัดกฎหมายข้อไหนบ้าง
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          ตอบคำถามสั้น ๆ ไม่กี่ข้อ ระบบจะเทียบสัญญากับกฎหมายฉบับจริงในราชกิจจานุเบกษาทันที
          ประมวลผลในเบราว์เซอร์ของคุณ 100% ไม่ส่งข้อมูลส่วนบุคคลเข้าเซิร์ฟเวอร์
        </p>
      </section>

      {/* Active Pack Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>เลือกประเภทสัญญาที่ต้องการตรวจ</span>
          </h2>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            พร้อมใช้งานแล้ว
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activePacks.map((pack) => {
            const Icon = ICON_MAP[pack.iconName] || Building;
            return (
              <Link
                key={pack.id}
                href={`/check/${pack.id}`}
                className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {pack.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ประกาศ สคบ. มีผล: {pack.effectiveDateDisplay}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {pack.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {pack.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm shadow-blue-500/20">
                    <span>เริ่มตรวจสัญญา</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Future Packs Preview */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              หมวดกฎหมายที่จะเปิดให้ตรวจในเฟสถัดไป
            </h2>
            <p className="text-xs text-slate-500">
              กำลังจัดเตรียม Rule Pack และตัวบทราชกิจจานุเบกษา
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">4 หมวดใหม่</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FUTURE_PACKS.map((future) => {
            const Icon = ICON_MAP[future.iconName] || Scale;
            return (
              <div
                key={future.id}
                className="bg-white/70 rounded-2xl border border-dashed border-slate-300 p-5 space-y-3 opacity-80 hover:opacity-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {future.plannedSession}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{future.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {future.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Core Principles Highlight */}
      <section id="sources" className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            <Scale className="w-3.5 h-3.5" />
            <span>หลักการพื้นฐานที่เคร่งครัด</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            ทำไมระบบถึงน่าเชื่อถือและปลอดภัย?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ตัวบทจริงจากราชกิจจานุเบกษา</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              ห้ามเดาตัวเลข ทุกกฎอ้างอิงจากประกาศฉบับที่มีผลบังคับใช้จริงในราชกิจจานุเบกษา มีเลขข้อ ลิงก์ PDF ทางการ และวันที่ประกาศอย่างชัดเจน
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <FileCheck2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span>ตัดสินด้วย TypeScript Code ไม่ใช้ AI</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              ผลการตัดสินมาจาก Deterministic Code ที่มี Unit Test ครอบคลุม 100% ตอบได้เพียง "ขัด" / "ไม่ขัด" / "บอกไม่ได้" หากข้อมูลไม่พอจะไม่เดา
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <Lock className="w-5 h-5 text-purple-400 shrink-0" />
              <span>ประมวลผลในเบราว์เซอร์ ไม่เก็บข้อมูล</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              คำตอบของคุณจะไม่ถูกบันทึกหรือส่งไปยังเซิร์ฟเวอร์ใด ๆ ทั้งสิ้น แชร์ผลผ่าน URL Hash ที่มีเฉพาะตัวเลือกเชิงตรรกะ ปราศจากข้อมูลส่วนบุคคล
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <span>บอกขั้นตอนต่อไปที่ทำได้จริง</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              มีข้อความสุภาพสำเร็จรูปที่สามารถคัดลอกไปคุยกับคู่สัญญาได้ทันที พร้อมข้อมูลสายด่วนและช่องทางร้องทุกข์ของหน่วยงานรัฐที่ยืนยันแล้ว
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
