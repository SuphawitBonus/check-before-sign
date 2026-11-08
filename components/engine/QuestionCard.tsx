import React from 'react';
import { Question } from '../../lib/engine/types';
import { HelpCircle, Check } from 'lucide-react';

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

  const handleSelectOption = (optVal: string) => {
    onChange(optVal);
  };

  const handleSelectUnsure = () => {
    onChange('__unsure__');
  };

  const isAnswered = value !== undefined && value !== null && value !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
        <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-700 font-semibold">
          ข้อที่ {currentIndex + 1} จาก {totalQuestions}
        </span>
        {question.isScopeQuestion && (
          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            คำถามตรวจขอบเขตกฎหมาย
          </span>
        )}
      </div>

      {/* Question Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-2">
        {question.text}
      </h2>

      {/* Help text */}
      {question.helpText && (
        <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200/60 rounded-xl p-3 mb-6 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>{question.helpText}</span>
        </div>
      )}

      {/* Input controls based on type */}
      <div className="space-y-3 my-6">
        {question.type === 'choice' && question.options && (
          <div className="grid grid-cols-1 gap-2.5">
            {question.options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={`text-left p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {opt.label}
                    </div>
                    {opt.helpText && (
                      <div className="text-xs text-slate-500 mt-1">
                        {opt.helpText}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'number' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
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
                className={`w-40 text-lg font-bold px-4 py-2.5 rounded-xl border ${
                  isUnsure ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {question.unit && (
                <span className="text-base font-medium text-slate-700">
                  {question.unit}
                </span>
              )}
            </div>

            {/* Quick value buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">เลือกด่วน:</span>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`px-3 py-1 rounded-lg border font-medium ${
                    value === num && !isUnsure
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {num} {question.unit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unsure option button */}
        {question.allowUnsure && (
          <button
            type="button"
            onClick={handleSelectUnsure}
            className={`w-full mt-2 text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between ${
              isUnsure
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-dashed border-slate-300 text-slate-600 hover:bg-slate-100/70 hover:border-slate-400'
            }`}
          >
            <span>{question.unsureLabel || 'ไม่แน่ใจ / ในสัญญาไม่ได้ระบุข้อนี้ไว้'}</span>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                isUnsure ? 'border-white bg-white text-slate-900' : 'border-slate-400'
              }`}
            >
              {isUnsure && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            isFirst
              ? 'opacity-0 pointer-events-none'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          ← ย้อนกลับ
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isAnswered}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
            isAnswered
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{isLast ? 'ดูผลการตรวจสัญญา' : 'ข้อถัดไป'}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
