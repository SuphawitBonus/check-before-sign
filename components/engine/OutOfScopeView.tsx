import React from 'react';
import { HelpChannel } from '../../lib/engine/types';
import { toArabicDigits } from '../../lib/format';
import { MapPinOff, RotateCcw, Phone, ExternalLink } from 'lucide-react';

interface OutOfScopeViewProps {
  reason: string;
  helpChannels: HelpChannel[];
  onReset: () => void;
  packTitle: string;
}

// "Out of scope" is not a verdict, so it uses neutral ink colours, not the verdict palette (DESIGN.md §1).
export default function OutOfScopeView({ reason, helpChannels, onReset, packTitle }: OutOfScopeViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card space-y-5 p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sunk text-ink">
          <MapPinOff className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-3">{packTitle}</p>
          <h1 className="font-display text-[26px] font-bold leading-snug sm:text-[30px]">
            กรณีของคุณอยู่นอกขอบเขตของประกาศฉบับนี้
          </h1>
        </div>

        <div className="rounded-xl bg-sunk p-4 leading-relaxed text-ink">
          <p className="mb-1 font-semibold">เหตุผล</p>
          <p>{toArabicDigits(reason)}</p>
        </div>

        <p className="max-w-prose text-sm leading-relaxed text-ink-2">
          ระบบจึงไม่นำข้อกำหนดของประกาศนี้มาตรวจต่อ เพื่อไม่ให้เข้าใจผิดเรื่องสิทธิและหน้าที่ของคุณ
          ถ้าตอบข้อแรกผิด กดปุ่มด้านล่างเพื่อเริ่มใหม่
        </p>

        <button type="button" onClick={onReset} className="btn-primary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>กลับไปเลือกคำตอบใหม่</span>
        </button>
      </section>

      <section aria-labelledby="oos-help" className="card space-y-4 p-6">
        <h2 id="oos-help" className="font-display text-lg font-bold">
          สอบถามหรือขอความช่วยเหลือ
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {helpChannels.map((ch, idx) => (
            <li key={idx} className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
              <div>
                <div className="font-semibold text-ink">{ch.name}</div>
                {ch.description && <div className="mt-1 text-sm text-ink-2">{ch.description}</div>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ch.tel && (
                  <a href={`tel:${ch.tel.replace(/[^0-9]/g, '')}`} className="btn-primary min-h-[40px] px-4 py-2 text-sm">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span>
                      โทร <span className="font-mono">{ch.tel}</span>
                    </span>
                  </a>
                )}
                {ch.url && (
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary min-h-[40px] px-4 py-2 text-sm"
                  >
                    <span>เว็บไซต์</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(เปิดในแท็บใหม่)</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
