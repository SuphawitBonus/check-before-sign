import {
  PackDefinition,
  PackRules,
  EvaluationOutput,
  RuleEvaluationResult,
} from './types';

export function evaluatePack(
  pack: PackDefinition,
  packRules: PackRules,
  answers: Record<string, any>
): EvaluationOutput {
  const scopeResult = packRules.evaluateScope(answers);

  if (scopeResult.inScope === false) {
    return {
      packId: pack.meta.id,
      packTitle: pack.meta.title,
      timestamp: new Date().toISOString(),
      isOutOfScope: true,
      scopeReason: scopeResult.reason,
      overallSummary: {
        violatedCount: 0,
        compliantCount: 0,
        undeterminedCount: 0,
        totalEvaluated: 0,
      },
      results: [],
      helpChannels: pack.meta.helpChannels,
      disclaimer: pack.meta.disclaimer,
      effectiveDateDisplay: pack.meta.effectiveDateDisplay,
      officialSources: pack.meta.officialSources,
    };
  }

  const results: RuleEvaluationResult[] = [];
  let violatedCount = 0;
  let compliantCount = 0;
  let undeterminedCount = 0;

  for (const ruleDef of pack.rules) {
    const evaluator = packRules.rules[ruleDef.id];
    let output: { status: 'violated' | 'compliant' | 'undetermined'; reason: string; customNegotiationText?: string };

    if (!evaluator) {
      output = {
        status: 'undetermined',
        reason: 'ไม่มีฟังก์ชันตรวจสอบกฎข้อนี้ในระบบ',
      };
    } else {
      try {
        output = evaluator(answers);
      } catch (err) {
        output = {
          status: 'undetermined',
          reason: 'เกิดข้อผิดพลาดในการประมวลผลกฎนี้',
        };
      }
    }

    if (output.status === 'violated') {
      violatedCount++;
    } else if (output.status === 'compliant') {
      compliantCount++;
    } else {
      undeterminedCount++;
    }

    results.push({
      ruleId: ruleDef.id,
      title: ruleDef.title,
      status: output.status,
      reason: output.reason,
      legalRef: ruleDef.legalRef,
      politeNegotiationText: output.customNegotiationText || ruleDef.politeNegotiationTemplate,
      complaintGuide: ruleDef.complaintGuide,
    });
  }

  return {
    packId: pack.meta.id,
    packTitle: pack.meta.title,
    timestamp: new Date().toISOString(),
    isOutOfScope: false,
    scopeReason: scopeResult.reason,
    overallSummary: {
      violatedCount,
      compliantCount,
      undeterminedCount,
      totalEvaluated: results.length,
    },
    results,
    helpChannels: pack.meta.helpChannels,
    disclaimer: pack.meta.disclaimer,
    effectiveDateDisplay: pack.meta.effectiveDateDisplay,
    officialSources: pack.meta.officialSources,
  };
}
