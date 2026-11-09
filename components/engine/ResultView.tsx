'use client';

import React, { useState } from 'react';
import { EvaluationOutput, RuleStatus } from '../../lib/engine/types';
import {
  Copy,
  Check,
  Share2,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  Scale,
  Phone,
  PencilLine,
} from 'lucide-react';
import { encodeAnswersToShareHash } from '../../lib/engine/sharing';
import { toArabicDigits } from '../../lib/format';
import { VERDICT, VERDICT_ORDER, VerdictChip } from '../Verdict';

interface ResultViewProps {
  evaluation: EvaluationOutput;
  answers: Record<string, any>;
  onEditAnswers: () => void;
  onEditQuestion?: (questionId: string) => void;
  onReset: () => void;
}

const COUNT_KEY: Record<RuleStatus, 'violatedCount' | 'compliantCount' | 'undeterminedCount'> = {
  violated: 'violatedCount',
  compliant: 'compliantCount',
  undetermined: 'undeterminedCount',
};

/**
 * "แบบ ก: ข้อ ๖.๑(๒) | แบบ ข: ข้อ ๖.๒(๒)" → one line per contract form, Arabic digits,
 * clause numbers in mono (Thai words stay in the body font — the mono face has no Thai glyphs).
 */
function ClauseRef({ clause }: { clause: string }) {
  const parts = toArabicDigits(clause).split(' | ');
  return (
    <span className="text-meta text-ink-2">
      {parts.map((p, i) => (
        <span key={i} className="block">
          {p.split(/(\d[\d.()]*)/).map((seg, j) =>
            /^\d/.test(seg) ? (
              <span key={j} className="font-mono font-medium text-ink">
                {seg}
              </span>
            ) : (
              seg
            )
          )}
        </span>
      ))}
    </span>
  );
}

export default function ResultView({
  evaluation,
  answers,
  onEditAnswers,
  onEditQuestion,
  onReset,
}: ResultViewProps) {
  const [filter, setFilter] = useState<'all' | RuleStatus>('all');
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);
  const [expandedVerbatimIds, setExpandedVerbatimIds] = useState<Record<string, boolean>>({});
  const [shareCopied, setShareCopied] = useState(false);

  const { overallSummary, results } = evaluation;

  // Display order only: violated first, then undetermined, then compliant (stable within a group).
  const sortedResults = VERDICT_ORDER.flatMap((s) => results.filter((r) => r.status === s));
  const filteredResults = sortedResults.filter((r) => filter === 'all' || r.status === filter);

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
    setExpandedVerbatimIds((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-4">
      {/* Title row */}
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink-3">{evaluation.packTitle}</p>
            <h1 className="font-display text-[28px] font-bold leading-tight sm:text-[36px]">ผลการตรวจสัญญา</h1>
            <p className="max-w-prose pt-1 text-sm text-ink-3">
              เกณฑ์ที่ใช้: {toArabicDigits(evaluation.effectiveDateDisplay)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={handleShareLink} className="btn-secondary whitespace-nowrap">
              {shareCopied ? (
                <>
                  <Check className="h-4 w-4 text-compliant-fg" aria-hidden="true" />
                  <span>คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  <span>แชร์ผลตรวจ</span>
                </>
              )}
            </button>
            <button type="button" onClick={onEditAnswers} className="btn-primary whitespace-nowrap">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>แก้ไขคำตอบ</span>
            </button>
          </div>
        </div>

        <p className="flex items-start gap-2.5 rounded-xl border border-line bg-sunk/60 px-4 py-3 text-sm leading-relaxed text-ink-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-ink">{evaluation.disclaimer}</strong> ผลนี้มาจากคำตอบที่คุณเลือก
            ไม่ได้อ่านสัญญาจริง ถ้าต้องการคำปรึกษาทางคดี โทรสายด่วน สคบ. 1166 หรือปรึกษาทนายความ
          </span>
        </p>
      </header>

      {/* Questionnaire ended early by a pack-declared answer */}
      {evaluation.endedEarly && (
        <section
          role="status"
          aria-labelledby="ended-early-title"
          className="rounded-2xl border border-undetermined-line bg-undetermined-bg p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <VERDICT.undetermined.Icon className="mt-1 h-6 w-6 shrink-0 text-undetermined-fg" aria-hidden="true" />
            <div className="min-w-0 space-y-3">
              <h2 id="ended-early-title" className="font-display text-lg font-bold leading-snug text-ink sm:text-xl">
                ระบบหยุดถามเพราะตรวจตามเกณฑ์นี้ไม่ได้ ทุกข้อจึงเป็น &quot;บอกไม่ได้&quot;
              </h2>
              <dl className="grid gap-1 text-sm text-ink-2 sm:grid-cols-[auto_1fr] sm:gap-x-3">
                <dt className="font-semibold text-ink">คำถาม</dt>
                <dd>{toArabicDigits(evaluation.endedEarly.questionText)}</dd>
                <dt className="font-semibold text-ink">คำตอบของคุณ</dt>
                <dd>{toArabicDigits(evaluation.endedEarly.answerLabel)}</dd>
              </dl>
              <p className="max-w-prose leading-relaxed text-ink">{toArabicDigits(evaluation.endedEarly.reason)}</p>
              {onEditQuestion && (
                <button
                  type="button"
                  onClick={() => onEditQuestion(evaluation.endedEarly!.questionId)}
                  className="btn-secondary"
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  แก้คำตอบข้อนี้
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Summary counters — also act as filters */}
      <section aria-labelledby="summary-title" className="space-y-3">
        <h2 id="summary-title" className="sr-only">
          สรุปผล
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {(['violated', 'compliant', 'undetermined'] as RuleStatus[]).map((status) => {
            const v = VERDICT[status];
            const count = overallSummary[COUNT_KEY[status]];
            const active = filter === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(active ? 'all' : status)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors sm:p-5 ${
                  active ? `${v.soft} border-2 p-[11px] sm:p-[19px]` : 'border-line bg-surface hover:bg-paper'
                }`}
              >
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${v.text}`}>
                  <v.Icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2.25} />
                  {v.label}
                </span>
                <span className="font-mono text-3xl font-medium text-ink sm:text-4xl">
                  {count}
                  <span className="ml-1 font-sans text-sm font-normal text-ink-3">ข้อ</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
          <span>
            ตรวจทั้งหมด <span className="font-mono text-ink">{overallSummary.totalEvaluated}</span> ข้อ · กดตัวเลขเพื่อกรอง
          </span>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="rounded-full font-semibold text-primary underline decoration-primary/40 hover:decoration-primary"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>
      </section>

      {/* Rule Results List */}
      <section aria-labelledby="results-title" className="space-y-4">
        <h2 id="results-title" className="font-display text-xl font-bold">
          {filter === 'all' ? (
            <>
              <span className="inline-block">รายการที่ตรวจ</span>{' '}
              <span className="inline-block">— ข้อที่ขัดอยู่บนสุด</span>
            </>
          ) : (
            `เฉพาะข้อที่ ${VERDICT[filter].label}`
          )}
          <span className="ml-2 font-sans text-sm font-normal text-ink-3">({filteredResults.length} ข้อ)</span>
        </h2>

        <ul className="space-y-4">
          {filteredResults.map((item) => {
            const isCopied = copiedRuleId === item.ruleId;
            const isVerbatimOpen = !!expandedVerbatimIds[item.ruleId];
            const negotiation = toArabicDigits(item.politeNegotiationText || '');
            const verbatimId = `verbatim-${item.ruleId}`;

            return (
              <li
                key={item.ruleId}
                data-status={item.status}
                className={`overflow-hidden rounded-2xl border border-l-4 border-line bg-surface ${VERDICT[item.status].edge}`}
              >
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-6">
                    <VerdictChip status={item.status} size="sm" />
                    <span className="sm:text-right">
                      <ClauseRef clause={item.legalRef.clause} />
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold leading-snug text-ink">{toArabicDigits(item.title)}</h3>

                  <div className="rounded-xl bg-sunk p-4 text-[15px] leading-relaxed text-ink">
                    <span className="font-semibold">ทำไมได้ผลนี้: </span>
                    {toArabicDigits(item.reason)}
                  </div>

                  {item.status === 'violated' && negotiation && (
                    <div className="space-y-3 rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                          <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                          ข้อความสุภาพสำหรับคุยกับผู้ให้เช่า
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyNegotiation(item.ruleId, negotiation)}
                          className="btn-secondary min-h-[36px] px-3.5 py-1.5 text-sm"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 text-compliant-fg" aria-hidden="true" />
                              <span>คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" aria-hidden="true" />
                              <span>คัดลอกข้อความ</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="select-all text-[15px] leading-relaxed text-ink-2">&ldquo;{negotiation}&rdquo;</p>
                    </div>
                  )}

                  <div className="border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => toggleVerbatim(item.ruleId)}
                      aria-expanded={isVerbatimOpen}
                      aria-controls={verbatimId}
                      className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left text-sm font-medium text-ink-2 hover:text-ink"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Scale className="h-4 w-4" aria-hidden="true" />
                        {isVerbatimOpen ? 'ซ่อนตัวบท' : 'อ่านตัวบทจากราชกิจจานุเบกษา'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isVerbatimOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {isVerbatimOpen && (
                      <div id={verbatimId} className="mt-3 space-y-3 rounded-xl border border-line bg-paper p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <ClauseRef clause={item.legalRef.clause} />
                          <a
                            href={item.legalRef.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline decoration-primary/40 hover:decoration-primary"
                          >
                            เปิดเอกสารทางการ
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">(เปิดในแท็บใหม่)</span>
                          </a>
                        </div>
                        <blockquote className="border-l-2 border-line-strong pl-3 text-[15px] leading-relaxed text-ink">
                          {toArabicDigits(item.legalRef.verbatim)}
                        </blockquote>
                        <p className="text-meta text-ink-3">แสดงเลขไทยในตัวบทเป็นเลขอารบิก ถ้อยคำอื่นตรงตามต้นฉบับ</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Official Help Channels & Complaints */}
      <section aria-labelledby="help-title" className="card space-y-4 p-6 sm:p-8">
        <h2 id="help-title" className="font-display text-xl font-bold">
          ถ้าเจรจาแล้วไม่ได้ผล
        </h2>
        <p className="max-w-prose text-ink-2">
          ถ้าผู้ให้เช่ายังยืนยันจะใช้ข้อสัญญาที่ขัดกับประกาศ ขอความช่วยเหลือได้จากหน่วยงานเหล่านี้
        </p>
        <ul className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          {evaluation.helpChannels.map((channel, i) => (
            <li key={i} className="flex flex-col justify-between rounded-xl border border-line bg-paper p-5">
              <div>
                <div className="font-semibold text-ink">{channel.name}</div>
                {channel.description && <p className="mt-1 text-sm text-ink-2">{channel.description}</p>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {channel.tel && (
                  <a href={`tel:${channel.tel.replace(/[^0-9]/g, '')}`} className="btn-primary min-h-[40px] px-4 py-2 text-sm">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span>
                      โทร <span className="font-mono">{channel.tel}</span>
                    </span>
                  </a>
                )}
                {channel.url && (
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary min-h-[40px] px-4 py-2 text-sm"
                  >
                    <span>เว็บไซต์ร้องเรียน</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(เปิดในแท็บใหม่)</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Safe sharing note + reset */}
      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-sm text-ink-2">
          <span className="font-semibold text-ink">ลิงก์แชร์เก็บอะไรบ้าง:</span> เฉพาะรหัสตัวเลือกที่คุณตอบ ไว้หลังเครื่องหมาย #
          ไม่มีชื่อ เบอร์โทร หรือที่อยู่ และไม่ถูกส่งไปเซิร์ฟเวอร์
        </p>
        <button type="button" onClick={onReset} className="btn-secondary shrink-0">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>เริ่มตรวจสัญญาฉบับใหม่</span>
        </button>
      </div>
    </div>
  );
}
