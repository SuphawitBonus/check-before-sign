import {
  PackDefinition,
  PackRules,
  EvaluationOutput,
  RuleEvaluationResult,
  Question,
  QuestionnaireEnd,
} from './types';

export const UNSURE_VALUE = '__unsure__';

/**
 * Does this single answer end the questionnaire? Driven purely by pack.json
 * (`option.endsQuestionnaire` / `question.unsureEndsQuestionnaire`).
 */
export function getQuestionnaireEnd(
  question: Question,
  answer: unknown
): { end: QuestionnaireEnd; answerLabel: string } | null {
  if (answer === UNSURE_VALUE) {
    return question.unsureEndsQuestionnaire
      ? { end: question.unsureEndsQuestionnaire, answerLabel: question.unsureLabel || 'ไม่แน่ใจ' }
      : null;
  }
  const opt = question.options?.find((o) => o.value === answer);
  return opt?.endsQuestionnaire ? { end: opt.endsQuestionnaire, answerLabel: opt.label } : null;
}

/** The first question (in pack order) whose answer ends the questionnaire, if any. */
export function findQuestionnaireEnd(
  pack: PackDefinition,
  answers: Record<string, any>
): { question: Question; end: QuestionnaireEnd; answerLabel: string } | null {
  for (const question of pack.questions) {
    const hit = getQuestionnaireEnd(question, answers[question.id]);
    if (hit) return { question, ...hit };
  }
  return null;
}

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

  // Out of scope takes precedence; after that, an answer that ends the
  // questionnaire short-circuits every rule to "undetermined".
  const ended = findQuestionnaireEnd(pack, answers);

  const results: RuleEvaluationResult[] = [];
  let violatedCount = 0;
  let compliantCount = 0;
  let undeterminedCount = 0;

  for (const ruleDef of pack.rules) {
    const evaluator = packRules.rules[ruleDef.id];
    let output: { status: 'violated' | 'compliant' | 'undetermined'; reason: string; customNegotiationText?: string };

    if (ended) {
      output = {
        status: 'undetermined',
        reason: ended.end.ruleReason || ended.end.reason,
      };
    } else if (!evaluator) {
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
    ...(ended
      ? {
          endedEarly: {
            questionId: ended.question.id,
            questionText: ended.question.text,
            answerLabel: ended.answerLabel,
            reason: ended.end.reason,
          },
        }
      : {}),
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

