import { ShieldAlert, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      {/* Legal disclaimer banner */}
      <div className="bg-amber-50/70 border-b border-amber-200/80 py-4 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">ข้อสงวนสิทธิ์ทางกฎหมาย:</span> ข้อมูลทั้งหมดบนเว็บไซต์นี้สร้างขึ้นเพื่อการเทียบเคียงข้อสัญญากับตัวบทกฎหมายที่ประกาศในราชกิจจานุเบกษาเท่านั้น{' '}
            <strong className="underline decoration-amber-500 font-bold">
              นี่คือการเทียบกับตัวบท ไม่ใช่คำปรึกษาทางกฎหมาย
            </strong>{' '}
            หากท่านมีข้อพิพาทหรือต้องการความช่วยเหลือทางคดี โปรดติดต่อหน่วยงานรัฐที่มีอำนาจตามกฎหมาย เช่น สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สายด่วน สคบ. 1166) หรือสภาทนายความ
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-bold text-slate-900 mb-2">เช็กก่อนเซ็น (Check Before Sign)</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              โอเพนซอร์ส Rule Engine สำหรับตรวจสัญญาและข้อตกลง ตัดสินด้วยโค้ด TypeScript ที่พิสูจน์ได้ตามตัวบทจริง ไม่ใช้ AI ตัดสินความถูกผิด
            </p>
            <div className="mt-3 text-xs text-slate-500">
              ความเป็นส่วนตัว: ทำงานในเบราว์เซอร์ของคุณ 100% ไม่มี Log หรือการเก็บข้อมูลเข้าเซิร์ฟเวอร์
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-2">แหล่งอ้างอิงทางการที่ใช้</div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <a
                  href="https://ratchakitcha.soc.go.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1"
                >
                  <span>เว็บไซต์ราชกิจจานุเบกษา (soc.go.th)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ocpb.go.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1"
                >
                  <span>สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.tcc.or.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1"
                >
                  <span>สภาองค์กรของผู้บริโภค (โทร 1502)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-2">ช่องทางร้องเรียนหลัก</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• <strong>สายด่วน สคบ.:</strong> โทร 1166 (วัน-เวลาราชการ)</div>
              <div>• <strong>ร้องทุกข์ออนไลน์:</strong> complaint.ocpb.go.th</div>
              <div>• <strong>สายด่วนเงินกู้/ศูนย์ดำรงธรรม:</strong> โทร 1567</div>
              <div>• <strong>กระทรวงแรงงาน:</strong> โทร 1506</div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>โครงการภาคพลเมืองเพื่อความเป็นธรรมในสัญญา • ไม่มีส่วนเกี่ยวข้องหรือแอบอ้างเป็นหน่วยงานราชการ</div>
          <div>สิทธิ์เสรีภาพและกฎหมายคุ้มครองผู้บริโภค พ.ศ. ๒๕๒๒ และฉบับแก้ไข</div>
        </div>
      </div>
    </footer>
  );
}

