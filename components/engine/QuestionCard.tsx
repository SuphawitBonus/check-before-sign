import React, { useEffect, useRef } from 'react';
import { Question } from '../../lib/engine/types';
import { toArabicDigits } from '../../lib/format';
import { Check, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
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

const optionClass = (selected: boolean) =>
  `flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
    selected ? 'border-2 border-primary bg-primary-soft p-[15px]' : 'border-line-strong bg-surface hover:bg-paper'
  }`;

export default function QuestionCard({ question, value, onChange, onNext, onPrev, isFirst, isLast }: QuestionCardProps) {
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
    <div className="card space-y-6 p-5 sm:p-8" data-question-card>
      <div className="space-y-3">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          // Not a control: focus is moved here for screen readers only, so no ring (DESIGN.md §4 exception).
          // `pretty`, not `balance`: balancing long Thai questions splits compounds like "การ|เช่า".
          className="font-display text-[21px] font-bold leading-[1.45] text-ink [text-wrap:pretty] focus-visible:outline-none sm:text-[26px]"
        >
          {toArabicDigits(question.text)}
        </h2>

        {/* The legal background of the question stays one click away instead of always on screen. */}
        {question.helpText && (
          <details className="group" data-question-help>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full text-sm font-medium text-primary">
              ดูตัวบท
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">{toArabicDigits(question.helpText)}</p>
          </details>
        )}
      </div>

      <div className="space-y-2.5" role="group" aria-labelledby={headingId}>
        {question.type === 'choice' &&
          question.options?.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(opt.value)}
                className={optionClass(isSelected)}
                data-option
              >
                <RadioDot selected={isSelected} />
                <span>
                  <span className="block font-semibold text-ink">{toArabicDigits(opt.label)}</span>
                  {/* Legal explanation only for the chosen answer. */}
                  {isSelected && opt.helpText && (
                    <span className="mt-1 block text-sm leading-relaxed text-ink-2" data-option-help>
                      {toArabicDigits(opt.helpText)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

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
          <button type="button" aria-pressed={isUnsure} onClick={() => onChange('__unsure__')} className={optionClass(isUnsure)} data-option>
            <RadioDot selected={isUnsure} />
            <span className={`font-medium ${isUnsure ? 'text-ink' : 'text-ink-2'}`}>
              {question.unsureLabel || 'ไม่แน่ใจ / ในสัญญาไม่ได้ระบุข้อนี้ไว้'}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
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
