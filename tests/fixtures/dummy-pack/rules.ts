import { PackRules, ScopeEvaluator, RuleEvaluator } from '../../../lib/engine/types';

export const evaluateDummyScope: ScopeEvaluator = (answers) => {
  if (answers.q_dummy_scope === 'in_scope') {
    return { inScope: true, reason: 'อยู่ในขอบเขตจำลอง' };
  }
  if (answers.q_dummy_scope === 'out_of_scope') {
    return { inScope: false, reason: 'ไม่อยู่ในขอบเขตจำลอง' };
  }
  return { inScope: 'undetermined', reason: 'ข้อมูลไม่เพียงพอ' };
};

export const dummyRules: Record<string, RuleEvaluator> = {
  rule_dummy_fee_cap: (answers) => {
    const fee = answers.q_dummy_fee;
    if (fee === undefined || fee === null || fee === '__unsure__') {
      return { status: 'undetermined', reason: 'ไม่ได้ระบุค่าธรรมเนียม' };
    }
    const num = Number(fee);
    if (isNaN(num)) return { status: 'undetermined', reason: 'ค่าธรรมเนียมไม่ถูกต้อง' };
    if (num > 100) {
      return { status: 'violated', reason: `ค่าธรรมเนียม ${num} บาท เกินเพดาน 100 บาท` };
    }
    return { status: 'compliant', reason: `ค่าธรรมเนียม ${num} บาท ไม่เกินเพดาน 100 บาท` };
  },

  rule_dummy_notice_required: (answers) => {
    const notice = answers.q_dummy_notice;
    if (notice === 'yes') {
      return { status: 'compliant', reason: 'มีการแจ้งล่วงหน้า' };
    }
    if (notice === 'no') {
      return { status: 'violated', reason: 'ไม่มีการแจ้งล่วงหน้า' };
    }
    return { status: 'undetermined', reason: 'ไม่แน่ใจเรื่องการแจ้งล่วงหน้า' };
  },
};

export const dummyPackRules: PackRules = {
  evaluateScope: evaluateDummyScope,
  rules: dummyRules,
};
