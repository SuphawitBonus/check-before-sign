import { describe, it, expect } from 'vitest';
import dummyPackJson from './fixtures/dummy-pack/pack.json';
import { dummyPackRules } from './fixtures/dummy-pack/rules';
import { evaluatePack } from '../lib/engine/evaluator';
import { encodeAnswersToShareHash, decodeAnswersFromShareHash } from '../lib/engine/sharing';
import { PackDefinitionSchema } from '../lib/engine/schema';
import { PackDefinition } from '../lib/engine/types';

describe('Engine Core (Decoupled from Rental Pack)', () => {
  const dummyPack = dummyPackJson as PackDefinition;

  it('validates dummy pack against Zod schema', () => {
    const validated = PackDefinitionSchema.parse(dummyPack);
    expect(validated.meta.id).toBe('dummy-license');
    expect(validated.questions).toHaveLength(3);
    expect(validated.rules).toHaveLength(2);
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
