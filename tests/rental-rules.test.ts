import { describe, it, expect } from 'vitest';
import { evaluateRentalScope, rules } from '../packs/rental/rules';

describe('Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ)', () => {
  describe('Scope Gatekeeper: evaluateRentalScope', () => {
    it('returns inScope: true for standard residential rental', () => {
      const res = evaluateRentalScope({ q_scope: 'in_scope' });
      expect(res.inScope).toBe(true);
      expect(res.reason).toContain('อยู่ในขอบเขตความคุ้มครอง');
    });

    it('returns inScope: false for university dorms (exclusion)', () => {
      const res = evaluateRentalScope({ q_scope: 'out_dorm_act' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('หอพักในสถานศึกษา');
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
    });

    it('returns inScope: false for commercial rentals', () => {
      const res = evaluateRentalScope({ q_scope: 'out_commercial' });
      expect(res.inScope).toBe(false);
      expect(res.reason).toContain('ร้านค้า ออฟฟิศ หรือประกอบธุรกิจ');
    });

    it('returns inScope: undetermined when unsure', () => {
      const res = evaluateRentalScope({ q_scope: '__unsure__' });
      expect(res.inScope).toBe('undetermined');
    });
  });

  describe('rule_rental_scope', () => {
    it('returns compliant when in_scope', () => {
      expect(rules.rule_rental_scope({ q_scope: 'in_scope' }).status).toBe('compliant');
    });
    it('returns violated when out of scope', () => {
      expect(rules.rule_rental_scope({ q_scope: 'out_hotel' }).status).toBe('violated');
    });
    it('returns undetermined when unsure', () => {
      expect(rules.rule_rental_scope({ q_scope: '__unsure__' }).status).toBe('undetermined');
    });
  });

  describe('rule_deposit_amount (เงินประกันความเสียหาย)', () => {
    it('compliant: deposit = 1 month', () => {
      const res = rules.rule_deposit_amount({ q_deposit: 1 });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('ไม่เกิน 1 เดือน');
    });

    it('compliant boundary: deposit = 2 months with advance = 1 month (total = 3)', () => {
      const res = rules.rule_deposit_amount({ q_deposit: 2, q_advance_rent: 1 });
      expect(res.status).toBe('compliant');
    });

    it('violated boundary exceeded: deposit = 2.5 months with advance = 1 month', () => {
      const res = rules.rule_deposit_amount({ q_deposit: 2.5, q_advance_rent: 1 });
      expect(res.status).toBe('violated');
    });

    it('violated: deposit = 3 months', () => {
      const res = rules.rule_deposit_amount({ q_deposit: 3 });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('เกินกว่าอัตราที่กฎหมายกำหนด');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_deposit_amount({ q_deposit: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_deposit_amount({}).status).toBe('undetermined');
    });
  });

  describe('rule_advance_rent (ค่าเช่าล่วงหน้า)', () => {
    it('compliant boundary: advance = 1 month', () => {
      const res = rules.rule_advance_rent({ q_advance_rent: 1 });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('ไม่เกิน 1 เดือน');
    });

    it('compliant: advance = 0.5 month', () => {
      expect(rules.rule_advance_rent({ q_advance_rent: 0.5 }).status).toBe('compliant');
    });

    it('violated boundary exceeded: advance = 1.5 months', () => {
      const res = rules.rule_advance_rent({ q_advance_rent: 1.5 });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('เกินกว่า 1 เดือน');
    });

    it('violated: advance = 2 months', () => {
      expect(rules.rule_advance_rent({ q_advance_rent: 2 }).status).toBe('violated');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_advance_rent({ q_advance_rent: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_advance_rent({}).status).toBe('undetermined');
    });
  });

  describe('rule_combined_deposit_advance (ยอดรวมเงินประกัน + ค่าเช่าล่วงหน้า)', () => {
    it('compliant boundary: deposit = 2, advance = 1 (total = 3)', () => {
      const res = rules.rule_combined_deposit_advance({ q_deposit: 2, q_advance_rent: 1 });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('ไม่เกิน 3 เดือน');
    });

    it('violated boundary exceeded: deposit = 2.5, advance = 1 (total = 3.5)', () => {
      const res = rules.rule_combined_deposit_advance({ q_deposit: 2.5, q_advance_rent: 1 });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('เกินกว่า 3 เดือน');
    });

    it('compliant via choice: not_over_3', () => {
      expect(rules.rule_combined_deposit_advance({ q_combined_deposit_advance: 'not_over_3' }).status).toBe('compliant');
    });

    it('violated via choice: over_3', () => {
      expect(rules.rule_combined_deposit_advance({ q_combined_deposit_advance: 'over_3' }).status).toBe('violated');
    });

    it('undetermined: unsure or empty', () => {
      expect(rules.rule_combined_deposit_advance({ q_combined_deposit_advance: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_combined_deposit_advance({}).status).toBe('undetermined');
    });
  });

  describe('rule_electricity_tariff (ค่าไฟฟ้า)', () => {
    it('compliant: actual_rate', () => {
      const res = rules.rule_electricity_tariff({ q_electricity_rate: 'actual_rate' });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('ไม่บวกกำไรส่วนต่าง');
    });

    it('violated: flat_fixed_high', () => {
      const res = rules.rule_electricity_tariff({ q_electricity_rate: 'flat_fixed_high' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ห้ามมิให้ผู้ประกอบธุรกิจเรียกเก็บค่าใช้จ่ายเกี่ยวกับกระแสไฟฟ้าเกินกว่าอัตราที่ผู้ให้บริการกระแสไฟฟ้าเรียกเก็บจริง');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_electricity_tariff({ q_electricity_rate: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_electricity_tariff({}).status).toBe('undetermined');
    });
  });

  describe('rule_water_tariff (ค่าน้ำประปา)', () => {
    it('compliant: actual_rate', () => {
      const res = rules.rule_water_tariff({ q_water_rate: 'actual_rate' });
      expect(res.status).toBe('compliant');
      expect(res.reason).toContain('ไม่บวกกำไรส่วนต่าง');
    });

    it('violated: flat_fixed_high', () => {
      const res = rules.rule_water_tariff({ q_water_rate: 'flat_fixed_high' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ห้ามมิให้ผู้ประกอบธุรกิจเรียกเก็บค่าน้ำประปาเกินกว่าอัตราที่ผู้ให้บริการน้ำประปาเรียกเก็บจริง');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_water_tariff({ q_water_rate: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_water_tariff({}).status).toBe('undetermined');
    });
  });

  describe('rule_deposit_refund_period (ระยะเวลาคืนเงินประกัน)', () => {
    it('compliant: within_7_days', () => {
      const res = rules.rule_deposit_refund_period({ q_deposit_refund_period: 'within_7_days' });
      expect(res.status).toBe('compliant');
    });

    it('violated: over_7_days', () => {
      const res = rules.rule_deposit_refund_period({ q_deposit_refund_period: 'over_7_days' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ช้ากว่า 7 วันทำการ');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_deposit_refund_period({ q_deposit_refund_period: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_deposit_refund_period({}).status).toBe('undetermined');
    });
  });

  describe('rule_deposit_forfeiture (การริบเงินประกัน)', () => {
    it('compliant: no_automatic_forfeit', () => {
      const res = rules.rule_deposit_forfeiture({ q_deposit_forfeiture: 'no_automatic_forfeit' });
      expect(res.status).toBe('compliant');
    });

    it('violated: has_automatic_forfeit', () => {
      const res = rules.rule_deposit_forfeiture({ q_deposit_forfeiture: 'has_automatic_forfeit' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ห้ามมิให้มีข้อสัญญาที่มีลักษณะริบเงินประกันโดยไม่มีเหตุผลอันสมควร');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_deposit_forfeiture({ q_deposit_forfeiture: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_deposit_forfeiture({}).status).toBe('undetermined');
    });
  });

  describe('rule_tenant_termination (สิทธิบอกเลิกสัญญาของผู้เช่า)', () => {
    it('compliant: allowed_with_notice', () => {
      const res = rules.rule_tenant_termination({ q_tenant_termination: 'allowed_with_notice' });
      expect(res.status).toBe('compliant');
    });

    it('violated: strictly_prohibited', () => {
      const res = rules.rule_tenant_termination({ q_tenant_termination: 'strictly_prohibited' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ห้ามผู้เช่าบอกเลิกสัญญาก่อนกำหนดทุกกรณี');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_tenant_termination({ q_tenant_termination: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_tenant_termination({}).status).toBe('undetermined');
    });
  });

  describe('rule_lessor_termination_notice (การบอกกล่าวของผู้ให้เช่า)', () => {
    it('compliant: proper_notice', () => {
      const res = rules.rule_lessor_termination_notice({ q_lessor_termination_notice: 'proper_notice' });
      expect(res.status).toBe('compliant');
    });

    it('violated: immediate_termination', () => {
      const res = rules.rule_lessor_termination_notice({ q_lessor_termination_notice: 'immediate_termination' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ขับไล่ผู้เช่าได้ทันทีโดยไม่ต้องบอกกล่าว');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_lessor_termination_notice({ q_lessor_termination_notice: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_lessor_termination_notice({}).status).toBe('undetermined');
    });
  });

  describe('rule_inspection_privacy (การเข้าตรวจห้องพัก)', () => {
    it('compliant: notice_required', () => {
      const res = rules.rule_inspection_privacy({ q_inspection_without_notice: 'notice_required' });
      expect(res.status).toBe('compliant');
    });

    it('violated: unannounced_entry', () => {
      const res = rules.rule_inspection_privacy({ q_inspection_without_notice: 'unannounced_entry' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('เข้าตรวจห้องพักได้ตลอดเวลาโดยไม่ต้องแจ้งล่วงหน้า');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_inspection_privacy({ q_inspection_without_notice: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_inspection_privacy({}).status).toBe('undetermined');
    });
  });

  describe('rule_self_help_lockout (การล็อกห้อง/ยึดทรัพย์)', () => {
    it('compliant: no_lockout_clause', () => {
      const res = rules.rule_self_help_lockout({ q_lockout_and_seizure: 'no_lockout_clause' });
      expect(res.status).toBe('compliant');
    });

    it('violated: has_lockout_clause', () => {
      const res = rules.rule_self_help_lockout({ q_lockout_and_seizure: 'has_lockout_clause' });
      expect(res.status).toBe('violated');
      expect(res.reason).toContain('ล็อกห้อง ตัดน้ำตัดไฟ หรือยึดทรัพย์สิน');
    });

    it('undetermined: unsure or missing', () => {
      expect(rules.rule_self_help_lockout({ q_lockout_and_seizure: '__unsure__' }).status).toBe('undetermined');
      expect(rules.rule_self_help_lockout({}).status).toBe('undetermined');
    });
  });
});
