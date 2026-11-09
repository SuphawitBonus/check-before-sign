export type RuleStatus = 'violated' | 'compliant' | 'undetermined';

export interface OfficialSource {
  title: string;
  url: string;
  gazetteRef: string;
  announcementDate?: string;
  effectiveDate: string;
}

export interface HelpChannel {
  name: string;
  tel?: string;
  url?: string;
  description?: string;
}

/**
 * Declared in pack.json on an option (or on a question for its "unsure" answer).
 * When that answer is chosen the questionnaire ends immediately and every rule
 * is reported as "undetermined" with this reason — the engine never runs the
 * rule evaluators, so it cannot produce "violated" / "compliant" by accident.
 */
export interface QuestionnaireEnd {
  /** Full explanation shown once at the top of the result page. */
  reason: string;
  /** Shorter text attached to each rule result. Defaults to `reason`. */
  ruleReason?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  helpText?: string;
  isOutOfScope?: boolean;
  endsQuestionnaire?: QuestionnaireEnd;
}

export interface Question {
  id: string;
  text: string;
  helpText?: string;
  type: 'choice' | 'number' | 'boolean';
  options?: QuestionOption[];
  allowUnsure: boolean;
  unsureLabel?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  isScopeQuestion?: boolean;
  /** Same as QuestionOption.endsQuestionnaire, but for the "unsure" answer (`__unsure__`). */
  unsureEndsQuestionnaire?: QuestionnaireEnd;
}

export interface LegalRef {
  clause: string;
  verbatim: string;
  sourceUrl: string;
}

export interface RuleDefinition {
  id: string;
  title: string;
  description: string;
  legalRef: LegalRef;
  politeNegotiationTemplate: string;
  complaintGuide?: string;
}

export interface PackMetadata {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  iconName: string;
  effectiveDate: string;
  effectiveDateDisplay: string;
  officialSources: OfficialSource[];
  helpChannels: HelpChannel[];
  disclaimer: string;
  scopeQuestionId: string;
  scopeClarification: {
    inScopeDescription: string;
    outOfScopeExamples: string[];
  };
}

export interface PackDefinition {
  meta: PackMetadata;
  questions: Question[];
  rules: RuleDefinition[];
}

export interface RuleEvalOutput {
  status: RuleStatus;
  reason: string;
  customNegotiationText?: string;
}

export type RuleEvaluator = (answers: Record<string, any>) => RuleEvalOutput;

export interface ScopeEvalOutput {
  inScope: boolean | 'undetermined';
  reason: string;
}

export type ScopeEvaluator = (answers: Record<string, any>) => ScopeEvalOutput;

export interface PackRules {
  evaluateScope: ScopeEvaluator;
  rules: Record<string, RuleEvaluator>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  title: string;
  status: RuleStatus;
  reason: string;
  legalRef: LegalRef;
  politeNegotiationText: string;
  complaintGuide?: string;
}

export interface EvaluationOutput {
  packId: string;
  packTitle: string;
  timestamp: string;
  isOutOfScope: boolean;
  scopeReason?: string;
  /** Present when an answer declared `endsQuestionnaire` stopped the questionnaire. */
  endedEarly?: {
    questionId: string;
    questionText: string;
    answerLabel: string;
    reason: string;
  };
  overallSummary: {
    violatedCount: number;
    compliantCount: number;
    undeterminedCount: number;
    totalEvaluated: number;
  };
  results: RuleEvaluationResult[];
  helpChannels: HelpChannel[];
  disclaimer: string;
  effectiveDateDisplay: string;
  officialSources: OfficialSource[];
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  isHypothetical: boolean; // Must be true per requirement: "แต่งขึ้น"
  answers: Record<string, any>;
  expected: {
    isOutOfScope?: boolean;
    violatedCount?: number;
    compliantCount?: number;
    undeterminedCount?: number;
    ruleStatuses?: Record<string, RuleStatus>;
  };
}

