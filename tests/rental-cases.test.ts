import { describe, it, expect } from 'vitest';
import rentalPackJson from '../packs/rental/pack.json';
import { rentalPackRules } from '../packs/rental/rules';
import rentalCasesJson from '../packs/rental/cases.json';
import { evaluatePack } from '../lib/engine/evaluator';
import { PackDefinition, TestCase } from '../lib/engine/types';

describe('Rental Pack Cases Verification (15 ชุดตัวอย่างแต่งขึ้น)', () => {
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

  it('summary: all 15 hypothetical cases match expected outputs 100%', () => {
    expect(passedCasesCount).toBe(15);
    console.log(`\n========================================`);
    console.log(`Rental Cases Test Summary: 15 / 15 Cases Passed (100% Match)`);
    console.log(`All cases are explicitly verified as hypothetical examples.`);
    console.log(`========================================\n`);
  });
});

