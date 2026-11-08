import {
  PackRules,
  ScopeEvaluator,
  RuleEvaluator,
  RuleEvalOutput,
} from '../../lib/engine/types';

export const evaluateRentalScope: ScopeEvaluator = (answers) => {
  const scopeAns = answers.q_scope;

  if (scopeAns === 'in_scope') {
    return {
      inScope: true,
      reason: 'อยู่ในขอบเขตความคุ้มครองของประกาศ สคบ. (เช่าเพื่ออยู่อาศัย และผู้ให้เช่ามีห้องให้เช่าตั้งแต่ 3 หน่วยขึ้นไป)',
    };
  }

  if (scopeAns === 'out_dorm_act') {
    return {
      inScope: false,
      reason: 'หอพักในสถานศึกษา (หอในมหาวิทยาลัย) หรือหอพักตาม พ.ร.บ. หอพัก พ.ศ. ๒๕๕๘ ไม่อยู่ในขอบเขตการกำกับของประกาศ สคบ. ฉบับนี้ (กำกับดูแลโดย พม. และสถานศึกษา)',
    };
  }

  if (scopeAns === 'out_hotel') {
    return {
      inScope: false,
      reason: 'โรงแรมหรือสถานที่พักรายวันตาม พ.ร.บ. โรงแรม ไม่อยู่ในขอบเขตประกาศควบคุมสัญญาเช่าที่อยู่อาศัยของ สคบ.',
    };
  }

  if (scopeAns === 'out_few_units') {
    return {
      inScope: false,
      reason: 'ผู้ให้เช่ามีห้องหรือบ้านให้เช่าเพียง 1–2 หลัง/ห้อง จึงไม่เข้าข่ายเป็น "ผู้ประกอบธุรกิจ" ที่ควบคุมสัญญาตามเกณฑ์ สคบ. (ต้องมีตั้งแต่ 3 หน่วยขึ้นไป)',
    };
  }

  if (scopeAns === 'out_commercial') {
    return {
      inScope: false,
      reason: 'การเช่าเพื่อทำร้านค้า ออฟฟิศ หรือประกอบธุรกิจ ไม่อยู่ในขอบเขตประกาศนี้ (ประกาศนี้คุ้มครองเฉพาะบุคคลธรรมดาที่เช่าเพื่ออยู่อาศัยเท่านั้น)',
    };
  }

  return {
    inScope: 'undetermined',
    reason: 'ข้อมูลไม่เพียงพอ หรือผู้ใช้ระบุไม่แน่ใจเกี่ยวกับลักษณะที่พักและจำนวนห้องของผู้ให้เช่า',
  };
};

export const rules: Record<string, RuleEvaluator> = {
  rule_rental_scope: (answers): RuleEvalOutput => {
    const scopeAns = answers.q_scope;
    if (scopeAns === 'in_scope') {
      return {
        status: 'compliant',
        reason: 'สัญญาอยู่ในขอบเขตการบังคับใช้ของประกาศคณะกรรมการว่าด้วยสัญญา สคบ.',
      };
    }
    if (scopeAns === '__unsure__' || scopeAns === undefined) {
      return {
        status: 'undetermined',
        reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือไม่ได้ระบุประเภทที่พักและจำนวนห้องของผู้ให้เช่า',
      };
    }
    return {
      status: 'violated',
      reason: 'สัญญาไม่อยู่ในขอบเขตการคุ้มครองของประกาศ สคบ. เรื่องธุรกิจการให้เช่าอาคารเพื่ออยู่อาศัย',
    };
  },

  rule_deposit_amount: (answers): RuleEvalOutput => {
    const val = answers.q_deposit;
    if (val === '__unsure__' || val === undefined || val === null || val === '') {
      return {
        status: 'undetermined',
        reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุจำนวนเงินประกันที่เรียกเก็บ',
      };
    }

    const num = Number(val);
    if (isNaN(num)) {
      return {
        status: 'undetermined',
        reason: 'ข้อมูลจำนวนเงินประกันไม่ถูกต้อง',
      };
    }

    if (num > 2) {
      return {
        status: 'violated',
        reason: `สัญญาเรียกเก็บเงินประกัน ${num} เดือน ซึ่งเกินกว่าอัตราที่กฎหมายกำหนด (ตามประกาศ สคบ. กำหนดให้เรียกเก็บเงินประกันไม่เกินอัตราที่กฎหมายกำหนด และรวมกับค่าเช่าล่วงหน้าต้องไม่เกิน 3 เดือน)`,
      };
    }

    if (num <= 1) {
      return {
        status: 'compliant',
        reason: `สัญญาเรียกเก็บเงินประกัน ${num} เดือน ซึ่งไม่เกิน 1 เดือนของค่าเช่ารายเดือน ถูกต้องตามประกาศ สคบ.`,
      };
    }

    // 1 < num <= 2: Check if advance rent is also known
    const adv = Number(answers.q_advance_rent);
    if (!isNaN(adv)) {
      if (num + adv > 3) {
        return {
          status: 'violated',
          reason: `เรียกเก็บเงินประกัน ${num} เดือน เมื่อรวมกับค่าเช่าล่วงหน้า ${adv} เดือน เป็น ${num + adv} เดือน ซึ่งเกินเพดาน 3 เดือนตามประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘`,
        };
      }
      return {
        status: 'compliant',
        reason: `เรียกเก็บเงินประกัน ${num} เดือน และเมื่อรวมกับค่าเช่าล่วงหน้าไม่เกิน 3 เดือน เป็นไปตามเกณฑ์ประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘`,
      };
    }

    // If advance rent unknown, but deposit is 2 months, complies with 2568 max deposit assuming 1 month advance
    return {
      status: 'compliant',
      reason: `สัญญาเรียกเก็บเงินประกัน ${num} เดือน ซึ่งยังอยู่ในเกณฑ์ที่ประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘ อนุญาต`,
    };
  },

  rule_advance_rent: (answers): RuleEvalOutput => {
    const val = answers.q_advance_rent;
    if (val === '__unsure__' || val === undefined || val === null || val === '') {
      return {
        status: 'undetermined',
        reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุจำนวนค่าเช่าล่วงหน้า',
      };
    }

    const num = Number(val);
    if (isNaN(num)) {
      return {
        status: 'undetermined',
        reason: 'ข้อมูลจำนวนค่าเช่าล่วงหน้าไม่ถูกต้อง',
      };
    }

    if (num > 1) {
      return {
        status: 'violated',
        reason: `สัญญาเรียกเก็บค่าเช่าล่วงหน้า ${num} เดือน ซึ่งเกินกว่า 1 เดือน ขัดต่อประกาศ สคบ. ที่จำกัดให้เรียกเก็บได้ไม่เกินหนึ่งเดือนของอัตราค่าเช่ารายเดือน`,
      };
    }

    return {
      status: 'compliant',
      reason: `สัญญาเรียกเก็บค่าเช่าล่วงหน้า ${num} เดือน ซึ่งไม่เกิน 1 เดือน ถูกต้องตามที่ประกาศ สคบ. กำหนด`,
    };
  },

  rule_combined_deposit_advance: (answers): RuleEvalOutput => {
    // Check direct calculation first
    const dep = Number(answers.q_deposit);
    const adv = Number(answers.q_advance_rent);
    if (!isNaN(dep) && !isNaN(adv)) {
      const total = dep + adv;
      if (total > 3) {
        return {
          status: 'violated',
          reason: `ยอดรวมเงินประกัน (${dep} เดือน) และค่าเช่าล่วงหน้า (${adv} เดือน) รวมกันได้ ${total} เดือน ซึ่งเกินกว่า 3 เดือนของอัตราค่าเช่ารายเดือน ขัดต่อประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘`,
        };
      }
      return {
        status: 'compliant',
        reason: `ยอดรวมเงินประกันและค่าเช่าล่วงหน้าคือ ${total} เดือน ซึ่งไม่เกิน 3 เดือนของอัตราค่าเช่ารายเดือน ถูกต้องตามประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘`,
      };
    }

    const choice = answers.q_combined_deposit_advance;
    if (choice === 'over_3') {
      return {
        status: 'violated',
        reason: 'ยอดรวมเงินประกันและค่าเช่าล่วงหน้าเกินกว่า 3 เดือนของอัตราค่าเช่ารายเดือน ขัดต่อประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘',
      };
    }

    if (choice === 'not_over_3') {
      return {
        status: 'compliant',
        reason: 'ยอดรวมเงินประกันและค่าเช่าล่วงหน้าไม่เกิน 3 เดือน ถูกต้องตามประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ข้อมูลไม่เพียงพอ หรือผู้ใช้ระบุไม่แน่ใจเกี่ยวกับยอดรวมเงินประกันและค่าเช่าล่วงหน้า',
    };
  },

  rule_electricity_tariff: (answers): RuleEvalOutput => {
    const val = answers.q_electricity_rate;
    if (val === 'flat_fixed_high') {
      return {
        status: 'violated',
        reason: 'สัญญาระบุอัตราค่าไฟฟ้าคงที่สูงกว่าการไฟฟ้า หรือคิดเหมา ขัดต่อประกาศ สคบ. ข้อ ๕ ที่ห้ามมิให้ผู้ประกอบธุรกิจเรียกเก็บค่าใช้จ่ายเกี่ยวกับกระแสไฟฟ้าเกินกว่าอัตราที่ผู้ให้บริการกระแสไฟฟ้าเรียกเก็บจริง',
      };
    }

    if (val === 'actual_rate') {
      return {
        status: 'compliant',
        reason: 'สัญญาระบุคิดค่าไฟฟ้าตามอัตราที่การไฟฟ้า (กฟน./กฟภ.) เรียกเก็บจริงโดยไม่บวกกำไรส่วนต่าง ถูกต้องตามประกาศ สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุอัตราค่าไฟฟ้าต่อหน่วยไว้อย่างชัดเจน',
    };
  },

  rule_water_tariff: (answers): RuleEvalOutput => {
    const val = answers.q_water_rate;
    if (val === 'flat_fixed_high') {
      return {
        status: 'violated',
        reason: 'สัญญาระบุอัตราค่าน้ำประปาคงที่สูงกว่าการประปา หรือคิดเหมาเกินจริง ขัดต่อประกาศ สคบ. ข้อ ๕ ที่ห้ามมิให้ผู้ประกอบธุรกิจเรียกเก็บค่าน้ำประปาเกินกว่าอัตราที่ผู้ให้บริการน้ำประปาเรียกเก็บจริง',
      };
    }

    if (val === 'actual_rate') {
      return {
        status: 'compliant',
        reason: 'สัญญาระบุคิดค่าน้ำประปาตามอัตราที่การประปา (กปน./กปภ.) เรียกเก็บจริงโดยไม่บวกกำไรส่วนต่าง ถูกต้องตามประกาศ สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุอัตราค่าน้ำประปาต่อหน่วยไว้อย่างชัดเจน',
    };
  },

  rule_deposit_refund_period: (answers): RuleEvalOutput => {
    const val = answers.q_deposit_refund_period;
    if (val === 'over_7_days') {
      return {
        status: 'violated',
        reason: 'สัญญากำหนดระยะเวลาคืนเงินประกันช้ากว่า 7 วันทำการ (เช่น 15–60 วัน) ขัดต่อประกาศ สคบ. ฉบับ พ.ศ. ๒๕๖๘ ที่กำหนดให้ต้องคืนเงินประกันทันทีหรือภายใน 7 วันทำการเมื่อส่งมอบห้องคืนเรียบร้อย',
      };
    }

    if (val === 'within_7_days') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดคืนเงินประกันภายใน 7 วันทำการ หรือคืนทันทีเมื่อตรวจรับห้องคืน สอดคล้องกับมาตรฐานประกาศ สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุกำหนดวันคืนเงินประกัน',
    };
  },

  rule_deposit_forfeiture: (answers): RuleEvalOutput => {
    const val = answers.q_deposit_forfeiture;
    if (val === 'has_automatic_forfeit') {
      return {
        status: 'violated',
        reason: 'สัญญามีข้อความให้ริบเงินประกันทั้งหมดทันทีไม่ว่ากรณีใด ๆ ขัดต่อประกาศ สคบ. ข้อ ๕ ที่ห้ามมิให้มีข้อสัญญาที่มีลักษณะริบเงินประกันโดยไม่มีเหตุผลอันสมควร หรือโดยที่ผู้ประกอบธุรกิจไม่ได้รับความเสียหายตามจริง',
      };
    }

    if (val === 'no_automatic_forfeit') {
      return {
        status: 'compliant',
        reason: 'สัญญาไม่มีข้อความริบเงินประกันทั้งหมดตามอำเภอใจ และจำกัดการหักเงินเฉพาะความเสียหายจริงที่พิสูจน์ได้ ถูกต้องตามประกาศ สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเงื่อนไขการริบเงินประกัน',
    };
  },

  rule_tenant_termination: (answers): RuleEvalOutput => {
    const val = answers.q_tenant_termination;
    if (val === 'strictly_prohibited') {
      return {
        status: 'violated',
        reason: 'สัญญาระบุห้ามผู้เช่าบอกเลิกสัญญาก่อนกำหนดทุกกรณี ขัดต่อประกาศ สคบ. ที่ให้สิทธิผู้เช่าสามารถบอกเลิกสัญญาก่อนครบกำหนดได้ หากเช่ามาแล้วไม่น้อยกว่ากึ่งหนึ่งของระยะเวลาตามสัญญา และมีหนังสือบอกกล่าวล่วงหน้าไม่น้อยกว่า 30 วัน',
      };
    }

    if (val === 'allowed_with_notice') {
      return {
        status: 'compliant',
        reason: 'สัญญารับรองสิทธิให้ผู้เช่าบอกเลิกสัญญาก่อนกำหนดได้เมื่อแจ้งล่วงหน้าตามสมควร ถูกต้องตามแนวทางของประกาศ สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุสิทธิการบอกเลิกสัญญาของผู้เช่า',
    };
  },

  rule_lessor_termination_notice: (answers): RuleEvalOutput => {
    const val = answers.q_lessor_termination_notice;
    if (val === 'immediate_termination') {
      return {
        status: 'violated',
        reason: 'สัญญาระบุให้ผู้ให้เช่าบอกเลิกสัญญาหรือขับไล่ผู้เช่าได้ทันทีโดยไม่ต้องบอกกล่าว ขัดต่อประกาศ สคบ. ที่กำหนดว่าผู้ให้เช่าต้องมีหนังสือบอกกล่าวล่วงหน้าไม่น้อยกว่า 30 วัน (หรือ 7 วันกรณีค้างค่าเช่า) เพื่อให้ผู้เช่าแก้ไขก่อน',
      };
    }

    if (val === 'proper_notice') {
      return {
        status: 'compliant',
        reason: 'สัญญากำหนดให้ต้องมีหนังสือบอกกล่าวแจ้งเตือนล่วงหน้าก่อนบอกเลิกสัญญา ถูกต้องตามขั้นตอนของกฎหมาย',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุขั้นตอนการบอกกล่าวบอกเลิกสัญญาของผู้ให้เช่า',
    };
  },

  rule_inspection_privacy: (answers): RuleEvalOutput => {
    const val = answers.q_inspection_without_notice;
    if (val === 'unannounced_entry') {
      return {
        status: 'violated',
        reason: 'สัญญาระบุให้ผู้ให้เช่าเข้าตรวจห้องพักได้ตลอดเวลาโดยไม่ต้องแจ้งล่วงหน้า ขัดต่อประกาศ สคบ. ข้อ ๕ ที่ห้ามมิให้มีข้อสัญญาให้สิทธิผู้ให้เช่าเข้าไปในห้องโดยไม่แจ้งล่วงหน้า เว้นแต่มีเหตุฉุกเฉิน',
      };
    }

    if (val === 'notice_required') {
      return {
        status: 'compliant',
        reason: 'สัญญาระบุกำหนดให้ต้องแจ้งนัดหมายผู้เช่าล่วงหน้าก่อนเข้าตรวจห้องพัก คุ้มครองความเป็นส่วนตัวตามมาตรฐาน สคบ.',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเงื่อนไขการเข้าตรวจสอบห้องพัก',
    };
  },

  rule_self_help_lockout: (answers): RuleEvalOutput => {
    const val = answers.q_lockout_and_seizure;
    if (val === 'has_lockout_clause') {
      return {
        status: 'violated',
        reason: 'สัญญามีข้อความให้อำนาจผู้ให้เช่าล็อกห้อง ตัดน้ำตัดไฟ หรือยึดทรัพย์สินของผู้เช่าได้ทันที ขัดต่อประกาศ สคบ. ข้อ ๕ อย่างร้ายแรง ข้อสัญญาดังกล่าวตกเป็นโมฆะตามกฎหมาย',
      };
    }

    if (val === 'no_lockout_clause') {
      return {
        status: 'compliant',
        reason: 'สัญญาไม่มีข้อสัญญาให้อำนาจปิดกั้น ล็อกห้อง ตัดสาธารณูปโภค หรือยึดทรัพย์สินโดยพลการ ถูกต้องตามกฎหมาย',
      };
    }

    return {
      status: 'undetermined',
      reason: 'ผู้ใช้ระบุไม่แน่ใจ หรือในสัญญาไม่ได้ระบุเรื่องการบังคับยึดทรัพย์หรือล็อกห้อง',
    };
  },
};

export const rentalPackRules: PackRules = {
  evaluateScope: evaluateRentalScope,
  rules,
};
