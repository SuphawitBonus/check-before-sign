import { describe, it, expect } from 'vitest';
import dummyPackJson from './fixtures/dummy-pack/pack.json';
import { dummyPackRules } from './fixtures/dummy-pack/rules';
import { evaluatePack, getQuestionnaireEnd, findQuestionnaireEnd } from '../lib/engine/evaluator';
import { encodeAnswersToShareHash, decodeAnswersFromShareHash } from '../lib/engine/sharing';
import { PackDefinitionSchema } from '../lib/engine/schema';
import { PackDefinition } from '../lib/engine/types';

describe('Engine Core (Decoupled from Rental Pack)', () => {
  const dummyPack = dummyPackJson as PackDefinition;

  it('validates dummy pack against Zod schema', () => {
    const validated = PackDefinitionSchema.parse(dummyPack);
    expect(validated.meta.id).toBe('dummy-license');
    expect(validated.questions).toHaveLength(4);
    expect(validated.rules).toHaveLength(2);
  });

  describe('Questionnaire-ending answers (declared in pack.json)', () => {
    it('an option with endsQuestionnaire → every rule undetermined with the declared ruleReason', () => {
      const answers = {
        q_dummy_scope: 'in_scope',
        q_dummy_version: 'legacy',
        // Later answers would be violated/compliant — the engine must ignore them.
        q_dummy_fee: 500,
        q_dummy_notice: 'yes',
      };
      const result = evaluatePack(dummyPack, dummyPackRules, answers);

      expect(result.isOutOfScope).toBe(false);
      expect(result.overallSummary).toEqual({
        violatedCount: 0,
        compliantCount: 0,
        undeterminedCount: 2,
        totalEvaluated: 2,
      });
      for (const r of result.results) {
        expect(r.status).toBe('undetermined');
        expect(r.reason).toBe('ฉบับเก่า — บอกไม่ได้');
      }
      expect(result.endedEarly).toEqual({
        questionId: 'q_dummy_version',
        questionText: 'เอกสารนี้ออกภายใต้กฎจำลองฉบับใด?',
        answerLabel: 'ฉบับเก่าที่ระบบยังไม่ได้ตรวจ',
        reason: 'เอกสารนี้อยู่ภายใต้กฎจำลองฉบับเก่าที่ระบบยังไม่ได้ตรวจ จึงตอบว่าบอกไม่ได้ทั้งชุด',
      });
    });

    it('works when nothing after the ending question was answered (the UI path)', () => {
      const result = evaluatePack(dummyPack, dummyPackRules, {
        q_dummy_scope: 'in_scope',
        q_dummy_version: 'legacy',
      });
      expect(result.endedEarly?.questionId).toBe('q_dummy_version');
      expect(result.overallSummary.undeterminedCount).toBe(2);
    });

    it('never runs the rule evaluators once the questionnaire has ended', () => {
      let calls = 0;
      const spyRules = {
        ...dummyPackRules,
        rules: Object.fromEntries(
          Object.entries(dummyPackRules.rules).map(([id, fn]) => [
            id,
            (a: Record<string, any>) => {
              calls++;
              return fn(a);
            },
          ])
        ),
      };
      evaluatePack(dummyPack, spyRules, { q_dummy_scope: 'in_scope', q_dummy_version: 'legacy', q_dummy_fee: 500 });
      expect(calls).toBe(0);
    });

    it('unsureEndsQuestionnaire ends on the unsure answer; ruleReason defaults to reason', () => {
      const result = evaluatePack(dummyPack, dummyPackRules, {
        q_dummy_scope: 'in_scope',
        q_dummy_version: '__unsure__',
        q_dummy_fee: 500,
      });
      expect(result.endedEarly?.answerLabel).toBe('ไม่แน่ใจฉบับ');
      expect(result.results.map((r) => r.reason)).toEqual([
        'ไม่ทราบฉบับของกฎจำลอง จึงตรวจไม่ได้ทั้งชุด',
        'ไม่ทราบฉบับของกฎจำลอง จึงตรวจไม่ได้ทั้งชุด',
      ]);
    });

    it('an option without endsQuestionnaire continues normally (no endedEarly)', () => {
      const result = evaluatePack(dummyPack, dummyPackRules, {
        q_dummy_scope: 'in_scope',
        q_dummy_version: 'current',
        q_dummy_fee: 150,
        q_dummy_notice: 'yes',
      });
      expect(result.endedEarly).toBeUndefined();
      expect(result.overallSummary.violatedCount).toBe(1);
      expect(result.overallSummary.compliantCount).toBe(1);
    });

    it('out of scope still takes precedence over an ending answer', () => {
      const result = evaluatePack(dummyPack, dummyPackRules, {
        q_dummy_scope: 'out_of_scope',
        q_dummy_version: 'legacy',
      });
      expect(result.isOutOfScope).toBe(true);
      expect(result.endedEarly).toBeUndefined();
      expect(result.results).toHaveLength(0);
    });

    it('getQuestionnaireEnd / findQuestionnaireEnd read only pack.json flags', () => {
      const versionQ = dummyPack.questions.find((q) => q.id === 'q_dummy_version')!;
      const feeQ = dummyPack.questions.find((q) => q.id === 'q_dummy_fee')!;
      expect(getQuestionnaireEnd(versionQ, 'legacy')?.answerLabel).toBe('ฉบับเก่าที่ระบบยังไม่ได้ตรวจ');
      expect(getQuestionnaireEnd(versionQ, 'current')).toBeNull();
      expect(getQuestionnaireEnd(versionQ, undefined)).toBeNull(); // not answered yet ≠ unsure
      expect(getQuestionnaireEnd(feeQ, '__unsure__')).toBeNull(); // no unsureEndsQuestionnaire declared
      expect(findQuestionnaireEnd(dummyPack, { q_dummy_version: 'current' })).toBeNull();
    });

    it('schema rejects an option that is both isOutOfScope and endsQuestionnaire', () => {
      const bad = structuredClone(dummyPackJson) as any;
      bad.questions[0].options[1].endsQuestionnaire = { reason: 'x' };
      expect(PackDefinitionSchema.safeParse(bad).success).toBe(false);
    });

    it('schema rejects unsureEndsQuestionnaire on a question without allowUnsure', () => {
      const bad = structuredClone(dummyPackJson) as any;
      bad.questions[1].allowUnsure = false;
      expect(PackDefinitionSchema.safeParse(bad).success).toBe(false);
    });

    it('schema rejects an endsQuestionnaire with an empty reason', () => {
      const bad = structuredClone(dummyPackJson) as any;
      bad.questions[1].options[1].endsQuestionnaire = { reason: '' };
      expect(PackDefinitionSchema.safeParse(bad).success).toBe(false);
    });
  });

  describe('Schema limits', () => {
    it('accepts 25 questions and rejects 26', () => {
      const make = (n: number) => {
        const p = structuredClone(dummyPackJson) as any;
        const extra = { id: 'q_extra', text: 'x', type: 'boolean', allowUnsure: true };
        while (p.questions.length < n) p.questions.push({ ...extra, id: `q_extra_${p.questions.length}` });
        return p;
      };
      expect(PackDefinitionSchema.safeParse(make(25)).success).toBe(true);
      expect(PackDefinitionSchema.safeParse(make(26)).success).toBe(false);
    });
  });

  it('stops evaluation early when out of scope', () => {
    const answers = {
      q_dummy_scope: 'out_of_scope',
      q_dummy_fee: 500, // Even though fee would be violated, engine must exit early
      q_dummy_notice: 'no',
    };

    const result = evaluatePack(dummyPack, dummyPackRules, answers);

    expect(result.isOutOfScope).toBe(true);
    expect(result.scopeReason).toContain('ไม่อยู่ในขอบเขต');
    expect(result.results).toHaveLength(0);
    expect(result.overallSummary.totalEvaluated).toBe(0);
  });

  it('evaluates all rules when in scope (compliant and violated)', () => {
    const answers = {
      q_dummy_scope: 'in_scope',
      q_dummy_fee: 150, // Violated (> 100)
      q_dummy_notice: 'yes', // Compliant
    };

    const result = evaluatePack(dummyPack, dummyPackRules, answers);

    expect(result.isOutOfScope).toBe(false);
    expect(result.overallSummary.violatedCount).toBe(1);
    expect(result.overallSummary.compliantCount).toBe(1);
    expect(result.overallSummary.undeterminedCount).toBe(0);
    expect(result.results).toHaveLength(2);

    const feeRule = result.results.find(r => r.ruleId === 'rule_dummy_fee_cap');
    expect(feeRule?.status).toBe('violated');
    expect(feeRule?.reason).toContain('150 บาท เกินเพดาน 100 บาท');

    const noticeRule = result.results.find(r => r.ruleId === 'rule_dummy_notice_required');
    expect(noticeRule?.status).toBe('compliant');
  });

  it('returns undetermined when answers are unsure or missing', () => {
    const answers = {
      q_dummy_scope: 'in_scope',
      q_dummy_fee: '__unsure__',
      q_dummy_notice: '__unsure__',
    };

    const result = evaluatePack(dummyPack, dummyPackRules, answers);

    expect(result.isOutOfScope).toBe(false);
    expect(result.overallSummary.violatedCount).toBe(0);
    expect(result.overallSummary.compliantCount).toBe(0);
    expect(result.overallSummary.undeterminedCount).toBe(2);
  });

  describe('Privacy-Safe Link Sharing', () => {
    it('encodes and decodes answers accurately without PII', () => {
      const answers = {
        q_dummy_scope: 'in_scope',
        q_dummy_fee: 99,
        q_dummy_notice: 'yes',
        // Attempt to pass PII fields
        userName: 'สมชาย ใจดี',
        userPhone: '0812345678',
        userEmail: 'somchai@example.com',
        userAddress: '123 ถนนสุขุมวิท กทม.',
      };

      const hash = encodeAnswersToShareHash(answers);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);

      const decoded = decodeAnswersFromShareHash(hash);
      expect(decoded).not.toBeNull();
      expect(decoded?.q_dummy_scope).toBe('in_scope');
      expect(decoded?.q_dummy_fee).toBe(99);
      expect(decoded?.q_dummy_notice).toBe('yes');

      // Guarantee no PII keys were encoded/decoded
      expect(decoded?.userName).toBeUndefined();
      expect(decoded?.userPhone).toBeUndefined();
      expect(decoded?.userEmail).toBeUndefined();
      expect(decoded?.userAddress).toBeUndefined();
    });

    it('returns null gracefully on invalid hash', () => {
      expect(decodeAnswersFromShareHash('')).toBeNull();
      expect(decodeAnswersFromShareHash('invalid-not-json-base64')).toBeNull();
    });
  });
});

