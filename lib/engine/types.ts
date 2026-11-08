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

export interface QuestionOption {
  label: string;
  value: string;
  helpText?: string;
  isOutOfScope?: boolean;
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
