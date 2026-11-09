# คู่มือการเพิ่ม Rule Pack ใหม่ (Adding a New Pack Guide)

คู่มือนี้จัดทำขึ้นสำหรับนักพัฒนาหรือผู้ดูแลระบบที่ต้องการเพิ่มข้อกฎหมายชุดใหม่ (เช่น ดอกเบี้ยเงินกู้นอกระบบ, สิทธิ์ลูกจ้าง, สิทธิ์เที่ยวบิน, สัญญาซื้อคอนโด) เข้าสู่ระบบ "เช็กก่อนเซ็น" โดยไม่ต้องแก้ไขโค้ดการทำงานหลักของระบบ

---

## 1. กฎเหล็ก: ไฟล์ที่ "ห้ามแก้ไข" (Core Engine — Do Not Touch)

เพื่อรักษาเสถียรภาพและป้องกันบั๊กข้างเคียง **ห้ามแก้ไขไฟล์ต่อไปนี้เด็ดขาดในการเพิ่ม Pack ปกติ**:
- `lib/engine/types.ts`
- `lib/engine/schema.ts`
- `lib/engine/evaluator.ts`
- `lib/engine/sharing.ts`
- `components/engine/*` (ทุกไฟล์ในโฟลเดอร์นี้)
- `app/check/[packId]/page.tsx`
- `tests/engine.test.ts`
- `tests/fixtures/dummy-pack/*`

---

## 2. ขั้นตอนการเพิ่ม Pack ใหม่แบบ Step-by-Step

### ขั้นที่ 1: ค้นคว้าและบันทึกตัวบทจริงลง `docs/packs/<id>.md`
1. ห้ามเดาตัวเลขหรือกฎหมายจากความจำหรือ prompt
2. ค้นหาประกาศฉบับจริงจากราชกิจจานุเบกษา (`ratchakitcha.soc.go.th`) หรือเว็บทางการของหน่วยงานเจ้าของเรื่อง
3. เขียนไฟล์สรุป `docs/packs/<id>.md` ระบุ:
   - ชื่อประกาศ เล่ม ตอน หน้า วันที่ประกาศ และวันที่มีผลบังคับใช้
   - ขอบเขตอำนาจ (ใครอยู่ในขอบเขต / ใครอยู่นอกขอบเขต)
   - สรุปตัวบทจริงและลิงก์ PDF ทางการ
   - ช่องทางร้องเรียนและหน่วยงานที่รับผิดชอบจริง

### ขั้นที่ 2: สร้างโฟลเดอร์ `packs/<id>/`
สร้างโฟลเดอร์ใหม่ตามรหัสของ Pack เช่น `packs/loan-interest/` หรือ `packs/labor-rights/`

### ขั้นที่ 3: สร้างไฟล์ `packs/<id>/pack.json`
โครงสร้าง JSON ต้องประกอบด้วย:
1. `meta`:
   - `id`: รหัสภาษาอังกฤษตัวพิมพ์เล็ก (เช่น `loan-interest`)
   - `title`: ชื่อเต็มภาษาไทย
   - `shortTitle`: ชื่อย่อ
   - `description`: คำอธิบายสั้น
   - `category`: หมวดหมู่
   - `iconName`: ชื่อไอคอน (Lucide React)
   - `effectiveDate`: วันที่กฎหมายมีผล (YYYY-MM-DD หรือ พ.ศ.)
   - `effectiveDateDisplay`: ข้อความแสดงวันที่มีผล
   - `officialSources`: แหล่งอ้างอิงราชกิจจานุเบกษา พร้อม URL
   - `helpChannels`: ช่องทางขอความช่วยเหลือ (ชื่อ, เบอร์โทร, เว็บไซต์)
   - `disclaimer`: `"นี่คือการเทียบกับตัวบท ไม่ใช่คำปรึกษาทางกฎหมาย"`
   - `scopeQuestionId`: รหัสของคำถามข้อแรกที่ตรวจขอบเขต
   - `scopeClarification`: คำอธิบายขอบเขตและตัวอย่างกรณีที่ไม่อยู่ในขอบเขต
2. `questions`: รายการคำถาม (schema อนุญาตสูงสุด 25 ข้อ — ปรับจาก 15 ในสาขา `fix-rental-law` เพราะ rental pack ต้องครอบคลุมข้อห้ามครบ 12 ข้อของข้อ 6.1 ควรมีให้น้อยที่สุดเท่าที่จำเป็น)
   - **ข้อแรก (Index 0)** ต้องเป็นคำถามตรวจขอบเขต (`isScopeQuestion: true`)
   - ตัวเลือกที่อยู่นอกขอบเขตต้องระบุ `isOutOfScope: true`
   - ทุกคำถามต้องเปิด `allowUnsure: true`
3. `rules`: รายการกฎทางกฎหมาย
   - แต่ละกฎต้องมี `legalRef` ประกอบด้วย `clause`, `verbatim` (ตัวบทจริง), และ `sourceUrl`
   - ต้องมี `politeNegotiationTemplate` ข้อความสุภาพสำหรับเจรจา

### ขั้นที่ 4: สร้างไฟล์ `packs/<id>/rules.ts`
1. เขียนฟังก์ชัน `evaluateScope: ScopeEvaluator`:
   - คืนค่า `{ inScope: true | false | 'undetermined', reason: string }`
2. เขียนฟังก์ชันตัดสินรายข้อ `rules: Record<string, RuleEvaluator>`:
   - คืนค่า `{ status: 'violated' | 'compliant' | 'undetermined', reason: string, customNegotiationText?: string }`
   - ผลการตัดสินมีได้เพียง 3 สถานะเท่านั้น
   - หากข้อมูลไม่พอหรือผู้ใช้ตอบไม่แน่ใจ **ต้องคืนค่า `undetermined` เสมอ ห้ามคาดเดา**
3. Export อ็อบเจกต์ PackRules:
   ```ts
   export const myPackRules: PackRules = {
     evaluateScope: evaluateMyScope,
     rules,
   };
   ```

### ขั้นที่ 5: สร้างชุดทดสอบ `packs/<id>/cases.json`
1. สร้างชุดทดสอบอย่างน้อย 15 เคส
2. ทุกเคสต้องระบุ `"isHypothetical": true` เพื่อระบุชัดเจนว่าเป็นตัวอย่างที่แต่งขึ้น
3. ต้องครอบคลุม:
   - เคสที่ไม่ขัดกฎหมายเลย (Fully Compliant)
   - เคสที่ขัดกฎหมายหลายข้อ (Violated)
   - เคสที่อยู่นอกขอบเขต (Out of Scope)
   - เคสที่อยู่ตรงขอบเขตตัวเลข (Boundary Values เช่น พอดีเพดาน / เกินเพดานเล็กน้อย)
   - เคสที่ตอบไม่แน่ใจทั้งหมด (All Unsure -> ผลลัพธ์ต้องได้ undetermined)

### ขั้นที่ 6: ลงทะเบียน Pack ใน `lib/packs/registry.ts`
นำเข้า Pack และ Rules แล้วใส่ใน `PACK_REGISTRY`:
```ts
import myPackJson from '../../packs/my-pack/pack.json';
import { myPackRules } from '../../packs/my-pack/rules';

export const PACK_REGISTRY: Record<string, PackRegistryItem> = {
  // ...
  'my-pack': {
    meta: myPackJson.meta as PackDefinition['meta'],
    pack: myPackJson as PackDefinition,
    rules: myPackRules,
    isAvailable: true,
  },
};
```

---

## 3. การทดสอบขั้นต่ำที่ทุก Pack ต้องมี (Minimum Required Tests)

ต้องสร้างไฟล์ทดสอบ 2 ไฟล์ใน `tests/`:
1. `tests/<id>-rules.test.ts`:
   - ทดสอบ Scope Gatekeeper ครบทุกกรณี
   - ทุกกฎต้องมี Unit Test ครอบคลุมสถานะ:
     - `compliant` (ไม่ขัด)
     - `violated` (ขัด)
     - `undetermined` (บอกไม่ได้ / ข้อมูลไม่พอ)
     - `boundary values` (ค่าที่อยู่ตรงขอบเพดาน เช่น ตัวเลขขั้นต่ำ-ขั้นสูง)
2. `tests/<id>-cases.test.ts`:
   - รันชุดทดสอบ 15 เคสจาก `cases.json`
   - ตรวจสอบว่าตรงกับเฉลย 100%
   - พิมพ์รายงานสรุปจำนวนข้อที่ตรงเฉลย

---

## 4. คำสั่งตรวจสอบความถูกต้องก่อนส่งงาน (Verification Commands)

ทุกครั้งที่เพิ่ม Pack ต้องรันคำสั่งเหล่านี้และต้องผ่านโดยไม่มี error:

```bash
# 1. ตรวจสอบ Schema ของ Pack ทั้งหมดด้วย Zod (ห้ามล้มเหลว)
npm run validate-packs

# 2. รัน Unit Test ทั้งหมด
npm test

# 3. ตรวจสอบ Type
npm run typecheck

# 4. ทดสอบกระบวนการ Build
npm run build
```

