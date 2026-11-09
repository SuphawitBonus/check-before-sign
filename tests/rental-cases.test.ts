import { describe, it, expect } from 'vitest';
import rentalPackJson from '../packs/rental/pack.json';
import { rentalPackRules } from '../packs/rental/rules';
import rentalCasesJson from '../packs/rental/cases.json';
import { evaluatePack } from '../lib/engine/evaluator';
import { PackDefinition, TestCase } from '../lib/engine/types';

describe('Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น)', () => {
  const rentalPack = rentalPackJson as PackDefinition;
  const cases = rentalCasesJson as TestCase[];

  let passedCasesCount = 0;

  cases.forEach((testCase, index) => {
    it(`Case ${index + 1} (${testCase.id}): ${testCase.title}`, () => {
      // Must be marked hypothetical per legal non-negotiables
      expect(testCase.isHypothetical).toBe(true);

      const result = evaluatePack(rentalPack, rentalPackRules, testCase.answers);

      if (testCase.expected.isOutOfScope !== undefined) {
        expect(result.isOutOfScope).toBe(testCase.expected.isOutOfScope);
      }

      if (!testCase.expected.isOutOfScope) {
        if (testCase.expected.violatedCount !== undefined) {
          expect(result.overallSummary.violatedCount).toBe(testCase.expected.violatedCount);
        }
        if (testCase.expected.compliantCount !== undefined) {
          expect(result.overallSummary.compliantCount).toBe(testCase.expected.compliantCount);
        }
        if (testCase.expected.undeterminedCount !== undefined) {
          expect(result.overallSummary.undeterminedCount).toBe(testCase.expected.undeterminedCount);
        }
      }

      passedCasesCount++;
    });
  });

  it('has at least 15 cases and every case answers only questions that exist in pack.json', () => {
    expect(cases.length).toBeGreaterThanOrEqual(15);
    const qIds = new Set(rentalPack.questions.map((q) => q.id));
    for (const c of cases) {
      for (const key of Object.keys(c.answers)) {
        expect(qIds.has(key), `${c.id}: unknown question ${key}`).toBe(true);
      }
    }
  });

  it('every in-scope case sums to the number of rules (counts are exhaustive)', () => {
    for (const c of cases) {
      if (c.expected.isOutOfScope) continue;
      const { violatedCount = 0, compliantCount = 0, undeterminedCount = 0 } = c.expected;
      expect(violatedCount + compliantCount + undeterminedCount, c.id).toBe(rentalPack.rules.length);
    }
  });

  it('summary: all hypothetical cases match expected outputs 100%', () => {
    expect(passedCasesCount).toBe(cases.length);
    console.log(`\n========================================`);
    console.log(`Rental Cases Test Summary: ${passedCasesCount} / ${cases.length} Cases Passed (100% Match)`);
    console.log(`All cases are explicitly verified as hypothetical examples.`);
    console.log(`========================================\n`);
  });
});

