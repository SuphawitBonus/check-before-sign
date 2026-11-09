import React, { useEffect, useRef } from 'react';
import { Question } from '../../lib/engine/types';
import { toArabicDigits } from '../../lib/format';
import { Info, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  value: any;
  onChange: (val: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? 'border-primary bg-primary text-white' : 'border-line-strong bg-surface'
      }`}
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3.5} />}
    </span>
  );
}

export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  value,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: QuestionCardProps) {
  const isUnsure = value === '__unsure__';
  const isAnswered = value !== undefined && value !== null && value !== '';
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move keyboard / screen-reader focus to the new question when the step changes
  // (skipped on first render so the page does not jump on load).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [question.id]);

  const headingId = `q-${question.id}`;

  return (
    <div className="card p-5 sm:p-8" data-question-card>
      {/* Step Indicator */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-sunk px-3 py-1 text-meta font-semibold text-ink-2">
          ข้อที่ {currentIndex + 1} จาก {totalQuestions}
        </span>
        {question.isScopeQuestion && (
          <span className="whitespace-nowrap rounded-full border border-line-strong px-3 py-0.5 text-meta font-medium text-ink-2">
            คำถามตรวจขอบเขตกฎหมาย
          </span>
        )}
      </div>

      {/* Question Title */}
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        // Not a control: focus is moved here for screen readers only, so no ring (DESIGN.md §4 exception).
        // `pretty`, not `balance`: balancing long Thai questions splits compounds like "การ|เช่า".
        className="mb-3 font-display text-[21px] font-bold leading-[1.45] text-ink [text-wrap:pretty] focus-visible:outline-none sm:text-[26px]"
      >
        {toArabicDigits(question.text)}
      </h2>

      {question.helpText && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-sunk p-3.5 text-sm leading-relaxed text-ink-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>{toArabicDigits(question.helpText)}</p>
        </div>
      )}

      {/* Input controls based on type */}
      <div className="my-6 space-y-3" role="group" aria-labelledby={headingId}>
        {question.type === 'choice' && question.options && (
          <div className="grid grid-cols-1 gap-2.5" data-options>
            {question.options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange(opt.value)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-2 border-primary bg-primary-soft p-[15px]'
                      : 'border-line-strong bg-surface hover:bg-paper'
                  }`}
                >
                  <RadioDot selected={isSelected} />
                  <span>
                    <span className="block font-semibold text-ink">{toArabicDigits(opt.label)}</span>
                    {opt.helpText && (
                      <span className="mt-1 block text-sm leading-relaxed text-ink-2">{toArabicDigits(opt.helpText)}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'number' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label htmlFor={`${headingId}-input`} className="sr-only">
                {toArabicDigits(question.text)}
              </label>
              <input
                id={`${headingId}-input`}
                type="number"
                inputMode="decimal"
                min={question.min ?? 0}
                max={question.max ?? 100}
                step={question.step ?? 1}
                value={isUnsure ? '' : (value ?? '')}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  onChange(val);
                }}
                disabled={isUnsure}
                placeholder="ระบุตัวเลข"
                className={`w-40 rounded-xl border px-4 py-2.5 font-mono text-lg font-medium ${
                  isUnsure ? 'border-line bg-sunk text-ink-3' : 'border-line-strong bg-surface text-ink'
                }`}
              />
              {question.unit && <span className="text-base font-medium text-ink-2">{question.unit}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-3">เลือกด่วน:</span>
              {[1, 2, 3].map((num) => {
                const on = value === num && !isUnsure;
                return (
                  <button
                    key={num}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(num)}
                    className={`min-h-[40px] rounded-full border px-4 font-medium ${
                      on ? 'border-primary bg-primary text-white' : 'border-line-strong bg-surface text-ink hover:bg-paper'
                    }`}
                  >
                    {num} {question.unit}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {question.allowUnsure && (
          <button
            type="button"
            aria-pressed={isUnsure}
            onClick={() => onChange('__unsure__')}
            className={`mt-2 flex w-full items-start gap-3 rounded-xl border border-dashed p-4 text-left transition-colors ${
              isUnsure
                ? 'border-2 border-solid border-primary bg-primary-soft p-[15px]'
                : 'border-line-strong text-ink-2 hover:bg-paper'
            }`}
          >
            <RadioDot selected={isUnsure} />
            <span className={`font-medium ${isUnsure ? 'text-ink' : ''}`}>
              {question.unsureLabel || 'ไม่แน่ใจ / ในสัญญาไม่ได้ระบุข้อนี้ไว้'}
            </span>
          </button>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={`btn px-3 text-ink-2 hover:bg-sunk hover:text-ink ${isFirst ? 'invisible' : ''}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>ย้อนกลับ</span>
        </button>

        <button type="button" onClick={onNext} disabled={!isAnswered} className={isAnswered ? 'btn-primary' : 'btn-disabled'}>
          <span>{isLast ? 'ดูผลการตรวจสัญญา' : 'ข้อถัดไป'}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
