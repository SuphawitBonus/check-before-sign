import {
  PackRules,
  ScopeEvaluator,
  RuleEvaluator,
  RuleEvalOutput,
  PackDefinition,
  QuestionnaireEnd,
} from '../../lib/engine/types';
import { getQuestionnaireEnd } from '../../lib/engine/evaluator';
import rentalPackJson from './pack.json';

/**
 * Rental pack — deterministic evaluators for the OCPB contract-control notice B.E. 2568
 * (Royal Gazette vol. 142, special part 211 ง, pp. 80–84, announced 6 Jun 2568).
 *
 * Clause numbering: "6.1(n)" = standard form A (short-term, ≤ 3 years);
 * "6.2(m)" = standard form B (long-term, > 3 years up to 30 years). See docs/packs/rental.md.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UNSURE = '__unsure__';

/** Parse a numeric answer. Returns null for missing / unsure / non-numeric / negative values. */
export function toNum(value: unknown): number | null {
  if (value === undefined || value === null || value === '' || value === UNSURE) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isUnsure(value: unknown): boolean {
  return value === undefined || value === null || value === '' || value === UNSURE;
}

/**
 * The gate texts live in pack.json (q_contract_date → `endsQuestionnaire` /
 * `unsureEndsQuestionnaire`), which is also what makes the engine stop the
 * questionnaire early. Reading them from there keeps one source of truth.
 */
const CONTRACT_DATE_QUESTION = (rentalPackJson as PackDefinition).questions.find(
  (q) => q.id === 'q_contract_date'
);
if (!CONTRACT_DATE_QUESTION?.unsureEndsQuestionnaire) {
  throw new Error('rental pack.json: q_contract_date must declare unsureEndsQuestionnaire');
}
const UNKNOWN_DATE_END: QuestionnaireEnd = CONTRACT_DATE_QUESTION.unsureEndsQuestionnaire;

/**
 * Applicability gate: the 2568 notice only governs contracts made on/after its effective date.
 * Returns an "undetermined" result when it cannot be established that the notice applies.
 * Any answer other than `on_or_after_effective` (including missing / unknown values) is gated.
 */
export function applicabilityGate(answers: Record<string, any>, detailed = false): RuleEvalOutput | null {
  const d = answers.q_contract_date;
  if (d === 'on_or_after_effective') return null;

  const end = getQuestionnaireEnd(CONTRACT_DATE_QUESTION!, d)?.end ?? UNKNOWN_DATE_END;
  return {
    status: 'undetermined',
    reason: detailed ? end.reason : end.ruleReason ?? end.reason,
  };
}

/** Wrap a rule so the applicability gate runs first. */
function gated(evaluator: RuleEvaluator): RuleEvaluator {
  return (answers) => applicabilityGate(answers) ?? evaluator(answers);
}

/**
 * Standard yes/no "prohibited clause" rule: has_clause → violated, no_clause → compliant,
 * anything else → undetermined.
 */
function prohibitedClauseRule(
  questionId: string,
  texts: { violated: string; compliant: string; undetermined: string }
): RuleEvaluator {
  return gated((answers) => {
    const v = answers[questionId];
    if (v === 'has_clause') return { status: 'violated', reason: texts.violated };
    if (v === 'no_clause') return { status: 'compliant', reason: texts.compliant };
    return { status: 'undetermined', reason: texts.undetermined };
  });
}

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

const SCOPE_CAVEAT =
  ' (ผลนี้เป็นไปตามนิยามในประกาศ พ.ศ. 2568 หากสัญญาทำก่อน 4 กันยายน 2568 ให้ใช้ประกาศ พ.ศ. 2562 ซึ่งระบบนี้ยังไม่ได้ตรวจ)';

export const evaluateRentalScope: ScopeEvaluator = (answers) => {
  const scopeAns = answers.q_scope;

  if (scopeAns === 'in_scope') {
    return {
      inScope: true,
      reason: 'อยู่ในขอบเขตตามข้อ 4 ของประกาศ พ.ศ. 2568 (ผู้เช่าเป็นบุคคลธรรมดา เช่าอาคารเพื่ออยู่อาศัย และผู้ให้เช่ามีสถานที่ให้เช่าตั้งแต่ 3 หน่วยขึ้นไป)',
    };
  }

  if (scopeAns === 'out_dorm_act') {
    return {
      inScope: false,
      reason: 'หอพักตามกฎหมายว่าด้วยหอพัก ไม่อยู่ในนิยาม "อาคาร" ของข้อ 4 ประกาศ พ.ศ. 2568' + SCOPE_CAVEAT,
    };
  }

  if (scopeAns === 'out_hotel') {
    return {
      inScope: false,
      reason: 'โรงแรมตามกฎหมายว่าด้วยโรงแรม ไม่อยู่ในนิยาม "อาคาร" ของข้อ 4 ประกาศ พ.ศ. 2568' + SCOPE_CAVEAT,
    };
  }

  if (scopeAns === 'out_few_units') {
    return {
      inScope: false,
      reason: 'ผู้ให้เช่ามีสถานที่ให้เช่าเพียง 1–2 หลัง/ห้อง ต่ำกว่าเกณฑ์ "ตั้งแต่สามหน่วยขึ้นไป" ในข้อ 4 ประกาศ พ.ศ. 2568' + SCOPE_CAVEAT,
    };
  }

  if (scopeAns === 'out_commercial') {
    return {
      inScope: false,
      reason: 'การเช่าเพื่อทำร้านค้า ออฟฟิศ หรือประกอบธุรกิจ หรือผู้เช่าที่เป็นนิติบุคคล ไม่อยู่ในขอบเขต เพราะข้อ 4 ประกาศ พ.ศ. 2568 คุ้มครองผู้เช่าที่เป็นบุคคลธรรมดาซึ่งเช่าเพื่ออยู่อาศัย' + SCOPE_CAVEAT,
    };
  }

  return {
    inScope: 'undetermined',
    reason: 'ข้อมูลไม่เพียงพอ หรือผู้ใช้ระบุไม่แน่ใจเกี่ยวกับลักษณะที่พักและจำนวนห้องของผู้ให้เช่า',
  };
};

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** Deposit + advance-rent cap. Unit of q_deposit / q_advance_rent is "งวด" (1 month or 1 year, per rent basis). */
function depositCap(form: unknown): { cap: number; unit: 'เดือน' | 'ปี'; clause: string } | null {
  if (form === 'short_monthly') return { cap: 3, unit: 'เดือน', clause: 'ข้อ 6.1(2)' };
  if (form === 'long_monthly') return { cap: 3, unit: 'เดือน', clause: 'ข้อ 6.2(2)' };
  if (form === 'long_annual') return { cap: 1, unit: 'ปี', clause: 'ข้อ 6.2(3)' };
  return null; // short_annual (no cap stated in 6.1) or unknown
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export const rules: Record<string, RuleEvaluator> = {
  rule_rental_scope: (answers): RuleEvalOutput => {
    const gate = applicabilityGate(answers, true);
    if (gate) return gate;

    const scopeAns = answers.q_scope;
    if (scopeAns === 'in_scope') {
      return {
        status: 'compliant',
        reason: 'สัญญาอยู่ในขอบเขตของประกาศ พ.ศ. 2568 และทำหลังวันที่ประกาศมีผลใช้บังคับ',
      };
    }
    if (isUnsure(scopeAns)) {
      return {
        status: 'undetermined',
        reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือไม่ได้ระบุประเภทที่พักและจำนวนห้องของผู้ให้เช่า',
      };
    }
    return {
      status: 'violated',
      reason: 'สัญญาไม่อยู่ในขอบเขตของประกาศ สคบ. พ.ศ. 2568 เรื่องธุรกิจการให้เช่าอาคารเพื่ออยู่อาศัย',
    };
  },

  rule_deposit_amount: gated((answers): RuleEvalOutput => {
    const info = depositCap(answers.q_contract_form);
    if (!info) {
      if (answers.q_contract_form === 'short_annual') {
        return {
          status: 'undetermined',
          reason: 'สัญญาเช่าระยะสั้นที่คิดค่าเช่ารายปี ข้อ 6.1(2) กำหนดเพดานเฉพาะ "อัตราค่าเช่าที่คิดเป็นรายเดือน" ตัวบทไม่ได้กำหนดเพดานสำหรับกรณีนี้ จึงบอกไม่ได้',
        };
      }
      return {
        status: 'undetermined',
        reason: 'ไม่ทราบระยะเวลาเช่าและวิธีคิดค่าเช่า (รายเดือน/รายปี) จึงยังไม่ทราบว่าใช้เพดานข้อ 6.1(2), 6.2(2) หรือ 6.2(3) — บอกไม่ได้',
      };
    }

    const { cap, unit, clause } = info;
    const dep = toNum(answers.q_deposit);
    const adv = toNum(answers.q_advance_rent);

    if (dep !== null && adv !== null) {
      const total = round3(dep + adv);
      if (total > cap) {
        return {
          status: 'violated',
          reason: `เงินประกัน ${dep} ${unit} รวมค่าเช่าล่วงหน้า ${adv} ${unit} เป็น ${total} ${unit} เกินเพดาน ${cap} ${unit}ของอัตราค่าเช่าที่คิดเป็นราย${unit === 'เดือน' ? 'เดือน' : 'ปี'} ตาม${clause} ของประกาศ พ.ศ. 2568`,
        };
      }
      return {
        status: 'compliant',
        reason: `เงินประกัน ${dep} ${unit} รวมค่าเช่าล่วงหน้า ${adv} ${unit} เป็น ${total} ${unit} ไม่เกินเพดาน ${cap} ${unit} ตาม${clause} ของประกาศ พ.ศ. 2568`,
      };
    }

    // One side is unknown. Never assume it: only a value already over the cap alone is conclusive.
    const known = dep !== null ? dep : adv;
    const knownName = dep !== null ? 'เงินประกัน' : 'ค่าเช่าล่วงหน้า';
    const missingName = dep !== null ? 'ค่าเช่าล่วงหน้า' : 'เงินประกัน';
    if (known !== null && known > cap) {
      return {
        status: 'violated',
        reason: `${knownName} ${known} ${unit} เพียงอย่างเดียวก็เกินเพดาน ${cap} ${unit} (รวมกับ${missingName}ยิ่งเกินกว่านั้น) ตาม${clause} ของประกาศ พ.ศ. 2568`,
      };
    }
    if (known !== null) {
      return {
        status: 'undetermined',
        reason: `ไม่ทราบจำนวน${missingName} จึงยังบอกไม่ได้ว่าเมื่อรวมกับ${knownName} ${known} ${unit} แล้วเกินเพดาน ${cap} ${unit} หรือไม่ (ระบบไม่สมมติค่าที่ไม่ทราบ)`,
      };
    }
    return {
      status: 'undetermined',
      reason: 'ไม่ทราบจำนวนเงินประกันและค่าเช่าล่วงหน้า จึงบอกไม่ได้',
    };
  }),

  rule_electricity_tariff: gated((answers): RuleEvalOutput => {
    const val = answers.q_electricity_rate;
    if (val === 'above_actual_rate') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดอัตราค่าไฟฟ้าสูงกว่าที่การไฟฟ้าเรียกเก็บจากผู้ให้เช่า ขัดต่อข้อ 6.1(6) (แบบ ข ข้อ 6.2(7)) ของประกาศ พ.ศ. 2568',
      };
    }
    if (val === 'actual_rate') {
      return {
        status: 'compliant',
        reason: 'สัญญาคิดค่าไฟฟ้าไม่เกินอัตราที่การไฟฟ้าเรียกเก็บจากผู้ให้เช่า ไม่ขัดข้อ 6.1(6) (แบบ ข ข้อ 6.2(7))',
      };
    }
    if (val === 'flat_unknown') {
      return {
        status: 'undetermined',
        reason: 'สัญญาคิดเหมาจ่ายหรืออัตราคงที่ แต่ยังไม่ทราบว่าสูงกว่าอัตราที่การไฟฟ้าเรียกเก็บจากผู้ให้เช่าหรือไม่ จึงบอกไม่ได้ (เทียบกับบิลการไฟฟ้าของผู้ให้เช่า)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุอัตราค่าไฟฟ้า',
    };
  }),

  rule_water_tariff: gated((answers): RuleEvalOutput => {
    const val = answers.q_water_rate;
    if (val === 'above_actual_rate') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดอัตราค่าน้ำประปาสูงกว่าที่การประปาเรียกเก็บจากผู้ให้เช่า ขัดต่อข้อ 6.1(6) (แบบ ข ข้อ 6.2(7)) ของประกาศ พ.ศ. 2568',
      };
    }
    if (val === 'actual_rate') {
      return {
        status: 'compliant',
        reason: 'สัญญาคิดค่าน้ำประปาไม่เกินอัตราที่การประปาเรียกเก็บจากผู้ให้เช่า ไม่ขัดข้อ 6.1(6) (แบบ ข ข้อ 6.2(7))',
      };
    }
    if (val === 'flat_unknown') {
      return {
        status: 'undetermined',
        reason: 'สัญญาคิดเหมาจ่ายหรืออัตราคงที่ แต่ยังไม่ทราบว่าสูงกว่าอัตราที่การประปาเรียกเก็บจากผู้ให้เช่าหรือไม่ จึงบอกไม่ได้ (เทียบกับบิลการประปาของผู้ให้เช่า)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุอัตราค่าน้ำประปา',
    };
  }),

  rule_deposit_refund_period: gated((answers): RuleEvalOutput => {
    const val = answers.q_deposit_refund_period;
    if (val === 'over_7_days') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดคืนเงินประกันช้ากว่า 7 วัน หรือนับเป็น "วันทำการ" ตัวบท (แบบ ก ข้อ 10(ก) / แบบ ข ข้อ 11(ก)) กำหนดให้คืนทันที หรือภายใน 7 วันนับแต่สัญญาสิ้นสุดและได้กลับเข้าครอบครองอาคารแล้ว เมื่อผู้เช่าไม่ได้ทำความเสียหาย โดยนับเป็น "วัน" ไม่ใช่ "วันทำการ"',
      };
    }
    if (val === 'within_7_days') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดคืนเงินประกันทันทีหรือภายใน 7 วัน ไม่ขัดแบบ ก ข้อ 10(ก) / แบบ ข ข้อ 11(ก)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุกำหนดวันคืนเงินประกัน',
    };
  }),

  rule_deposit_refund_after_deduction: gated((answers): RuleEvalOutput => {
    const val = answers.q_deposit_refund_after_deduction;
    if (val === 'over_14_days') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดคืนเงินประกันส่วนที่เหลือหลังหักค่าเสียหายช้ากว่า 14 วัน หรือนับเป็น "วันทำการ" ตัวบท (แบบ ก ข้อ 10(ข) / แบบ ข ข้อ 11(ข)) กำหนดให้คืนส่วนที่เหลือภายใน 14 วันนับแต่สัญญาสิ้นสุดและได้กลับเข้าครอบครองอาคารแล้ว โดยนับเป็น "วัน" ไม่ใช่ "วันทำการ"',
      };
    }
    if (val === 'within_14_days') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดคืนส่วนที่เหลือหลังหักค่าเสียหายภายใน 14 วัน ไม่ขัดแบบ ก ข้อ 10(ข) / แบบ ข ข้อ 11(ข)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือสัญญาไม่ได้พูดถึงกำหนดคืนเงินประกันส่วนที่เหลือหลังหักค่าเสียหาย',
    };
  }),

  rule_deposit_forfeiture: prohibitedClauseRule('q_deposit_forfeiture', {
    violated: 'สัญญามีข้อความให้ริบเงินประกันหรือค่าเช่าล่วงหน้าโดยมิใช่ความผิดของผู้เช่า ขัดต่อข้อ 6.1(4) (แบบ ข ข้อ 6.2(5)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่มีข้อความให้ริบเงินประกันหรือค่าเช่าล่วงหน้าโดยมิใช่ความผิดของผู้เช่า ไม่ขัดข้อ 6.1(4) (แบบ ข ข้อ 6.2(5))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเงื่อนไขการริบเงินประกันและค่าเช่าล่วงหน้า',
  }),

  rule_tenant_termination: gated((answers): RuleEvalOutput => {
    const val = answers.q_tenant_termination;
    if (val === 'conforms') {
      return {
        status: 'compliant',
        reason: 'สัญญาให้สิทธิผู้เช่าบอกเลิกก่อนครบกำหนดตามเงื่อนไขในแบบ ก ข้อ 13 / แบบ ข ข้อ 14 (อยู่มาแล้วไม่น้อยกว่ากึ่งหนึ่งของระยะเวลาสัญญา บอกกล่าวเป็นหนังสือล่วงหน้าไม่น้อยกว่า 30 วัน ไม่ค้างชำระ และคืนค่าเช่าล่วงหน้าภายใน 7 วันนับแต่วันบอกเลิก)',
      };
    }
    if (val === 'prohibited') {
      return {
        status: 'violated',
        reason: 'สัญญาห้ามผู้เช่าบอกเลิกก่อนครบกำหนด แต่แบบ ก ข้อ 13 / แบบ ข ข้อ 14 ให้สิทธิผู้เช่าบอกเลิกได้เมื่ออยู่มาแล้วไม่น้อยกว่ากึ่งหนึ่งของระยะเวลาสัญญา บอกกล่าวเป็นหนังสือล่วงหน้าไม่น้อยกว่า 30 วัน และไม่ผิดนัดค้างชำระ และข้อ 5 กำหนดให้ใช้ข้อสัญญาที่มีสาระสำคัญและเงื่อนไขตามแบบ',
      };
    }
    if (val === 'stricter_conditions') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดเงื่อนไขการบอกเลิกของผู้เช่าเข้มกว่าแบบ ก ข้อ 13 / แบบ ข ข้อ 14 (ตัวบทกำหนดเพียง: อยู่มาแล้วไม่น้อยกว่ากึ่งหนึ่งของระยะเวลาสัญญา บอกกล่าวเป็นหนังสือล่วงหน้าไม่น้อยกว่า 30 วัน และไม่ผิดนัดค้างชำระ) ซึ่งไม่ตรงตามข้อ 5 ที่ให้ใช้ข้อสัญญาที่มีสาระสำคัญและเงื่อนไขตามแบบ',
      };
    }
    if (val === 'late_or_no_refund') {
      return {
        status: 'violated',
        reason: 'สัญญาคืนค่าเช่าที่จ่ายล่วงหน้าช้ากว่า 7 วันนับแต่วันที่ผู้เช่าบอกเลิก หรือไม่คืน แต่แบบ ก ข้อ 13 วรรคสอง / แบบ ข ข้อ 14 วรรคสอง กำหนดให้คืนภายใน 7 วันนับแต่วันที่ผู้เช่าบอกเลิกสัญญา',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุสิทธิการบอกเลิกสัญญาของผู้เช่า',
    };
  }),

  rule_lessor_termination_notice: gated((answers): RuleEvalOutput => {
    const val = answers.q_lessor_termination_notice;
    if (val === 'notice_30_days_or_more') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดให้ผู้ให้เช่าทำหนังสือบอกกล่าวให้แก้ไขอย่างน้อย 30 วันก่อนบอกเลิก ตรงตามแบบ ก ข้อ 14 วรรคหนึ่ง / แบบ ข ข้อ 15 วรรคหนึ่ง',
      };
    }
    if (val === 'notice_under_30_days') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดระยะบอกกล่าวก่อนบอกเลิกสั้นกว่า 30 วัน แต่แบบ ก ข้อ 14 วรรคหนึ่ง / แบบ ข ข้อ 15 วรรคหนึ่ง กำหนดให้ผู้ให้เช่าทำหนังสือบอกกล่าวให้ผู้เช่าปฏิบัติตามสัญญาภายในอย่างน้อย 30 วันนับแต่วันที่ผู้เช่าได้รับหนังสือ (ตัวบทไม่ได้กำหนดระยะที่สั้นกว่านี้สำหรับกรณีค้างค่าเช่า)',
      };
    }
    if (val === 'no_notice') {
      return {
        status: 'violated',
        reason: 'สัญญาให้ผู้ให้เช่าบอกเลิกได้ทันทีโดยไม่ต้องมีหนังสือบอกกล่าว แต่แบบ ก ข้อ 14 วรรคหนึ่ง / แบบ ข ข้อ 15 วรรคหนึ่ง กำหนดให้ต้องมีหนังสือบอกกล่าวอย่างน้อย 30 วัน (ยกเว้นเฉพาะกรณีผู้เช่าไม่ปฏิบัติตามกฎหมายเกี่ยวกับความสงบเรียบร้อยหรือศีลธรรมอันดี ตามวรรคสาม)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุขั้นตอนการบอกกล่าวบอกเลิกสัญญาของผู้ให้เช่า',
    };
  }),

  rule_lessor_termination_disturbance: gated((answers): RuleEvalOutput => {
    const val = answers.q_lessor_termination_disturbance;
    if (val === 'notice_7_days_or_more') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดให้บอกกล่าวให้หยุดการกระทำที่รบกวนผู้เช่ารายอื่นอย่างน้อย 7 วันก่อนบอกเลิก ตรงตามแบบ ก ข้อ 14 วรรคสอง / แบบ ข ข้อ 15 วรรคสอง',
      };
    }
    if (val === 'under_7_days_or_none') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดบอกกล่าวสั้นกว่า 7 วัน หรือบอกเลิกได้ทันที กรณีผู้เช่ารบกวนผู้เช่ารายอื่น แต่แบบ ก ข้อ 14 วรรคสอง / แบบ ข ข้อ 15 วรรคสอง กำหนดให้ต้องมีหนังสือบอกกล่าวให้หยุดการกระทำภายในอย่างน้อย 7 วัน (ไม่ต้องบอกล่วงหน้าเฉพาะกรณีผู้เช่าไม่ปฏิบัติตามกฎหมายเกี่ยวกับความสงบเรียบร้อยหรือศีลธรรมอันดี ตามวรรคสาม)',
      };
    }
    if (val === 'no_special_clause') {
      return {
        status: 'compliant',
        reason: 'สัญญาไม่มีข้อกำหนดเฉพาะกรณีรบกวนผู้เช่ารายอื่น จึงไม่พบข้อสัญญาที่กำหนดระยะบอกกล่าวสั้นกว่า 7 วัน (ขั้นตอนบอกกล่าวทั่วไปตรวจในข้อก่อนหน้า)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุขั้นตอนการบอกเลิกกรณีรบกวนผู้เช่ารายอื่น',
    };
  }),

  rule_lessor_terminate_without_breach: prohibitedClauseRule('q_lessor_terminate_without_breach', {
    violated: 'สัญญาให้ผู้ให้เช่าบอกเลิกได้โดยผู้เช่ามิได้ผิดสัญญาอันเป็นสาระสำคัญ ขัดต่อข้อ 6.1(9) (แบบ ข ข้อ 6.2(10)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาให้ผู้ให้เช่าบอกเลิกได้เฉพาะเมื่อผู้เช่าผิดสัญญา ไม่ขัดข้อ 6.1(9) (แบบ ข ข้อ 6.2(10))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเหตุที่ผู้ให้เช่าบอกเลิกสัญญาได้',
  }),

  rule_inspection_privacy: gated((answers): RuleEvalOutput => {
    const val = answers.q_inspection_without_notice;
    if (val === 'unannounced_entry') {
      return {
        status: 'violated',
        reason: 'สัญญาให้ผู้ให้เช่าหรือตัวแทนเข้าตรวจสอบห้องโดยไม่ต้องแจ้งล่วงหน้า ขัดต่อข้อ 6.1(5) (แบบ ข ข้อ 6.2(6)) ของประกาศ พ.ศ. 2568 ซึ่งอนุญาตเฉพาะเหตุฉุกเฉินที่หากไม่ดำเนินการจะเกิดความเสียหายหรือมีผลกระทบต่อผู้ให้เช่าหรือผู้เช่ารายอื่น',
      };
    }
    if (val === 'notice_required') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดให้แจ้งผู้เช่าล่วงหน้าก่อนเข้าตรวจ (เว้นแต่เหตุฉุกเฉิน) ไม่ขัดข้อ 6.1(5) (แบบ ข ข้อ 6.2(6))',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเงื่อนไขการเข้าตรวจสอบห้อง',
    };
  }),

  rule_self_help_lockout: prohibitedClauseRule('q_lockout_and_seizure', {
    violated: 'สัญญาให้ผู้ให้เช่าปิดกั้นไม่ให้ผู้เช่าเข้าห้อง หรือเข้ายึด/ขนย้ายทรัพย์สินของผู้เช่า ก่อนบอกเลิกสัญญาโดยชอบด้วยกฎหมาย ขัดต่อข้อ 6.1(7) (แบบ ข ข้อ 6.2(8)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่มีข้อความให้ปิดกั้นไม่ให้เข้าห้อง หรือเข้ายึด/ขนย้ายทรัพย์สินก่อนบอกเลิกสัญญาโดยชอบ ไม่ขัดข้อ 6.1(7) (แบบ ข ข้อ 6.2(8))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเรื่องการปิดกั้นห้องหรือการยึดทรัพย์สิน',
  }),

  rule_liability_exemption: gated((answers): RuleEvalOutput => {
    const val = answers.q_exemption_of_liability;
    if (val === 'no_clause') {
      return {
        status: 'compliant',
        reason: 'สัญญาไม่มีข้อความยกเว้นหรือจำกัดความรับผิดของผู้ให้เช่า ไม่ขัดข้อ 6.1(1) (แบบ ข ข้อ 6.2(1))',
      };
    }
    if (val === 'has_clause') {
      // 6.1(1) only bars exemptions "โดยไม่มีเหตุผลที่สมควรเพียงพอ" — a judgement the engine cannot make.
      return {
        status: 'undetermined',
        reason: 'สัญญามีข้อความยกเว้นหรือจำกัดความรับผิดของผู้ให้เช่า ข้อ 6.1(1) (แบบ ข ข้อ 6.2(1)) ห้ามเฉพาะกรณีที่ไม่มีเหตุผลที่สมควรเพียงพอและเป็นสาระสำคัญ ซึ่งต้องพิจารณาจากถ้อยคำและเหตุผลของข้อสัญญานั้น ระบบตัดสินแทนไม่ได้ จึงบอกไม่ได้ (ปรึกษา สคบ. 1166)',
      };
    }
    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือไม่ได้ตรวจพบข้อความยกเว้นความรับผิดของผู้ให้เช่า',
    };
  }),

  rule_rent_change_during_term: prohibitedClauseRule('q_rent_change_during_term', {
    violated: 'สัญญาให้ผู้ให้เช่าเปลี่ยนแปลงอัตราค่าเช่าหรือค่าใช้จ่ายในการให้บริการก่อนสัญญาสิ้นสุด ขัดต่อข้อ 6.1(3) (แบบ ข ข้อ 6.2(4)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่ให้ผู้ให้เช่าเปลี่ยนแปลงค่าเช่าหรือค่าบริการก่อนสัญญาสิ้นสุด ไม่ขัดข้อ 6.1(3) (แบบ ข ข้อ 6.2(4))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเรื่องการเปลี่ยนแปลงค่าเช่าและค่าบริการระหว่างสัญญา',
  }),

  rule_renewal_fee: prohibitedClauseRule('q_renewal_fee', {
    violated: 'สัญญาให้ผู้ให้เช่าเรียกค่าต่อสัญญาจากผู้เช่ารายเดิม ขัดต่อข้อ 6.1(8) (แบบ ข ข้อ 6.2(9)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่มีค่าต่อสัญญาจากผู้เช่ารายเดิม ไม่ขัดข้อ 6.1(8) (แบบ ข ข้อ 6.2(9))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเรื่องค่าต่อสัญญา',
  }),

  rule_normal_wear_liability: prohibitedClauseRule('q_normal_wear_liability', {
    violated: 'สัญญาให้ผู้เช่ารับผิดในความเสียหาย ความชำรุดบกพร่อง หรือการเสื่อมสภาพที่เกิดจากการใช้งานตามปกติ ขัดต่อข้อ 6.1(10) และ 6.1(12) (แบบ ข ข้อ 6.2(11) และ 6.2(13)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่ให้ผู้เช่ารับผิดในความเสียหายหรือการเสื่อมสภาพจากการใช้งานตามปกติ ไม่ขัดข้อ 6.1(10) และ 6.1(12) (แบบ ข ข้อ 6.2(11) และ 6.2(13))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุความรับผิดต่อความเสียหายหรือการเสื่อมสภาพจากการใช้งานตามปกติ',
  }),

  rule_force_majeure_liability: prohibitedClauseRule('q_force_majeure_liability', {
    violated: 'สัญญาให้ผู้เช่ารับผิดในความเสียหายที่มิใช่ความผิดของผู้เช่าหรือเกิดจากเหตุสุดวิสัย ขัดต่อข้อ 6.1(11) (แบบ ข ข้อ 6.2(12)) ของประกาศ พ.ศ. 2568',
    compliant: 'สัญญาไม่ให้ผู้เช่ารับผิดในเหตุที่มิใช่ความผิดของตนหรือเหตุสุดวิสัย ไม่ขัดข้อ 6.1(11) (แบบ ข ข้อ 6.2(12))',
    undetermined: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุความรับผิดในเหตุที่มิใช่ความผิดของผู้เช่าหรือเหตุสุดวิสัย',
  }),
};

export const rentalPackRules: PackRules = {
  evaluateScope: evaluateRentalScope,
  rules,
};
