import { describe, it, expect } from 'vitest';
import {
  evaluateRentalScope,
  rules,
  applicabilityGate,
  toNum,
} from '../packs/rental/rules';
import rentalPackJson from '../packs/rental/pack.json';
import { PackDefinition } from '../lib/engine/types';

/** Contract made after the 2568 notice took effect — the only case the notice can adjudicate. */
const ON = { q_contract_date: 'on_or_after_effective' };
const withOn = (a: Record<string, any>) => ({ ...ON, ...a });

describe('Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ)', () => {
  describe('Scope Gatekeeper: evaluateRentalScope', () => {
    it('returns inScope: true for standard residential rental', () => {
      const res = evaluateRentalScope({ q_scope: 'in_scope' });
      expect(res.inScope).toBe(true);
      expect(res.reason).toContain('อยู่ในขอบเขต');
    });

    it('returns inScope: false for dormitories under the dormitory act', () => {
      const res = evaluateRentalScope({ q_scope: 'out_dorm_act' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('หอพักตามกฎหมายว่าด้วยหอพัก');
    });

    it('returns inScope: false for hotel / daily stay (exclusion)', () => {
      const res = evaluateRentalScope({ q_scope: 'out_hotel' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('โรงแรม');
    });

    it('returns inScope: false for small landlord under 3 units', () => {
      const res = evaluateRentalScope({ q_scope: 'out_few_units' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('1–2 หลัง/ห้อง');
      expect(res.reason).toContain('สามหน่วยขึ้นไป');
    });

    it('returns inScope: false for commercial rentals', () => {
      const res = evaluateRentalScope({ q_scope: 'out_commercial' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('ร้านค้า ออฟฟิศ หรือประกอบธุรกิจ');
    });

    it('out-of-scope reasons warn that the 2562 notice was not checked', () => {
      for (const v of ['out_dorm_act', 'out_hotel', 'out_few_units', 'out_commercial']) {
        expect(evaluateRentalScope({ q_scope: v }).reason).toContain('พ.ศ. 2562');
      }
    });

    it('returns inScope: undetermined when unsure', () => {
      const res = evaluateRentalScope({ q_scope: '__unsure__' });
      expect(res.inScope).toBe('undetermined');
    });
  });

  describe('toNum helper', () => {
    it('parses numbers and rejects missing / unsure / negative / non-numeric', () => {
      expect(toNum(2)).toBe(2);
      expect(toNum('1.5')).toBe(1.5);
      expect(toNum(0)).toBe(0);
      expect(toNum(undefined)).toBeNull();
      expect(toNum(null)).toBeNull();
      expect(toNum('')).toBeNull(); // Number('') === 0 must NOT be treated as zero
      expect(toNum('__unsure__')).toBeNull();
      expect(toNum('abc')).toBeNull();
      expect(toNum(-1)).toBeNull();
    });
  });

  describe('Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10)', () => {
    const ruleIds = Object.keys(rules);

    it('before the effective date → EVERY rule is undetermined, never violated/compliant', () => {
      // Even answers that would be violated under 2568 must not be judged.
      const answers = {
        q_contract_date: 'before_effective',
        q_scope: 'in_scope',
        q_contract_form: 'short_monthly',
        q_deposit: 5,
        q_advance_rent: 5,
        q_electricity_rate: 'above_actual_rate',
        q_water_rate: 'above_actual_rate',
        q_deposit_refund_period: 'over_7_days',
        q_deposit_refund_after_deduction: 'over_14_days',
        q_deposit_forfeiture: 'has_clause',
        q_tenant_termination: 'prohibited',
        q_lessor_termination_notice: 'no_notice',
        q_lessor_termination_disturbance: 'under_7_days_or_none',
        q_lessor_terminate_without_breach: 'has_clause',
        q_inspection_without_notice: 'unannounced_entry',
        q_lockout_and_seizure: 'has_clause',
        q_exemption_of_liability: 'has_clause',
        q_rent_change_during_term: 'has_clause',
        q_renewal_fee: 'has_clause',
        q_normal_wear_liability: 'has_clause',
        q_force_majeure_liability: 'has_clause',
      };
      for (const id of ruleIds) {
        expect(rules[id](answers).status, id).toBe('undetermined');
      }
    });

    it('explains the transition (ข้อ 10) and that the 2562 text is not checked', () => {
      const res = rules.rule_rental_scope({ q_scope: 'in_scope', q_contract_date: 'before_effective' });
      expect(res.reason).toContain('ข้อ 10');
      expect(res.reason).toContain('พ.ศ. 2562');
      expect(res.reason).toContain('บอกไม่ได้');
    });

    it('boundary day (4 Sep 2568) → every rule undetermined', () => {
      for (const id of ruleIds) {
        expect(rules[id]({ q_scope: 'in_scope', q_contract_date: 'boundary_day', q_renewal_fee: 'has_clause' }).status, id).toBe('undetermined');
      }
      expect(applicabilityGate({ q_contract_date: 'boundary_day' }, true)?.reason).toContain('เมื่อพ้นกำหนดเก้าสิบวัน');
    });

    it('missing / unsure date → every rule undetermined', () => {
      for (const id of ruleIds) {
        expect(rules[id]({ q_scope: 'in_scope', q_renewal_fee: 'has_clause' }).status, id).toBe('undetermined');
        expect(rules[id]({ q_scope: 'in_scope', q_contract_date: '__unsure__', q_renewal_fee: 'has_clause' }).status, id).toBe('undetermined');
      }
    });

    it('on/after the effective date → gate is open', () => {
      expect(applicabilityGate({ q_contract_date: 'on_or_after_effective' })).toBeNull();
      expect(rules.rule_renewal_fee(withOn({ q_renewal_fee: 'has_clause' })).status).toBe('violated');
    });
  });

  describe('rule_rental_scope', () => {
    it('returns compliant when in_scope and after effective date', () => {
      expect(rules.rule_rental_scope(withOn({ q_scope: 'in_scope' })).status).toBe('compliant');
    });
    it('returns violated when out of scope', () => {
      expect(rules.rule_rental_scope(withOn({ q_scope: 'out_hotel' })).status).toBe('violated');
    });
    it('returns undetermined when unsure', () => {
      expect(rules.rule_rental_scope(withOn({ q_scope: '__unsure__' })).status).toBe('undetermined');
    });
  });

  describe('rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3))', () => {
    const m = (a: Record<string, any>) => rules.rule_deposit_amount(withOn({ q_contract_form: 'short_monthly', ...a }));

    it('compliant: advance 2 months + deposit 1 month = 3 months (spec case)', () => {
      const res = m({ q_deposit: 1, q_advance_rent: 2 });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('3 เดือน');
    });

    it('compliant boundary: deposit 2 + advance 1 = 3 (equal to cap is allowed)', () => {
      expect(m({ q_deposit: 2, q_advance_rent: 1 }).status).toBe('compliant');
    });

    it('compliant: deposit 1 + advance 1', () => {
      expect(m({ q_deposit: 1, q_advance_rent: 1 }).status).toBe('compliant');
    });

    it('compliant: no deposit and no advance (0 + 0)', () => {
      expect(m({ q_deposit: 0, q_advance_rent: 0 }).status).toBe('compliant');
    });

    it('violated just over the cap: deposit 2.5 + advance 1 = 3.5', () => {
      const res = m({ q_deposit: 2.5, q_advance_rent: 1 });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('เกินเพดาน 3 เดือน');
    });

    it('violated: deposit 2 + advance 2 = 4', () => {
      expect(m({ q_deposit: 2, q_advance_rent: 2 }).status).toBe('violated');
    });

    it('floating-point safe: 1.1 + 1.9 = 3 is not over the cap', () => {
      expect(m({ q_deposit: 1.1, q_advance_rent: 1.9 }).status).toBe('compliant');
    });

    it('advance rent unknown + deposit within cap → undetermined, never assumed', () => {
      for (const adv of ['__unsure__', undefined, '']) {
        const res = m({ q_deposit: 1, q_advance_rent: adv });
        expect(res.status).toBe('undetermined');
        expect(res.reason).toContain('ไม่ทราบจำนวนค่าเช่าล่วงหน้า');
      }
      // Even a "small" deposit must not be called compliant when advance rent is unknown.
      expect(m({ q_deposit: 0.5, q_advance_rent: '__unsure__' }).status).toBe('undetermined');
      expect(m({ q_deposit: 2, q_advance_rent: '__unsure__' }).status).toBe('undetermined');
    });

    it('deposit unknown + advance within cap → undetermined', () => {
      const res = m({ q_deposit: '__unsure__', q_advance_rent: 1 });
      expect(res.status).toBe('undetermined');
      expect(res.reason).toContain('ไม่ทราบจำนวนเงินประกัน');
    });

    it('one side alone already over the cap → violated even if the other is unknown (lower bound)', () => {
      expect(m({ q_deposit: 3.5, q_advance_rent: '__unsure__' }).status).toBe('violated');
      expect(m({ q_deposit: '__unsure__', q_advance_rent: 4 }).status).toBe('violated');
    });

    it('both unknown → undetermined', () => {
      expect(m({ q_deposit: '__unsure__', q_advance_rent: '__unsure__' }).status).toBe('undetermined');
      expect(m({}).status).toBe('undetermined');
    });

    it('long-term form B, monthly rent → same 3-month cap (ข้อ 6.2(2))', () => {
      const ok = rules.rule_deposit_amount(withOn({ q_contract_form: 'long_monthly', q_deposit: 1, q_advance_rent: 2 }));
      expect(ok.status).toBe('compliant');
      expect(ok.reason).toContain('6.2(2)');
      expect(rules.rule_deposit_amount(withOn({ q_contract_form: 'long_monthly', q_deposit: 2, q_advance_rent: 2 })).status).toBe('violated');
    });

    it('long-term form B, annual rent → cap is 1 year (ข้อ 6.2(3))', () => {
      const a = (dep: any, adv: any) => rules.rule_deposit_amount(withOn({ q_contract_form: 'long_annual', q_deposit: dep, q_advance_rent: adv }));
      const ok = a(0.5, 0.5);
      expect(ok.status).toBe('compliant');
      expect(ok.reason).toContain('6.2(3)');
      expect(ok.reason).toContain('ปี');
      expect(a(1, 0).status).toBe('compliant'); // boundary
      expect(a(0.5, 1).status).toBe('violated');
      expect(a(0.5, '__unsure__').status).toBe('undetermined');
    });

    it('short-term form A with annual rent → 6.1(2) states no cap → undetermined', () => {
      const res = rules.rule_deposit_amount(withOn({ q_contract_form: 'short_annual', q_deposit: 1, q_advance_rent: 1 }));
      expect(res.status).toBe('undetermined');
      expect(res.reason).toContain('รายเดือน');
    });

    it('unknown contract form → undetermined', () => {
      expect(rules.rule_deposit_amount(withOn({ q_deposit: 1, q_advance_rent: 1 })).status).toBe('undetermined');
      expect(rules.rule_deposit_amount(withOn({ q_contract_form: '__unsure__', q_deposit: 1, q_advance_rent: 1 })).status).toBe('undetermined');
    });
  });

  describe('rule_advance_rent has been removed (ตัวบทไม่มีเพดานค่าเช่าล่วงหน้า 1 เดือน)', () => {
    it('no rule, no question and no legal text mention a separate 1-month advance-rent cap', () => {
      const pack = rentalPackJson as PackDefinition;
      expect((rules as any).rule_advance_rent).toBeUndefined();
      expect((rules as any).rule_combined_deposit_advance).toBeUndefined();
      expect(pack.rules.find((r) => r.id === 'rule_advance_rent')).toBeUndefined();
      expect(pack.rules.find((r) => r.id === 'rule_combined_deposit_advance')).toBeUndefined();
      expect(pack.questions.find((q) => q.id === 'q_combined_deposit_advance')).toBeUndefined();
      expect(JSON.stringify(pack)).not.toContain('ไม่เกิน 1 เดือน');
      expect(JSON.stringify(pack)).not.toContain('ไม่เกินหนึ่งเดือน');
    });
  });

  describe('rule_electricity_tariff / rule_water_tariff (ข้อ 6.1(6))', () => {
    it('electricity: compliant / violated / flat-unknown / unsure', () => {
      expect(rules.rule_electricity_tariff(withOn({ q_electricity_rate: 'actual_rate' })).status).toBe('compliant');
      const v = rules.rule_electricity_tariff(withOn({ q_electricity_rate: 'above_actual_rate' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(6)');
      expect(v.reason).not.toContain('ข้อ ๕');
      expect(rules.rule_electricity_tariff(withOn({ q_electricity_rate: 'flat_unknown' })).status).toBe('undetermined');
      expect(rules.rule_electricity_tariff(withOn({ q_electricity_rate: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_electricity_tariff(ON).status).toBe('undetermined');
    });

    it('water: compliant / violated / flat-unknown / unsure', () => {
      expect(rules.rule_water_tariff(withOn({ q_water_rate: 'actual_rate' })).status).toBe('compliant');
      const v = rules.rule_water_tariff(withOn({ q_water_rate: 'above_actual_rate' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(6)');
      expect(rules.rule_water_tariff(withOn({ q_water_rate: 'flat_unknown' })).status).toBe('undetermined');
      expect(rules.rule_water_tariff(withOn({ q_water_rate: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_water_tariff(ON).status).toBe('undetermined');
    });
  });

  describe('rule_deposit_refund_period (แบบ ก ข้อ 10(ก): ภายใน 7 วัน ไม่ใช่วันทำการ)', () => {
    it('compliant: within 7 days', () => {
      expect(rules.rule_deposit_refund_period(withOn({ q_deposit_refund_period: 'within_7_days' })).status).toBe('compliant');
    });

    it('violated: over 7 days, and the reason says "วัน" not "วันทำการ"', () => {
      const res = rules.rule_deposit_refund_period(withOn({ q_deposit_refund_period: 'over_7_days' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('7 วัน');
      expect(res.reason).toContain('ไม่ใช่ "วันทำการ"');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_deposit_refund_period(withOn({ q_deposit_refund_period: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_deposit_refund_period(ON).status).toBe('undetermined');
    });

    it('pack text no longer says 7 วันทำการ as the legal standard', () => {
      const pack = rentalPackJson as PackDefinition;
      const rule = pack.rules.find((r) => r.id === 'rule_deposit_refund_period')!;
      expect(rule.legalRef.verbatim).toContain('เจ็ดวันนับแต่วันที่สัญญาเช่าอาคารสิ้นสุด');
      expect(rule.legalRef.verbatim).not.toContain('เจ็ดวันทำการ');
      expect(rule.description).not.toContain('วันทำการ');
    });
  });

  describe('rule_deposit_refund_after_deduction (แบบ ก ข้อ 10(ข): ภายใน 14 วัน)', () => {
    it('compliant: within 14 days', () => {
      expect(rules.rule_deposit_refund_after_deduction(withOn({ q_deposit_refund_after_deduction: 'within_14_days' })).status).toBe('compliant');
    });

    it('violated: over 14 days (reason cites 14 วัน, not วันทำการ)', () => {
      const res = rules.rule_deposit_refund_after_deduction(withOn({ q_deposit_refund_after_deduction: 'over_14_days' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('14 วัน');
      expect(res.reason).toContain('ไม่ใช่ "วันทำการ"');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_deposit_refund_after_deduction(withOn({ q_deposit_refund_after_deduction: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_deposit_refund_after_deduction(ON).status).toBe('undetermined');
    });

    it('the 7-day and 14-day questions are independent (no cross-contamination)', () => {
      const a = withOn({ q_deposit_refund_period: 'within_7_days', q_deposit_refund_after_deduction: 'over_14_days' });
      expect(rules.rule_deposit_refund_period(a).status).toBe('compliant');
      expect(rules.rule_deposit_refund_after_deduction(a).status).toBe('violated');
    });
  });

  describe('rule_deposit_forfeiture (ข้อ 6.1(4): ริบโดยมิใช่ความผิดของผู้เช่า)', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_deposit_forfeiture(withOn({ q_deposit_forfeiture: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_deposit_forfeiture(withOn({ q_deposit_forfeiture: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(4)');
      expect(v.reason).toContain('มิใช่ความผิดของผู้เช่า');
      expect(rules.rule_deposit_forfeiture(withOn({ q_deposit_forfeiture: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_deposit_forfeiture(ON).status).toBe('undetermined');
    });
  });

  describe('rule_tenant_termination (แบบ ก ข้อ 13)', () => {
    it('compliant: conforms', () => {
      expect(rules.rule_tenant_termination(withOn({ q_tenant_termination: 'conforms' })).status).toBe('compliant');
    });

    it('violated: prohibited — reason carries half-term, 30-day notice', () => {
      const res = rules.rule_tenant_termination(withOn({ q_tenant_termination: 'prohibited' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('กึ่งหนึ่ง');
      expect(res.reason).toContain('30 วัน');
    });

    it('violated: stricter conditions than the standard form', () => {
      expect(rules.rule_tenant_termination(withOn({ q_tenant_termination: 'stricter_conditions' })).status).toBe('violated');
    });

    it('violated: advance rent refunded later than 7 days from the termination notice', () => {
      const res = rules.rule_tenant_termination(withOn({ q_tenant_termination: 'late_or_no_refund' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('7 วัน');
      expect(res.reason).toContain('นับแต่วันที่ผู้เช่าบอกเลิก');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_tenant_termination(withOn({ q_tenant_termination: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_tenant_termination(ON).status).toBe('undetermined');
    });
  });

  describe('rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน)', () => {
    it('compliant: ≥ 30 days notice', () => {
      expect(rules.rule_lessor_termination_notice(withOn({ q_lessor_termination_notice: 'notice_30_days_or_more' })).status).toBe('compliant');
    });

    it('violated: shorter than 30 days, including for rent arrears — no "7 วันกรณีค้างค่าเช่า" exception', () => {
      const res = rules.rule_lessor_termination_notice(withOn({ q_lessor_termination_notice: 'notice_under_30_days' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('30 วัน');
      expect(res.reason).toContain('ค้างค่าเช่า');
      expect(res.reason).not.toContain('7 วันกรณีค้างค่าเช่า');
    });

    it('violated: no notice at all', () => {
      const res = rules.rule_lessor_termination_notice(withOn({ q_lessor_termination_notice: 'no_notice' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('30 วัน');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_lessor_termination_notice(withOn({ q_lessor_termination_notice: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_lessor_termination_notice(ON).status).toBe('undetermined');
    });

    it('no pack text claims a 7-day exception for rent arrears', () => {
      expect(JSON.stringify(rentalPackJson)).not.toContain('7 วันกรณีค้างค่าเช่า');
      expect(JSON.stringify(rentalPackJson)).not.toContain('เจ็ดวันกรณีค้างชำระค่าเช่า');
    });
  });

  describe('rule_lessor_termination_disturbance (แบบ ก ข้อ 14 วรรคสอง: ≥ 7 วัน)', () => {
    it('compliant: ≥ 7 days notice, or no special clause', () => {
      expect(rules.rule_lessor_termination_disturbance(withOn({ q_lessor_termination_disturbance: 'notice_7_days_or_more' })).status).toBe('compliant');
      expect(rules.rule_lessor_termination_disturbance(withOn({ q_lessor_termination_disturbance: 'no_special_clause' })).status).toBe('compliant');
    });

    it('violated: shorter than 7 days or immediate', () => {
      const res = rules.rule_lessor_termination_disturbance(withOn({ q_lessor_termination_disturbance: 'under_7_days_or_none' }));
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('7 วัน');
      // the illegal-conduct exception (วรรคสาม) is mentioned so users are not misled
      expect(res.reason).toContain('ความสงบเรียบร้อย');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_lessor_termination_disturbance(withOn({ q_lessor_termination_disturbance: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_lessor_termination_disturbance(ON).status).toBe('undetermined');
    });
  });

  describe('rule_lessor_terminate_without_breach (ข้อ 6.1(9))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_lessor_terminate_without_breach(withOn({ q_lessor_terminate_without_breach: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_lessor_terminate_without_breach(withOn({ q_lessor_terminate_without_breach: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(9)');
      expect(rules.rule_lessor_terminate_without_breach(withOn({ q_lessor_terminate_without_breach: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_lessor_terminate_without_breach(ON).status).toBe('undetermined');
    });
  });

  describe('rule_inspection_privacy (ข้อ 6.1(5))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_inspection_privacy(withOn({ q_inspection_without_notice: 'notice_required' })).status).toBe('compliant');
      const v = rules.rule_inspection_privacy(withOn({ q_inspection_without_notice: 'unannounced_entry' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(5)');
      expect(v.reason).not.toContain('ข้อ ๕ ที่ห้ามมิให้');
      expect(rules.rule_inspection_privacy(withOn({ q_inspection_without_notice: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_inspection_privacy(ON).status).toBe('undetermined');
    });
  });

  describe('rule_self_help_lockout (ข้อ 6.1(7))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_self_help_lockout(withOn({ q_lockout_and_seizure: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_self_help_lockout(withOn({ q_lockout_and_seizure: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(7)');
      expect(v.reason).not.toContain('โมฆะ');
      expect(rules.rule_self_help_lockout(withOn({ q_lockout_and_seizure: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_self_help_lockout(ON).status).toBe('undetermined');
    });
  });

  describe('rule_liability_exemption (ข้อ 6.1(1) — ต้องพิจารณา "เหตุผลที่สมควรเพียงพอ")', () => {
    it('compliant: no such clause', () => {
      expect(rules.rule_liability_exemption(withOn({ q_exemption_of_liability: 'no_clause' })).status).toBe('compliant');
    });
    it('undetermined (not violated): clause exists but whether it lacks adequate justification is a judgement call', () => {
      const res = rules.rule_liability_exemption(withOn({ q_exemption_of_liability: 'has_clause' }));
      expect(res.status).toBe('undetermined');
      expect(res.reason).toContain('เหตุผลที่สมควรเพียงพอ');
    });
    it('undetermined: unsure or missing', () => {
      expect(rules.rule_liability_exemption(withOn({ q_exemption_of_liability: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_liability_exemption(ON).status).toBe('undetermined');
    });
  });

  describe('rule_rent_change_during_term (ข้อ 6.1(3))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_rent_change_during_term(withOn({ q_rent_change_during_term: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_rent_change_during_term(withOn({ q_rent_change_during_term: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(3)');
      expect(rules.rule_rent_change_during_term(withOn({ q_rent_change_during_term: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_rent_change_during_term(ON).status).toBe('undetermined');
    });
  });

  describe('rule_renewal_fee (ข้อ 6.1(8))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_renewal_fee(withOn({ q_renewal_fee: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_renewal_fee(withOn({ q_renewal_fee: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(8)');
      expect(rules.rule_renewal_fee(withOn({ q_renewal_fee: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_renewal_fee(ON).status).toBe('undetermined');
    });
  });

  describe('rule_normal_wear_liability (ข้อ 6.1(10) และ 6.1(12))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_normal_wear_liability(withOn({ q_normal_wear_liability: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_normal_wear_liability(withOn({ q_normal_wear_liability: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(10)');
      expect(v.reason).toContain('6.1(12)');
      expect(rules.rule_normal_wear_liability(withOn({ q_normal_wear_liability: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_normal_wear_liability(ON).status).toBe('undetermined');
    });
  });

  describe('rule_force_majeure_liability (ข้อ 6.1(11))', () => {
    it('compliant / violated / undetermined', () => {
      expect(rules.rule_force_majeure_liability(withOn({ q_force_majeure_liability: 'no_clause' })).status).toBe('compliant');
      const v = rules.rule_force_majeure_liability(withOn({ q_force_majeure_liability: 'has_clause' }));
      expect(v.status).toBe('violated');
      expect(v.reason).toContain('6.1(11)');
      expect(rules.rule_force_majeure_liability(withOn({ q_force_majeure_liability: '__unsure__' })).status).toBe('undetermined');
      expect(rules.rule_force_majeure_liability(ON).status).toBe('undetermined');
    });
  });
});

describe('Rental pack ↔ statute coverage and source integrity', () => {
  const pack = rentalPackJson as PackDefinition;
  const SRC_2568 = 'https://www.ocpb.go.th/article_attach/articlefile_2025070314222862724.pdf';

  it('every rule in pack.json has an evaluator, and every evaluator has a rule', () => {
    const packIds = pack.rules.map((r) => r.id).sort();
    const evalIds = Object.keys(rules).sort();
    expect(evalIds).toEqual(packIds);
  });

  it('every question referenced by an evaluator exists in pack.json (no orphan answers)', () => {
    const qIds = new Set(pack.questions.map((q) => q.id));
    for (const id of ['q_scope', 'q_contract_date', 'q_contract_form', 'q_deposit', 'q_advance_rent', 'q_deposit_refund_period', 'q_deposit_refund_after_deduction']) {
      expect(qIds.has(id), id).toBe(true);
    }
  });

  it('the contract-date question comes immediately after the scope question', () => {
    expect(pack.questions[0].id).toBe('q_scope');
    expect(pack.questions[1].id).toBe('q_contract_date');
  });

  it('all 12 prohibited clauses of ข้อ 6.1 are covered by a rule that cites them', () => {
    const coverage: Record<number, string> = {
      1: 'rule_liability_exemption',
      2: 'rule_deposit_amount',
      3: 'rule_rent_change_during_term',
      4: 'rule_deposit_forfeiture',
      5: 'rule_inspection_privacy',
      6: 'rule_electricity_tariff',
      7: 'rule_self_help_lockout',
      8: 'rule_renewal_fee',
      9: 'rule_lessor_terminate_without_breach',
      10: 'rule_normal_wear_liability',
      11: 'rule_force_majeure_liability',
      12: 'rule_normal_wear_liability',
    };
    const thaiDigits = (n: number) => String(n).replace(/\d/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[Number(d)]);
    for (const [n, ruleId] of Object.entries(coverage)) {
      const rule = pack.rules.find((r) => r.id === ruleId);
      expect(rule, `rule for 6.1(${n})`).toBeDefined();
      expect(rule!.legalRef.clause, `${ruleId} clause`).toContain(`๖.๑(${thaiDigits(Number(n))})`);
      expect(rule!.legalRef.verbatim, `${ruleId} verbatim`).toContain(`๖.๑(${thaiDigits(Number(n))})`);
    }
    // 6.1(6) covers both utilities
    expect(pack.rules.find((r) => r.id === 'rule_water_tariff')!.legalRef.clause).toContain('๖.๑(๖)');
  });

  it('the 2568 source links to the official OCPB PDF, not the old gazette id 72766', () => {
    const s2568 = pack.meta.officialSources.find((s) => s.title.includes('๒๕๖๘'))!;
    expect(s2568.url).toBe(SRC_2568);
    expect(s2568.gazetteRef).toContain('๑๔๒');
    expect(s2568.gazetteRef).toContain('๒๑๑ ง');
    expect(s2568.gazetteRef).toContain('๘๐');
    expect(s2568.announcementDate).toBe('2568-06-06');
    for (const r of pack.rules) expect(r.legalRef.sourceUrl, r.id).toBe(SRC_2568);
  });

  it('the 2562 source is a different document from the 2568 one', () => {
    const s2562 = pack.meta.officialSources.find((s) => s.title.includes('๒๕๖๒') && !s.title.startsWith('ประกาศคณะกรรมการว่าด้วยสัญญา เรื่อง ให้ธุรกิจการให้เช่าอาคารเพื่ออยู่อาศัยเป็นธุรกิจที่ควบคุมสัญญา พ.ศ. ๒๕๖๘'))!;
    expect(s2562).toBeDefined();
    expect(s2562.url).not.toBe(SRC_2568);
    expect(pack.meta.officialSources.map((s) => s.url).join(' ')).not.toContain('72766');
  });

  it('gazette ref for 2562 does not claim an unverified page number', () => {
    const s2562 = pack.meta.officialSources.find((s) => s.gazetteRef.includes('๑๓๖'))!;
    expect(s2562.gazetteRef).not.toContain('หน้า ๕๑');
  });

  it('effective date is 4 Sep 2568 = 6 Jun 2568 + 90 days', () => {
    const base = Date.UTC(2025, 5, 6); // 6 June 2025 (พ.ศ. 2568)
    const eff = new Date(base + 90 * 24 * 3600 * 1000);
    expect(eff.toISOString().slice(0, 10)).toBe('2025-09-04');
    expect(pack.meta.effectiveDate).toBe('2568-09-04');
  });

  it('no legal text carries claims that are not in the notice ("โมฆะ", "ข้อ ๕ ที่ห้ามมิให้")', () => {
    const text = JSON.stringify(pack);
    expect(text).not.toContain('โมฆะ');
    expect(text).not.toContain('ข้อ ๕ ที่ห้ามมิให้');
    expect(text).not.toContain('๕ หน่วยขึ้นไป');
  });
});
