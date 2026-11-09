import { OctagonX, CircleCheck, CircleHelp, type LucideIcon } from 'lucide-react';
import type { RuleStatus } from '../lib/engine/types';

/**
 * The single source of truth for how a verdict looks (DESIGN.md §1).
 * Every verdict is shown with icon + word + colour — never colour alone.
 */
export const VERDICT: Record<
  RuleStatus,
  { label: string; meaning: string; Icon: LucideIcon; chip: string; solid: string; text: string; soft: string; edge: string }
> = {
  violated: {
    label: 'ขัด',
    meaning: 'ข้อสัญญาตามที่คุณตอบ ขัดกับประกาศ',
    Icon: OctagonX,
    chip: 'bg-violated-bg text-violated-fg border-violated-line',
    solid: 'bg-violated-solid text-white border-violated-solid',
    text: 'text-violated-fg',
    soft: 'bg-violated-bg border-violated-line',
    edge: 'border-l-violated-solid',
  },
  compliant: {
    label: 'ไม่ขัด',
    meaning: 'ตามที่คุณตอบ ข้อนี้เป็นไปตามประกาศ',
    Icon: CircleCheck,
    chip: 'bg-compliant-bg text-compliant-fg border-compliant-line',
    solid: 'bg-compliant-solid text-white border-compliant-solid',
    text: 'text-compliant-fg',
    soft: 'bg-compliant-bg border-compliant-line',
    edge: 'border-l-compliant-solid',
  },
  undetermined: {
    label: 'บอกไม่ได้',
    meaning: 'ข้อมูลไม่พอ หรืออยู่นอกเกณฑ์ที่ระบบตรวจได้ ระบบไม่เดา',
    Icon: CircleHelp,
    chip: 'bg-undetermined-bg text-undetermined-fg border-undetermined-line',
    solid: 'bg-undetermined-solid text-white border-undetermined-solid',
    text: 'text-undetermined-fg',
    soft: 'bg-undetermined-bg border-undetermined-line',
    edge: 'border-l-undetermined-solid',
  },
};

export const VERDICT_ORDER: RuleStatus[] = ['violated', 'undetermined', 'compliant'];

export function VerdictChip({ status, size = 'md' }: { status: RuleStatus; size?: 'sm' | 'md' }) {
  const v = VERDICT[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${v.chip} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-meta' : 'px-3 py-1 text-sm'
      }`}
    >
      <v.Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" strokeWidth={2.25} />
      <span>{v.label}</span>
    </span>
  );
}
