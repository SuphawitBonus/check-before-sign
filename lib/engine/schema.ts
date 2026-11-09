import { z } from 'zod';

export const OfficialSourceSchema = z.object({
  title: z.string().min(1, 'ต้องระบุชื่อเอกสารทางการ'),
  url: z.string().url('URL แหล่งที่มาต้องเป็น URL ที่ถูกต้อง'),
  gazetteRef: z.string().min(1, 'ต้องระบุเลขเล่ม ตอน หรือการอ้างอิงราชกิจจานุเบกษา'),
  announcementDate: z.string().optional(),
  effectiveDate: z.string().min(1, 'ต้องระบุวันที่มีผลใช้บังคับ'),
});

export const HelpChannelSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อช่องทางช่วยเหลือ'),
  tel: z.string().optional(),
  url: z.string().url('URL ช่องทางช่วยเหลือต้องถูกต้อง').optional(),
  description: z.string().optional(),
});

export const QuestionnaireEndSchema = z.object({
  reason: z.string().min(1, 'ต้องระบุเหตุผลที่จบการถาม (แสดงที่หน้าผล)'),
  ruleReason: z.string().min(1).optional(),
});

export const QuestionOptionSchema = z.object({
  label: z.string().min(1, 'ต้องระบุข้อความตัวเลือก'),
  value: z.string().min(1, 'ต้องระบุค่าตัวเลือก'),
  helpText: z.string().optional(),
  isOutOfScope: z.boolean().optional(),
  endsQuestionnaire: QuestionnaireEndSchema.optional(),
}).refine((opt) => !(opt.isOutOfScope && opt.endsQuestionnaire), {
  message: 'ตัวเลือกเดียวกันต้องไม่เป็นทั้ง isOutOfScope และ endsQuestionnaire',
  path: ['endsQuestionnaire'],
});

export const QuestionSchema = z.object({
  id: z.string().min(1, 'ต้องระบุรหัสคำถาม'),
  text: z.string().min(1, 'ต้องระบุข้อความคำถาม'),
  helpText: z.string().optional(),
  type: z.enum(['choice', 'number', 'boolean']),
  options: z.array(QuestionOptionSchema).optional(),
  allowUnsure: z.boolean().default(true),
  unsureLabel: z.string().optional(),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  isScopeQuestion: z.boolean().optional(),
  unsureEndsQuestionnaire: QuestionnaireEndSchema.optional(),
}).refine((q) => !q.unsureEndsQuestionnaire || q.allowUnsure, {
  message: 'unsureEndsQuestionnaire ใช้ได้เฉพาะคำถามที่เปิด allowUnsure',
  path: ['unsureEndsQuestionnaire'],
});

export const LegalRefSchema = z.object({
  clause: z.string().min(1, 'ต้องระบุข้อหรือมาตรากฎหมาย'),
  verbatim: z.string().min(1, 'ต้องระบุข้อความตัวบทจริงจากทางการ'),
  sourceUrl: z.string().url('URL ตัวบทต้องถูกต้อง'),
});

export const RuleDefinitionSchema = z.object({
  id: z.string().min(1, 'ต้องระบุรหัสกฎ'),
  title: z.string().min(1, 'ต้องระบุชื่อกฎ'),
  description: z.string().min(1, 'ต้องระบุคำอธิบายกฎ'),
  legalRef: LegalRefSchema,
  politeNegotiationTemplate: z.string().min(1, 'ต้องระบุข้อความสำหรับเจรจาอย่างสุภาพ'),
  complaintGuide: z.string().optional(),
});

export const PackMetadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/, 'รหัส Pack ต้องเป็นตัวพิมพ์เล็ก ตัวเลข ขีดกลาง หรือขีดล่าง'),
  title: z.string().min(1, 'ต้องระบุชื่อเต็มของ Pack'),
  shortTitle: z.string().min(1, 'ต้องระบุชื่อย่อของ Pack'),
  description: z.string().min(1, 'ต้องระบุคำอธิบาย Pack'),
  category: z.string().min(1, 'ต้องระบุหมวดหมู่'),
  iconName: z.string().min(1, 'ต้องระบุชื่อ Icon'),
  effectiveDate: z.string().min(1, 'ต้องระบุวันที่กฎหมายมีผลใช้บังคับ'),
  effectiveDateDisplay: z.string().min(1, 'ต้องระบุข้อความแสดงวันที่มีผลใช้บังคับ'),
  officialSources: z.array(OfficialSourceSchema).min(1, 'ต้องมีแหล่งที่มาทางการอย่างน้อย 1 แหล่ง'),
  helpChannels: z.array(HelpChannelSchema).min(1, 'ต้องมีช่องทางช่วยเหลืออย่างน้อย 1 ช่องทาง'),
  disclaimer: z.string().min(1, 'ต้องมีข้อความปฏิเสธความรับผิดทางกฎหมาย'),
  scopeQuestionId: z.string().min(1, 'ต้องระบุรหัสคำถามตรวจขอบเขต'),
  scopeClarification: z.object({
    inScopeDescription: z.string().min(1, 'ต้องระบุคำอธิบายผู้ที่อยู่ในขอบเขต'),
    outOfScopeExamples: z.array(z.string()).min(1, 'ต้องระบุตัวอย่างผู้ที่อยู่นอกขอบเขต'),
  }),
});

export const PackDefinitionSchema = z.object({
  meta: PackMetadataSchema,
  // Cap raised from 15 to 25 on branch fix-rental-law: the rental pack needs all 12 items of
  // notice clause 6.1 (see docs/adding-a-pack.md). Keep packs as short as the law allows.
  questions: z.array(QuestionSchema).min(1, 'ต้องมีคำถามอย่างน้อย 1 ข้อ').max(25, 'คำถามต้องไม่เกิน 25 ข้อ'),
  rules: z.array(RuleDefinitionSchema).min(1, 'ต้องมีกฎอย่างน้อย 1 ข้อ'),
}).refine((data) => {
  // Verify that the scope question exists
  const hasScopeQuestion = data.questions.some(q => q.id === data.meta.scopeQuestionId);
  return hasScopeQuestion;
}, {
  message: 'คำถามตรวจขอบเขต (scopeQuestionId) ต้องตรงกับคำถามข้อใดข้อหนึ่งใน questions',
  path: ['meta', 'scopeQuestionId'],
});

export const TestCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  isHypothetical: z.literal(true, {
    errorMap: () => ({ message: 'ชุดทดสอบต้องระบุ isHypothetical: true (เป็นตัวอย่างแต่งขึ้น)' }),
  }),
  answers: z.record(z.any()),
  expected: z.object({
    isOutOfScope: z.boolean().optional(),
    violatedCount: z.number().optional(),
    compliantCount: z.number().optional(),
    undeterminedCount: z.number().optional(),
    ruleStatuses: z.record(z.enum(['violated', 'compliant', 'undetermined'])).optional(),
  }),
});

export const CasesSchema = z.array(TestCaseSchema).min(1, 'ต้องมีเคสทดสอบอย่างน้อย 1 เคส');

