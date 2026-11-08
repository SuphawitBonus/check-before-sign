# รายงานผลการพัฒนาและตรวจสอบระบบ: Pack 0 - สัญญาเช่าที่อยู่อาศัย (Rental Pack)

**โครงการ:** เช็กก่อนเซ็น (Check Before Sign)  
**วันที่ทดสอบ:** 8 พฤศจิกายน 2569  
**สถานะ:** ผ่านการทดสอบทั้งหมด (All Tests Passed)

---

## 1. ผลการรันคำสั่งจริง (Raw Outputs)

### 1.1 Output ดิบ: `npm run validate-packs`
```text
> check-before-sign@0.1.0 validate-packs
> tsx scripts/validate-packs.ts

[Pack Validator] Scanning packs in: D:\check-before-sign\packs

--> Validating pack: rental
  [OK] pack.json is valid (12 questions, 12 rules)
  [OK] rules.ts exists
  [OK] cases.json is valid (15 test cases, all marked hypothetical)

[Pack Validator] All pack schemas validated successfully!
```

### 1.2 Output ดิบ: `npm test` (Vitest)
```text
> check-before-sign@0.1.0 test
> vitest run

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 D:/check-before-sign

 ✓ tests/rental-rules.test.ts (48 tests) 11ms
stdout | tests/rental-cases.test.ts > Rental Pack Cases Verification (15 ชุดตัวอย่างแต่งขึ้น) > summary: all 15 hypothetical cases match expected outputs 100%

========================================
Rental Cases Test Summary: 15 / 15 Cases Passed (100% Match)
All cases are explicitly verified as hypothetical examples.
========================================


 ✓ tests/rental-cases.test.ts (16 tests) 7ms
 ✓ tests/engine.test.ts (6 tests) 8ms

 Test Files  3 passed (3)
      Tests  70 passed (70)
   Start at  15:55:31
   Duration  1.11s (transform 195ms, setup 0ms, collect 465ms, tests 26ms, environment 1ms, prepare 407ms)
```

### 1.3 Output ดิบ: `npm run typecheck` (TypeScript Compiler)
```text
> check-before-sign@0.1.0 typecheck
> tsc --noEmit
```
*(Exit code: 0 — ไม่มีข้อผิดพลาดทาง Type ใด ๆ)*

### 1.4 Output ดิบ: `npm run build` (Next.js Production Build)
```text
> check-before-sign@0.1.0 prebuild
> tsx scripts/validate-packs.ts

[Pack Validator] Scanning packs in: D:\check-before-sign\packs

--> Validating pack: rental
  [OK] pack.json is valid (12 questions, 12 rules)
  [OK] rules.ts exists
  [OK] cases.json is valid (15 test cases, all marked hypothetical)

[Pack Validator] All pack schemas validated successfully!

> check-before-sign@0.1.0 build
> next build

  ▲ Next.js 14.2.23

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/4) ...
   Generating static pages (1/4) 
   Generating static pages (2/4) 
   Generating static pages (3/4) 
 ✓ Generating static pages (4/4)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    175 B          94.1 kB
├ ○ /_not-found                          873 B            88 kB
└ ƒ /check/[packId]                      24.2 kB         118 kB
+ First Load JS shared by all            87.1 kB
  ├ chunks/117-ee2db8becb455cbd.js       31.6 kB
  ├ chunks/fd9d1056-cce117dc4e21e608.js  53.6 kB
  └ other shared chunks (total)          1.89 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 2. หลักฐานภาพหน้าจอจริง (Screenshots)

ทุกภาพบันทึกจากการเรนเดอร์จริงด้วย Headless Browser บนเครื่องจริง:

| หน้าจอ | Desktop (1280px) | Mobile (375px) |
| :--- | :--- | :--- |
| **หน้าแรก (Home)** | `docs/screenshots/desktop-home.png` | `docs/screenshots/mobile-home-375px.png` |
| **หน้าตอบคำถาม (Questionnaire)** | `docs/screenshots/desktop-check-rental.png` | `docs/screenshots/mobile-check-rental-375px.png` |
| **หน้าผลการตรวจสัญญา (Result)** | `docs/screenshots/desktop-result-screen.png` | `docs/screenshots/mobile-result-screen-375px.png` |
| **หน้าระงับตรวจเมื่อนอกขอบเขต** | `docs/screenshots/desktop-out-of-scope.png` | — |

---

## 3. สรุปความแตกต่างระหว่างตัวบทจริง vs สิ่งที่คาดไว้ใน Prompt

ตามเงื่อนไข *"ถ้าตัวบทจริงขัดกับสิ่งที่ prompt นี้คาดไว้ ให้ทำตามตัวบท แล้วบันทึกความต่างไว้ในรายงาน"*:

1. **เกณฑ์จำนวนห้องพักของผู้ประกอบธุรกิจ (Room Count Threshold):**
   - *สิ่งที่คาดไว้เดิม:* ในประกาศเดิมปี พ.ศ. ๒๕๖๒ กำหนดเกณฑ์ไว้ที่ **๕ หน่วยขึ้นไป**
   - *ตัวบทจริงฉบับปรับปรุง พ.ศ. ๒๕๖๘ (มีผลใช้บังคับ ๔ กันยายน ๒๕๖๘):* คณะกรรมการว่าด้วยสัญญาได้ปรับลดเกณฑ์ลงเหลือ **๓ หน่วยขึ้นไป** ไม่ว่าจะอยู่ในอาคารเดียวกันหรือหลายอาคารรวมกัน เพื่อขยายความคุ้มครองไปยังผู้เช่าอพาร์ตเมนต์ขนาดเล็กและคอนโดปล่อยเช่าหลายยูนิต
   - *การจัดการในระบบ:* ระบบระบุเกณฑ์ขั้นต่ำ ๓ หน่วยขึ้นไปตามฉบับ พ.ศ. ๒๕๖๘ และอ้างอิงควบคู่กับฉบับ พ.ศ. ๒๕๖๒ ไว้อย่างชัดเจน
2. **เพดานเงินประกันและค่าเช่าล่วงหน้า (Deposit & Advance Rent Cap):**
   - *ในฉบับเดิมปี ๒๕๖๒:* เงินประกันไม่เกิน ๑ เดือน และค่าเช่าล่วงหน้าไม่เกิน ๑ เดือน
   - *ในฉบับปรับปรุงปี ๒๕๖๘:* กำหนดให้เงินค่าเช่าล่วงหน้าเรียกเก็บได้ไม่เกิน ๑ เดือน และเมื่อรวมเงินประกันกับค่าเช่าล่วงหน้าแล้ว **ต้องไม่เกิน ๓ เดือน** ของอัตราค่าเช่ารายเดือน
   - *การจัดการในระบบ:* ระบบคำนวณทั้งค่าเช่าล่วงหน้า (ไม่เกิน ๑ เดือน) และยอดรวมเงินประกันกับค่าเช่าล่วงหน้า (ไม่เกิน ๓ เดือน) เป็นกฎ ๒ ข้อที่ตรวจสอบควบคู่กัน
3. **ระยะเวลาการคืนเงินประกัน (Deposit Return Window):**
   - กฎหมายฉบับล่าสุดกำหนดกรอบเวลาให้ผู้ให้เช่าต้องคืนเงินประกันทันที หรือภายใน **๗ วันทำการ** นับแต่วันที่สัญญาเช่าสิ้นสุดและผู้เช่าส่งมอบห้องคืนในสภาพเรียบร้อย หากสัญญาใดระบุ ๑๕–๖๐ วัน ถือว่าขัดต่อประกาศ สคบ.
4. **สิ่งที่ไม่ครอบคลุม (Exclusions):**
   - ตัวบทระบุชัดเจนว่าไม่รวมถึง:
     - หอพักตามกฎหมายว่าด้วยหอพัก (พ.ร.บ. หอพัก พ.ศ. ๒๕๕๘) เช่น หอพักนักศึกษาของมหาวิทยาลัย
     - โรงแรมตามกฎหมายว่าด้วยโรงแรม (พ.ร.บ. โรงแรม พ.ศ. ๒๕๔๗)
     - การเช่าในนามนิติบุคคล หรือเช่าเพื่อทำการค้า/ประกอบธุรกิจ
     - ผู้ให้เช่ารายย่อยที่มีไม่ถึง ๓ หน่วย

---

## 4. รายการสิ่งที่ยังไม่ได้ตรวจและข้อจำกัดของระบบ (Limitations & Unchecked Items)

เพื่อความซื่อสัตย์ทางเทคนิคและหลักการทางกฎหมาย รายการต่อไปนี้เป็นสิ่งที่ระบบไม่สามารถตรวจได้จากคำถาม ๑๒ ข้อ:

1. **ความเที่ยงตรงของมิเตอร์น้ำ-ไฟกายภาพ:** ระบบตรวจได้เฉพาะข้อกำหนดในสัญญาว่าบวกราคาเกินบิลจริงหรือไม่ แต่ไม่สามารถตรวจสอบได้ว่ามิเตอร์ของผู้ให้เช่าหมุนตรงตามมาตรฐานการไฟฟ้า/การประปาหรือไม่
2. **ข้อพิพาทความเสียหายของทรัพย์สินจริง (Inventory Disputes):** ระบบตรวจได้ว่าข้อสัญญาห้ามริบเงินประกันโดยไม่มีความเสียหายจริง แต่ไม่สามารถตัดสินข้อเท็จจริงหน้างานได้ว่ารอยขีดข่วนหรืออุปกรณ์ที่ชำรุดเกิดจากการใช้งานปกติวิสัย (Normal Wear & Tear) หรือเกิดจากความประมาทของผู้เช่า
3. **สัญญาเช่าด้วยวาจา (Oral Leases):** ระบบออกแบบมาเพื่อตรวจข้อสัญญาที่เป็นลายลักษณ์อักษร หากเป็นการเช่าโดยไม่มีหนังสือสัญญา จะต้องบังคับตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา ๕๓๘
4. **ค่าบริการส่วนกลางและค่าทำความสะอาดที่ซ่อนเร้น:** หากผู้ให้เช่าคิดค่าส่วนกลางในอัตราที่สมเหตุสมผลจะถือว่าทำได้ แต่หากมีการเรียกเก็บค่าใช้จ่ายแอบแฝงเกินจริง ต้องพิจารณาเป็นรายกรณีร่วมกับเจ้าหน้าที่ สคบ.
