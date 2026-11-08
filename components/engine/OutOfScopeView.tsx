import React from 'react';
import { HelpChannel } from '../../lib/engine/types';
import { AlertTriangle, RotateCcw, PhoneCall, ExternalLink, ShieldCheck } from 'lucide-react';

interface OutOfScopeViewProps {
  reason: string;
  helpChannels: HelpChannel[];
  onReset: () => void;
  packTitle: string;
}

export default function OutOfScopeView({
  reason,
  helpChannels,
  onReset,
  packTitle,
}: OutOfScopeViewProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Notice Card */}
      <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-700" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            อยู่นอกขอบเขตการกำกับของประกาศฉบับนี้
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            ระบบหยุดการตรวจสอบไว้ที่ข้อแรก
          </h2>
        </div>

        {/* Reason explanation */}
        <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/60 text-left text-sm text-amber-950 leading-relaxed">
          <p className="font-semibold mb-1 text-amber-900">เหตุผลที่ไม่อยู่ในขอบเขต:</p>
          <p>{reason}</p>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          ตามหลักการที่โปร่งใส หากสถานการณ์ของคุณไม่อยู่ในนิยามของกฎหมายฉบับนี้ ระบบจะไม่นำกฎเกณฑ์มาตรวจต่อเพื่อป้องกันความเข้าใจผิดในสิทธิและหน้าที่
        </p>

        {/* Reset button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>กลับไปเลือกคำตอบใหม่</span>
          </button>
        </div>
      </div>

      {/* Official Help Channels */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>ช่องทางติดต่อสอบถามหรือขอความช่วยเหลือทางการ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {helpChannels.map((ch, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-sm text-slate-800">{ch.name}</div>
                {ch.description && (
                  <div className="text-xs text-slate-500 mt-1">{ch.description}</div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {ch.tel && (
                  <a
                    href={`tel:${ch.tel.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>โทร {ch.tel}</span>
                  </a>
                )}
                {ch.url && (
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    <span>เว็บไซต์</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
