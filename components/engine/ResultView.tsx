'use client';

import React, { useState } from 'react';
import { EvaluationOutput, RuleStatus } from '../../lib/engine/types';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Share2,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Calendar,
  MessageSquare,
  Scale,
} from 'lucide-react';
import { encodeAnswersToShareHash } from '../../lib/engine/sharing';

interface ResultViewProps {
  evaluation: EvaluationOutput;
  answers: Record<string, any>;
  onEditAnswers: () => void;
  onReset: () => void;
}

export default function ResultView({
  evaluation,
  answers,
  onEditAnswers,
  onReset,
}: ResultViewProps) {
  const [filter, setFilter] = useState<'all' | RuleStatus>('all');
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);
  const [expandedVerbatimIds, setExpandedVerbatimIds] = useState<Record<string, boolean>>({});
  const [shareCopied, setShareCopied] = useState(false);

  const { overallSummary, results } = evaluation;

  const filteredResults = results.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleCopyNegotiation = (ruleId: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRuleId(ruleId);
      setTimeout(() => setCopiedRuleId(null), 2500);
    }
  };

  const handleShareLink = () => {
    const hash = encodeAnswersToShareHash(answers);
    const url = `${window.location.origin}${window.location.pathname}#share=${hash}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const toggleVerbatim = (ruleId: string) => {
    setExpandedVerbatimIds((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Legal Disclaimer Notice (Principle) */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-950 leading-relaxed">
          <div className="font-extrabold text-amber-900 text-base mb-0.5">
            {evaluation.disclaimer}
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90">
            ระบบเทียบเคียงเงื่อนไขในสัญญาของคุณกับตัวบทที่ประกาศในราชกิจจานุเบกษา
            เพื่อให้ทราบจุดที่อาจเสียเปรียบหรือขัดกฎหมายก่อนลงนาม
            หากต้องการคำปรึกษาทางคดี โปรดติดต่อสายด่วน สคบ. 1166 หรือทนายความ
          </p>
        </div>
      </div>

      {/* Header and Summary Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>ข้อมูลกฎหมายมีผลใช้บังคับ: {evaluation.effectiveDateDisplay}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              ผลการตรวจสัญญา
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {evaluation.packTitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareLink}
              className="inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition text-slate-700 shadow-sm"
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>แชร์ผลตรวจ</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onEditAnswers}
              className="inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>แก้ไขคำตอบ</span>
            </button>
          </div>
        </div>

        {/* Questionnaire ended early by a pack-declared answer */}
        {evaluation.endedEarly && (
          <div
            role="status"
            className="rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:p-5 flex items-start gap-3"
          >
            <HelpCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm text-slate-800 leading-relaxed">
              <div className="font-bold text-slate-900">
                ระบบหยุดถามเพราะตรวจตามเกณฑ์นี้ไม่ได้ ทุกข้อจึงเป็น &quot;บอกไม่ได้&quot;
              </div>
              <div className="text-xs text-slate-600">
                คำถาม: {evaluation.endedEarly.questionText}
                <br />
                คำตอบของคุณ: {evaluation.endedEarly.answerLabel}
              </div>
              <p>{evaluation.endedEarly.reason}</p>
            </div>
          </div>
        )}

        {/* Counters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Violated */}
          <div
            onClick={() => setFilter(filter === 'violated' ? 'all' : 'violated')}
            className={`cursor-pointer rounded-2xl p-5 border transition ${
              filter === 'violated'
                ? 'ring-2 ring-red-500 border-red-300 bg-red-50/80'
                : overallSummary.violatedCount > 0
                ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">ขัดกฎหมาย</span>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-600 mt-2">
              {overallSummary.violatedCount} <span className="text-sm font-normal text-slate-600">ข้อ</span>
            </div>
            <div className="text-xs text-red-700/80 mt-1">
              {overallSummary.violatedCount > 0 ? 'ควรเจรจาขอตัดออกหรือปรับแก้' : 'ไม่พบข้อสัญญาที่ขัด'}
            </div>
          </div>

          {/* Compliant */}
          <div
            onClick={() => setFilter(filter === 'compliant' ? 'all' : 'compliant')}
            className={`cursor-pointer rounded-2xl p-5 border transition ${
              filter === 'compliant'
                ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/80'
                : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">ไม่ขัดกฎหมาย</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2">
              {overallSummary.compliantCount} <span className="text-sm font-normal text-slate-600">ข้อ</span>
            </div>
            <div className="text-xs text-emerald-700/80 mt-1">
              ตรงตามมาตรฐานประกาศ สคบ.
            </div>
          </div>

          {/* Undetermined */}
          <div
            onClick={() => setFilter(filter === 'undetermined' ? 'all' : 'undetermined')}
            className={`cursor-pointer rounded-2xl p-5 border transition ${
              filter === 'undetermined'
                ? 'ring-2 ring-slate-500 border-slate-300 bg-slate-100'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">บอกไม่ได้ / ไม่แน่ใจ</span>
              <HelpCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-slate-700 mt-2">
              {overallSummary.undeterminedCount} <span className="text-sm font-normal text-slate-600">ข้อ</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ข้อมูลไม่เพียงพอ หรือไม่ได้ระบุ
            </div>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto text-xs font-semibold">
          <span className="text-slate-400 shrink-0">กรองดู:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({results.length})
          </button>
          <button
            onClick={() => setFilter('violated')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filter === 'violated'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            ขัดกฎหมาย ({overallSummary.violatedCount})
          </button>
          <button
            onClick={() => setFilter('compliant')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filter === 'compliant'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            ไม่ขัด ({overallSummary.compliantCount})
          </button>
          <button
            onClick={() => setFilter('undetermined')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filter === 'undetermined'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            บอกไม่ได้ ({overallSummary.undeterminedCount})
          </button>
        </div>
      </div>

      {/* Rule Results List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>รายการข้อสัญญาที่ตรวจสอบ</span>
          <span className="text-xs font-normal text-slate-500">({filteredResults.length} ข้อ)</span>
        </h2>

        {filteredResults.map((item) => {
          const isCopied = copiedRuleId === item.ruleId;
          const isVerbatimOpen = !!expandedVerbatimIds[item.ruleId];

          return (
            <div
              key={item.ruleId}
              className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                item.status === 'violated'
                  ? 'border-red-200 hover:border-red-300'
                  : item.status === 'compliant'
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Status and Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.status === 'violated' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-full border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>ขัดกฎหมาย</span>
                      </span>
                    )}
                    {item.status === 'compliant' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ไม่ขัดกฎหมาย</span>
                      </span>
                    )}
                    {item.status === 'undetermined' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>บอกไม่ได้ / ข้อมูลไม่พอ</span>
                      </span>
                    )}
                    <h3 className="font-bold text-base text-slate-900">
                      {item.title}
                    </h3>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    {item.legalRef.clause}
                  </span>
                </div>

                {/* Plain Thai Reason */}
                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span className="font-semibold text-slate-900">ผลการวิเคราะห์: </span>
                  {item.reason}
                </div>

                {/* Polite Negotiation Box (if Violated or custom text available) */}
                {item.status === 'violated' && item.politeNegotiationText && (
                  <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>ข้อความสุภาพสำหรับคัดลอกไปคุยกับผู้ให้เช่า:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNegotiation(item.ruleId, item.politeNegotiationText)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium text-xs shadow-sm"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>คัดลอกแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอกข้อความ</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-950 bg-white/80 p-3 rounded-lg border border-blue-100 select-all leading-relaxed">
                      "{item.politeNegotiationText}"
                    </p>
                  </div>
                )}

                {/* Collapsible Verbatim Legal Text */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleVerbatim(item.ruleId)}
                    className="w-full text-left text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center justify-between py-1 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isVerbatimOpen ? 'ซ่อนตัวบทกฎหมายจริง' : 'เปิดดูข้อความตัวบทจริงจากราชกิจจานุเบกษา'}</span>
                    </div>
                    {isVerbatimOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isVerbatimOpen && (
                    <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 leading-relaxed font-mono">
                      <div className="text-amber-400 font-sans font-bold flex items-center justify-between">
                        <span>{item.legalRef.clause}</span>
                        <a
                          href={item.legalRef.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 font-sans"
                        >
                          <span>เปิดดูเอกสารทางการ (PDF)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="italic text-slate-300">
                        "{item.legalRef.verbatim}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Help Channels & Complaints */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
          <span>ช่องทางติดต่อและร้องเรียนทางการ (ยืนยันแล้ว)</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          หากเจรจาแล้วผู้ให้เช่ายังยืนยันจะใช้สัญญาที่ขัดต่อกฎหมาย หรือถูกเอาเปรียบ สามารถขอความช่วยเหลือได้จากหน่วยงานภาครัฐ:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {evaluation.helpChannels.map((channel, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">{channel.name}</div>
                {channel.description && (
                  <p className="text-xs text-slate-500 mt-1">{channel.description}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {channel.tel && (
                  <a
                    href={`tel:${channel.tel.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    <span>โทร {channel.tel}</span>
                  </a>
                )}
                {channel.url && (
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 transition"
                  >
                    <span>เปิดเว็บไซต์ร้องเรียน</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe Sharing Details Box */}
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-xs flex items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-800">ความเป็นส่วนตัวในการแชร์:</span> ลิงก์แชร์ผลตรวจจะเข้ารหัสเฉพาะรหัสคำตอบใน URL ไม่มีชื่อ เบอร์โทร หรือที่อยู่ของคุณ
        </div>
        <button
          type="button"
          onClick={handleShareLink}
          className="shrink-0 text-blue-600 hover:text-blue-800 font-bold hover:underline"
        >
          {shareCopied ? 'คัดลอกสำเร็จ' : 'คัดลอกลิงก์'}
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>เริ่มตรวจสัญญาฉบับใหม่</span>
        </button>
      </div>
    </div>
  );
}

