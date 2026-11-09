# รายงาน 1: แก้ rental pack ให้ตรงตัวบทจริง (สาขา `fix-rental-law`)

**แหล่งตัวบทที่ใช้ตรวจ:** [ประกาศ สคบ. พ.ศ. ๒๕๖๘ (PDF ทางการ)](https://www.ocpb.go.th/article_attach/articlefile_2025070314222862724.pdf) — ราชกิจจานุเบกษา เล่ม ๑๔๒ ตอนพิเศษ ๒๑๑ ง หน้า ๘๐–๘๔ ลงวันที่ ๖ มิ.ย. ๒๕๖๘

## 0. สรุปผลการตรวจซ้ำตัวบท (ตามที่สั่งให้หยุดถามหากไม่ตรง)

ดาวน์โหลด PDF (21 หน้า, 15,866,007 ไบต์) แล้วเรนเดอร์ทุกหน้าเป็นภาพอ่านเอง (ข้อความในไฟล์เข้ารหัสฟอนต์ คัดลอกไม่ได้) หน้า 1–5 คือประกาศ หน้า 6–12 แบบ ก หน้า 13–21 แบบ ข

**ข้อมูลที่คุณให้มา ตรงกับตัวบททุกข้อ ไม่ต้องหยุดถาม** ได้แก่: ข้อ 6.1(2)/6.2(2)/6.2(3) เพดาน 3 เดือน/1 ปี, 6.1(3), 6.1(4), 6.1(5), แบบ ก ข้อ 10 (7 วัน/14 วัน), ข้อ 13 (กึ่งหนึ่ง/30 วัน/ไม่ค้างชำระ/คืนใน 7 วัน), ข้อ 14 (30 วัน/7 วัน/ไม่ต้องบอกล่วงหน้า), ข้อ 3 (90 วัน), ข้อ 10 (สัญญา ๒๕๖๒ ใช้ต่อ) และเลขข้อที่แบบ ข เลื่อนไปหนึ่ง (๖.๒(๔)–(๑๓)) ข้อ 6.1 มี 12 ข้อย่อย ข้อ 6.2 มี 13 ข้อย่อย

**สิ่งที่ตัวบทไม่ได้ตอบเอง (ตัดสินใจเองแล้ว โปรดตรวจ):**
1. **วันใช้บังคับ 4 หรือ 5 ก.ย. 2568** — "เมื่อพ้นกำหนดเก้าสิบวัน" นับครบ 90 วันที่ 4 ก.ย. แต่อาจเริ่มมีผลวันถัดไป ระบบจึงให้ "บอกไม่ได้" ถ้าทำสัญญาวันที่ 4 ก.ย. พอดี (ดู `docs/packs/rental.md` หัวข้อ 1.1)
2. **ลิงก์ฉบับ ๒๕๖๒ ยังไม่ได้เปิดยืนยัน** — ดูหัวข้อ 4

## 1. ตารางก่อนและหลังแก้ รายข้อ

| # | งาน | ก่อนแก้ | หลังแก้ | ตัวบท |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `rule_advance_rent` | มีกฎ "ค่าเช่าล่วงหน้าไม่เกิน 1 เดือน" พร้อม verbatim ที่ไม่มีในตัวบท | **ลบทิ้ง** พร้อม `rule_combined_deposit_advance` และ `q_combined_deposit_advance` (ซ้ำกับเพดานรวม) เหลือกฎเดียว `rule_deposit_amount`: รวมไม่เกิน 3 เดือน (รายเดือน) / 1 ปี (รายปี แบบ ข) | ข้อ 6.1(2), 6.2(2), 6.2(3) |
| 2 | เงินประกัน ไม่ทราบค่าเช่าล่วงหน้า | ประกัน 1 < n ≤ 2 โดยไม่รู้ล่วงหน้า → "ไม่ขัด" (สมมติว่าล่วงหน้า 1 เดือน); ประกัน ≤ 1 → "ไม่ขัด" ทั้งที่ไม่รู้ล่วงหน้า | ไม่ทราบอีกฝั่ง → **บอกไม่ได้** ไม่สมมติค่า; ยกเว้นฝั่งที่ทราบเกินเพดานเองแล้ว → ขัด (อีกฝั่งไม่ต่ำกว่า 0) | ข้อ 6.1(2) |
| 3a | คืนเงินประกัน ไม่มีความเสียหาย | "7 วันทำการ" | **7 วัน** นับแต่สัญญาสิ้นสุดและได้ห้องคืน; เขียนชัดว่า "ไม่ใช่วันทำการ" | แบบ ก ข้อ 10(ก) / แบบ ข ข้อ 11(ก) |
| 3b | คืนเงินประกัน หักค่าเสียหาย | ไม่มี | คำถามแยก `q_deposit_refund_after_deduction` + `rule_deposit_refund_after_deduction`: **14 วัน** (ไม่ใช่วันทำการ) | แบบ ก ข้อ 10(ข) / แบบ ข ข้อ 11(ข) |
| 4a | ผู้ให้เช่าบอกเลิก (ทั่วไป) | "30 วัน หรือ 7 วันกรณีค้างค่าเช่า" | **30 วัน** ไม่มีข้อยกเว้นค้างค่าเช่า (เลือก "สั้นกว่า 30 วันรวมกรณีค้างค่าเช่า" = ขัด) | แบบ ก ข้อ 14 ว.1 / แบบ ข ข้อ 15 ว.1 |
| 4b | รบกวนผู้เช่ารายอื่น | ไม่มี | `rule_lessor_termination_disturbance`: บอกกล่าวอย่างน้อย **7 วัน** | แบบ ก ข้อ 14 ว.2 / แบบ ข ข้อ 15 ว.2 |
| 4c | ผิดกฎหมายสงบเรียบร้อย/ศีลธรรม | ไม่มี | ระบุในคำอธิบายว่าบอกเลิกได้โดยไม่ต้องบอกล่วงหน้า (ไม่ทำเป็นกฎ เพราะไม่มีสิ่งที่ห้าม) | แบบ ก ข้อ 14 ว.3 / แบบ ข ข้อ 15 ว.3 |
| 5 | ผู้เช่าบอกเลิก | ตอบ "ไม่ขัด" เมื่อ "แจ้งล่วงหน้าตามสมควร"; ไม่มีกึ่งหนึ่ง/คืนใน 7 วัน | ต้องครบ: อยู่มาแล้ว ≥ กึ่งหนึ่ง, หนังสือ ≥ 30 วัน, ไม่ค้างชำระ, **คืนค่าเช่าล่วงหน้าภายใน 7 วันนับแต่วันบอกเลิก**; ตัวเลือก "ห้ามเลิก", "เงื่อนไขเข้มกว่า", "คืนช้า/ไม่คืน" = ขัด | แบบ ก ข้อ 13 / แบบ ข ข้อ 14 |
| 6 | คำถามวันที่ทำสัญญา | ไม่มี | คำถามข้อ 2 ต่อจากขอบเขต: ก่อน 4 ก.ย. 68 / 4 ก.ย. 68 พอดี / ตั้งแต่ 5 ก.ย. 68 → สามข้อแรกและ "ไม่แน่ใจ" = **บอกไม่ได้ทั้งชุด 18 กฎ** พร้อมอธิบายข้อ 10 วิธีนับอยู่ใน `docs/packs/rental.md` | ข้อ 3, ข้อ 10 |
| 7a | เลขข้อ | อ้าง "ข้อ ๕" ทั้งที่เป็นข้อ 6.1(n); verbatim หลายข้อไม่ใช่ถ้อยคำจริง; อ้าง "ข้อ ๕ สาระสำคัญ" ที่ไม่มี | ทุกกฎอ้างทั้งแบบ ก และแบบ ข (เช่น เข้าห้อง = **6.1(5) / 6.2(6)**) และ `verbatim` คัดจากภาพ PDF ใหม่ทั้งหมด | ตลอดทั้งประกาศ |
| 7b | ลิงก์ ๒๕๖๘ | `ratchakitcha.soc.go.th/documents/72766.pdf` | PDF ของ สคบ. ตามที่ระบุ (ที่เดิมเป็นไฟล์เดียวกัน ขนาด 15,866,007 ไบต์เท่ากัน) | — |
| 7c | ลิงก์ ๒๕๖๒ | ชี้ไป `72766.pdf` เดียวกับ ๒๕๖๘ (ผิด) | `ratchakitcha.soc.go.th/pdfdownload/?id=17110335` จากหน้ารวมของ สคบ. — **ยังไม่ได้เปิดยืนยัน (403)** ดูหัวข้อ 4 | — |
| 8 | ข้อห้าม 6.1 ครบ 12 ข้อ | มี 5 ข้อ ((2),(4),(5),(6),(7) บางข้อเพี้ยน) ขาด (1),(3),(8),(9),(10),(11),(12) | ครบ 12 ข้อ — ตารางที่หัวข้อ 2 | ข้อ 6.1(1)–(12) |
| 9 | next | 14.2.23 | **14.2.35** (ล่าสุดของสาย 14.2) — `npm audit` ยังพบช่องโหว่ ดูหัวข้อ 5 | — |
| 10 | test / cases | 15 เคส, 12 คำถาม, 12 กฎ | **25 เคส, 21 คำถาม, 18 กฎ, 109 test ผ่าน** รวมเคส "ล่วงหน้า 2 เดือน + ประกัน 1 เดือน = ไม่ขัด" (`case-07`) | — |

**สิ่งอื่นที่พบและแก้เพิ่ม** (ไม่อยู่ในรายการที่สั่ง แต่ขัดกับตัวบทหรือหลักการ `docs/principles.md` ข้อ 1):
- ลบข้อความ "ตกเป็นโมฆะ" (ใน rules, README) — ตัวบทไม่ได้กล่าวไว้
- ลบ "ตัดน้ำตัดไฟ" จากข้อล็อกห้อง — 6.1(7) พูดถึงการปิดกั้นไม่ให้เข้าใช้อาคาร และการเข้ายึด/ขนย้ายทรัพย์สินเท่านั้น
- ลบ "ฉบับ ๒๕๖๒ ใช้เกณฑ์ ๕ หน่วย / เงินประกัน ๑ เดือน" และ "วันมีผล ๓๐ ม.ค. ๒๕๖๓" ที่ไม่ได้ยืนยันจากตัวบท ออกจาก pack และ docs
- ข้อ 6.1(4) เดิมถามว่า "ริบทั้งหมดเมื่อย้ายออกก่อนครบสัญญา" — ตัวบทห้ามริบ "โดยมิใช่ความผิดของผู้เช่า" แก้คำถามให้ตรง
- ค่าไฟ/ค่าน้ำ: เพิ่มตัวเลือก "เหมาจ่ายแต่ไม่ทราบว่าสูงกว่าบิลหรือไม่" → บอกไม่ได้ (เดิมถือว่าขัดทุกกรณี)
- ข้อ 6.1(1) ยกเว้นความรับผิด: ตัวบทห้ามเฉพาะ "ไม่มีเหตุผลที่สมควรเพียงพอ" โค้ดตัดสินไม่ได้ จึงตอบ "บอกไม่ได้" เมื่อมีข้อสัญญานี้
- นิยามขอบเขตแก้ให้ตรงข้อ 4: ผู้เช่าเป็นบุคคลธรรมดา, "หอพักตามกฎหมายว่าด้วยหอพัก" (ลบคำว่า "หอในมหาวิทยาลัย" ที่ไม่มีในตัวบท) และเตือนในเหตุผล out-of-scope ว่าผลนี้อิงนิยาม ๒๕๖๘

## 2. ความครบของข้อห้ามข้อ 6.1 ทั้ง 12 ข้อ

| ข้อ | สาระ | ก่อน | หลัง (rule) | test |
| :-: | :--- | :-: | :--- | :--- |
| (1) | ยกเว้น/จำกัดความรับผิดของผู้ให้เช่า | ไม่มี | `rule_liability_exemption` | `case-02`, `case-24` |
| (2) | ประกัน + ล่วงหน้า เกิน 3 เดือน | มี (ผิด) | `rule_deposit_amount` | `case-07`–`14` |
| (3) | เปลี่ยนค่าเช่า/ค่าบริการระหว่างสัญญา | ไม่มี | `rule_rent_change_during_term` | `case-02` |
| (4) | ริบประกัน/ล่วงหน้าโดยไม่ใช่ความผิดผู้เช่า | มี (เพี้ยน) | `rule_deposit_forfeiture` | `case-02` |
| (5) | เข้าตรวจโดยไม่แจ้งล่วงหน้า | มี | `rule_inspection_privacy` | `case-02` |
| (6) | ค่าไฟ/ค่าน้ำเกินที่ผู้ให้บริการเรียกเก็บ | มี | `rule_electricity_tariff`, `rule_water_tariff` | `case-02`, `case-25` |
| (7) | ปิดกั้น/ยึดทรัพย์ก่อนบอกเลิกโดยชอบ | มี | `rule_self_help_lockout` | `case-02` |
| (8) | ค่าต่อสัญญา | ไม่มี | `rule_renewal_fee` | `case-02` |
| (9) | ผู้ให้เช่าเลิกโดยผู้เช่าไม่ผิด | ไม่มี | `rule_lessor_terminate_without_breach` | `case-02` |
| (10) | ผู้เช่ารับผิดความเสียหายจากการใช้งานปกติ | ไม่มี | `rule_normal_wear_liability` | `case-02` |
| (11) | ผู้เช่ารับผิดเหตุที่ไม่ใช่ความผิดตน/สุดวิสัย | ไม่มี | `rule_force_majeure_liability` | `case-02` |
| (12) | ผู้เช่ารับผิดความชำรุด/เสื่อมสภาพปกติ | ไม่มี | `rule_normal_wear_liability` (รวมกับ (10)) | `case-02` |

test `all 12 prohibited clauses of ข้อ 6.1 are covered…` ตรวจว่าทุกข้อมีกฎที่อ้างเลขข้อและมีข้อความจริงอยู่ใน `verbatim`

## 3. การเปลี่ยนแปลงโครงสร้าง / ข้อควรตัดสินใจ (โปรดตรวจ)

1. **แก้ไฟล์ core engine 1 บรรทัด:** `lib/engine/schema.ts` ปรับเพดานคำถามจาก 15 เป็น 25 — ข้อห้ามครบ 12 ข้อ + คำถามที่ต้องเพิ่มทำให้เกิน 15 ทั้งที่ `docs/adding-a-pack.md` ระบุให้ไฟล์ engine เป็นไฟล์ห้ามแก้ จึงแก้เท่าที่จำเป็นและบันทึกเหตุผลใน `docs/adding-a-pack.md` ไม่ได้แตะ evaluator / UI
2. **ตีความข้อ 3 "เพิ่มคำถามแยกว่ามีการหักค่าเสียหายไหม"** ว่าเป็นคำถามแยกสำหรับกรณีหักค่าเสียหาย (14 วัน) ต่างหากจากกรณีไม่มีความเสียหาย (7 วัน) เพราะแอปตรวจ "ข้อสัญญาก่อนเซ็น" ไม่ใช่เหตุการณ์จริง หากหมายถึงอย่างอื่น (เช่น ถามก่อนว่ามีการหักหรือไม่แล้วข้ามคำถาม) แจ้งได้ — engine ปัจจุบันไม่รองรับคำถามแบบมีเงื่อนไข
3. **ข้อ 6 (ถามทุกข้อแม้สัญญาก่อนวันใช้บังคับ):** engine ไม่รองรับการข้ามไปหน้าผลลัพธ์ ผู้ใช้ที่เลือก "ก่อน 4 ก.ย. 68" จึงยังต้องตอบครบ 21 ข้อ ก่อนเห็น "บอกไม่ได้ทั้งชุด" (ไม่ได้แก้ engine ตามข้อ 1) แนะนำเป็นงานถัดไป
4. **หน่วยของเงินประกัน/ค่าเช่าล่วงหน้า = "งวด"** (1 เดือนหรือ 1 ปี ตามที่สัญญาคิดค่าเช่า) เพื่อใช้คำถามเดียวกับทั้งเพดานรายเดือนและรายปี

## 4. สิ่งที่ยังยืนยันไม่ได้ — ต้องให้คนตรวจ

- **ลิงก์ฉบับ ๒๕๖๒:** `https://ratchakitcha.soc.go.th/pdfdownload/?id=17110335` มาจากหน้ารวมประกาศคณะกรรมการว่าด้วยสัญญา ของ สคบ. ([ocpb.go.th/more_news.php?cid=14](https://www.ocpb.go.th/more_news.php?cid=14)) ซึ่งระบุว่าเป็นรายการ "ธุรกิจให้เช่าอาคารเพื่ออยู่อาศัย พ.ศ. ๒๕๖๒" แต่เซิร์ฟเวอร์ราชกิจจาฯ ตอบ **HTTP 403** ต่อการดาวน์โหลดอัตโนมัติ (ทั้ง `pdfdownload/?id=…` และ `DATA/PDF/2562/E/270/T_0049.PDF`) และระบบไม่อนุญาตให้ปลอม User-Agent เพื่อเลี่ยง จึง **ไม่ได้เห็นเนื้อหาจริง** ที่ใส่ใน pack คือลิงก์ที่ดีที่สุดที่หาได้ ไม่ใช่ลิงก์ที่ยืนยันแล้ว — **ขอให้เปิดลิงก์นี้ในเบราว์เซอร์หนึ่งครั้งเพื่อยืนยันว่าเป็นฉบับ ๒๕๖๒** เลขหน้า (เดิม "หน้า ๕๑") ถูกถอดออกเพราะยืนยันไม่ได้
- **ตัวบท ๒๕๖๒ ไม่ได้ถูกอ่านเลย** — จึงไม่มีกฎใดตัดสินด้วย ๒๕๖๒ ตามที่สั่ง
- **หลักการนับ "พ้นกำหนด 90 วัน"** (4 หรือ 5 ก.ย.) ไม่ได้ยืนยันจากตัวบทกฎหมายอื่น

## 5. ผล `npm audit` — ยังไม่สะอาด (ต้องตัดสินใจก่อน deploy)

อัปเกรด next เป็น **14.2.35** (ล่าสุดของสาย 14.2.x ตาม `npm view next@14.2 version`) แล้ว แต่ `npm audit` ยังรายงาน next เป็น **critical**: advisory ที่เหลือแก้ได้เฉพาะ `next@16.4.5` ซึ่งเป็น breaking change ผมไม่ได้รัน `npm audit fix --force` ข้ามเมเจอร์เอง

- ก่อน: **9 vulnerabilities (3 moderate, 3 high, 3 critical)** (บน next 14.2.23)
- หลัง: **9 vulnerabilities (3 moderate, 3 high, 3 critical)** — ไม่เปลี่ยนจำนวน
- เฉพาะ dependencies ที่ deploy จริง (`npm audit --omit=dev`): **3 vulnerabilities (2 high, 1 critical)** = `next`, `postcss` (ที่ next ฝังมา), `zod`
- ส่วนที่เหลือ (`vitest`, `vite`, `esbuild`, `tinypool`, `@vitest/mocker`) เป็น devDependencies ที่ไม่ขึ้น production

ผลที่ต้องตัดสินใจ: (ก) ย้ายไป Next 15/16 (breaking, ต้องทดสอบ), หรือ (ข) ตรวจ advisory รายข้อว่าเกี่ยวกับฟีเจอร์ที่แอปใช้หรือไม่ก่อนเปิด Vercel เท่าที่ `grep` พบ แอปไม่ได้ใช้ `next/image`, middleware, Server Actions, `next.config` (จึงไม่มี rewrites/remotePatterns) แต่ใช้ App Router และ route `/check/[packId]` เป็น dynamic (`ƒ` ในผล build) จึงอาจโดน advisory ด้านการ DoS ของ Server Components ได้ — ยังไม่ได้ตรวจละเอียดรายข้อ

## 6. Output ดิบ

> ทุกคำสั่งรันที่ branch `fix-rental-law` หลังแก้ครบ (ตัด ANSI สีออกเท่านั้น)


### 6.1 validate-packs (ทำงานก่อน build ผ่าน prebuild)

```text

> check-before-sign@0.1.0 validate-packs
> tsx scripts/validate-packs.ts

[Pack Validator] Scanning packs in: d:\check-before-sign\packs

--> Validating pack: rental
  [OK] pack.json is valid (21 questions, 18 rules)
  [OK] rules.ts exists
  [OK] cases.json is valid (25 test cases, all marked hypothetical)

[Pack Validator] All pack schemas validated successfully!
exit: 0
```

### 6.2 test — npx vitest run --reporter=verbose

```text
The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 d:/check-before-sign

 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: true for standard residential rental
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: false for dormitories under the dormitory act
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: false for hotel / daily stay (exclusion)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: false for small landlord under 3 units
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: false for commercial rentals
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > out-of-scope reasons warn that the 2562 notice was not checked
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Scope Gatekeeper: evaluateRentalScope > returns inScope: undetermined when unsure
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > toNum helper > parses numbers and rejects missing / unsure / negative / non-numeric
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10) > before the effective date → EVERY rule is undetermined, never violated/compliant
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10) > explains the transition (ข้อ 10) and that the 2562 text is not checked
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10) > boundary day (4 Sep 2568) → every rule undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10) > missing / unsure date → every rule undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > Applicability gate: contract date vs the 2568 notice (ข้อ 3 และข้อ 10) > on/after the effective date → gate is open
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_rental_scope > returns compliant when in_scope and after effective date
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_rental_scope > returns violated when out of scope
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_rental_scope > returns undetermined when unsure
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > compliant: advance 2 months + deposit 1 month = 3 months (spec case)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > compliant boundary: deposit 2 + advance 1 = 3 (equal to cap is allowed)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > compliant: deposit 1 + advance 1
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > compliant: no deposit and no advance (0 + 0)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > violated just over the cap: deposit 2.5 + advance 1 = 3.5
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > violated: deposit 2 + advance 2 = 4
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > floating-point safe: 1.1 + 1.9 = 3 is not over the cap
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > advance rent unknown + deposit within cap → undetermined, never assumed
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > deposit unknown + advance within cap → undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > one side alone already over the cap → violated even if the other is unknown (lower bound)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > both unknown → undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > long-term form B, monthly rent → same 3-month cap (ข้อ 6.2(2))
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > long-term form B, annual rent → cap is 1 year (ข้อ 6.2(3))
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > short-term form A with annual rent → 6.1(2) states no cap → undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_amount (เงินประกันรวมค่าเช่าล่วงหน้า — ข้อ 6.1(2), 6.2(2), 6.2(3)) > unknown contract form → undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_advance_rent has been removed (ตัวบทไม่มีเพดานค่าเช่าล่วงหน้า 1 เดือน) > no rule, no question and no legal text mention a separate 1-month advance-rent cap
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_electricity_tariff / rule_water_tariff (ข้อ 6.1(6)) > electricity: compliant / violated / flat-unknown / unsure
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_electricity_tariff / rule_water_tariff (ข้อ 6.1(6)) > water: compliant / violated / flat-unknown / unsure
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_period (แบบ ก ข้อ 10(ก): ภายใน 7 วัน ไม่ใช่วันทำการ) > compliant: within 7 days
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_period (แบบ ก ข้อ 10(ก): ภายใน 7 วัน ไม่ใช่วันทำการ) > violated: over 7 days, and the reason says "วัน" not "วันทำการ"
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_period (แบบ ก ข้อ 10(ก): ภายใน 7 วัน ไม่ใช่วันทำการ) > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_period (แบบ ก ข้อ 10(ก): ภายใน 7 วัน ไม่ใช่วันทำการ) > pack text no longer says 7 วันทำการ as the legal standard
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_after_deduction (แบบ ก ข้อ 10(ข): ภายใน 14 วัน) > compliant: within 14 days
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_after_deduction (แบบ ก ข้อ 10(ข): ภายใน 14 วัน) > violated: over 14 days (reason cites 14 วัน, not วันทำการ)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_after_deduction (แบบ ก ข้อ 10(ข): ภายใน 14 วัน) > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_refund_after_deduction (แบบ ก ข้อ 10(ข): ภายใน 14 วัน) > the 7-day and 14-day questions are independent (no cross-contamination)
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_deposit_forfeiture (ข้อ 6.1(4): ริบโดยมิใช่ความผิดของผู้เช่า) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_tenant_termination (แบบ ก ข้อ 13) > compliant: conforms
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_tenant_termination (แบบ ก ข้อ 13) > violated: prohibited — reason carries half-term, 30-day notice
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_tenant_termination (แบบ ก ข้อ 13) > violated: stricter conditions than the standard form
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_tenant_termination (แบบ ก ข้อ 13) > violated: advance rent refunded later than 7 days from the termination notice
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_tenant_termination (แบบ ก ข้อ 13) > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน) > compliant: ≥ 30 days notice
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน) > violated: shorter than 30 days, including for rent arrears — no "7 วันกรณีค้างค่าเช่า" exception
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน) > violated: no notice at all
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน) > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_notice (แบบ ก ข้อ 14 วรรคหนึ่ง: ≥ 30 วัน) > no pack text claims a 7-day exception for rent arrears
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_disturbance (แบบ ก ข้อ 14 วรรคสอง: ≥ 7 วัน) > compliant: ≥ 7 days notice, or no special clause
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_disturbance (แบบ ก ข้อ 14 วรรคสอง: ≥ 7 วัน) > violated: shorter than 7 days or immediate
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_termination_disturbance (แบบ ก ข้อ 14 วรรคสอง: ≥ 7 วัน) > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_lessor_terminate_without_breach (ข้อ 6.1(9)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_inspection_privacy (ข้อ 6.1(5)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_self_help_lockout (ข้อ 6.1(7)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_liability_exemption (ข้อ 6.1(1) — ต้องพิจารณา "เหตุผลที่สมควรเพียงพอ") > compliant: no such clause
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_liability_exemption (ข้อ 6.1(1) — ต้องพิจารณา "เหตุผลที่สมควรเพียงพอ") > undetermined (not violated): clause exists but whether it lacks adequate justification is a judgement call
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_liability_exemption (ข้อ 6.1(1) — ต้องพิจารณา "เหตุผลที่สมควรเพียงพอ") > undetermined: unsure or missing
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_rent_change_during_term (ข้อ 6.1(3)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_renewal_fee (ข้อ 6.1(8)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_normal_wear_liability (ข้อ 6.1(10) และ 6.1(12)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental Pack Rules Unit Tests (ขัด, ไม่ขัด, บอกไม่ได้, ค่าตรงขอบ) > rule_force_majeure_liability (ข้อ 6.1(11)) > compliant / violated / undetermined
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > every rule in pack.json has an evaluator, and every evaluator has a rule
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > every question referenced by an evaluator exists in pack.json (no orphan answers)
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > the contract-date question comes immediately after the scope question
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > all 12 prohibited clauses of ข้อ 6.1 are covered by a rule that cites them
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > the 2568 source links to the official OCPB PDF, not the old gazette id 72766
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > the 2562 source is a different document from the 2568 one
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > gazette ref for 2562 does not claim an unverified page number
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > effective date is 4 Sep 2568 = 6 Jun 2568 + 90 days
 ✓ tests/rental-rules.test.ts > Rental pack ↔ statute coverage and source integrity > no legal text carries claims that are not in the notice ("โมฆะ", "ข้อ ๕ ที่ห้ามมิให้")
stdout | tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > summary: all hypothetical cases match expected outputs 100%

========================================
Rental Cases Test Summary: 25 / 25 Cases Passed (100% Match)
All cases are explicitly verified as hypothetical examples.
========================================


 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 1 (case-01-fully-compliant): กรณีสมมุติ 1: สัญญาตรงตามประกาศ พ.ศ. 2568 ครบทุกข้อ
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 2 (case-02-classic-exploitative): กรณีสมมุติ 2: สัญญาเอาเปรียบหลายข้อ
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 3 (case-03-out-of-scope-dormitory): กรณีสมมุติ 3: หอพักตามกฎหมายว่าด้วยหอพัก (นอกขอบเขต)
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 4 (case-04-out-of-scope-few-units): กรณีสมมุติ 4: ผู้ให้เช่ามีห้องเช่าเพียง 1–2 หน่วย
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 5 (case-05-out-of-scope-commercial): กรณีสมมุติ 5: เช่าเพื่อเปิดร้านหรือสำนักงาน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 6 (case-06-out-of-scope-hotel): กรณีสมมุติ 6: ที่พักรายวันตามกฎหมายโรงแรม
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 7 (case-07-advance-2-deposit-1-compliant): กรณีสมมุติ 7: ค่าเช่าล่วงหน้า 2 เดือน + เงินประกัน 1 เดือน ต้องไม่ขัด
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 8 (case-08-boundary-deposit-2-advance-1): กรณีสมมุติ 8: ค่าตรงขอบ เงินประกัน 2 + ค่าเช่าล่วงหน้า 1 = 3 เดือน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 9 (case-09-over-cap-by-half-month): กรณีสมมุติ 9: เกินเพดานครึ่งเดือน (2.5 + 1 = 3.5)
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 10 (case-10-advance-unknown-undetermined): กรณีสมมุติ 10: ไม่ทราบค่าเช่าล่วงหน้า ต้องบอกไม่ได้
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 11 (case-11-deposit-alone-over-cap): กรณีสมมุติ 11: เงินประกันเพียงอย่างเดียวเกินเพดาน แม้ไม่ทราบค่าเช่าล่วงหน้า
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 12 (case-12-long-term-annual-compliant): กรณีสมมุติ 12: เช่าระยะยาว ค่าเช่ารายปี รวม 1 ปีพอดี
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 13 (case-13-long-term-annual-over): กรณีสมมุติ 13: เช่าระยะยาว ค่าเช่ารายปี รวมเกิน 1 ปี
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 14 (case-14-short-term-annual-rent): กรณีสมมุติ 14: เช่าระยะสั้น ค่าเช่ารายปี (ตัวบทไม่มีเพดาน)
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 15 (case-15-legacy-contract-before-effective-date): กรณีสมมุติ 15: ทำสัญญาก่อน 4 ก.ย. 2568 — บอกไม่ได้ทั้งชุด
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 16 (case-16-boundary-day): กรณีสมมุติ 16: ทำสัญญาวันที่ 4 ก.ย. 2568 พอดี — บอกไม่ได้ทั้งชุด
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 17 (case-17-unsure-contract-date): กรณีสมมุติ 17: ไม่แน่ใจวันที่ทำสัญญา — บอกไม่ได้ทั้งชุด
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 18 (case-18-refund-in-working-days): กรณีสมมุติ 18: คืนเงินประกัน "7 วันทำการ"
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 19 (case-19-refund-after-deduction-30-days): กรณีสมมุติ 19: หักค่าเสียหายแล้วคืนส่วนที่เหลือภายใน 30 วัน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 20 (case-20-lessor-terminates-after-7-days-arrears): กรณีสมมุติ 20: ผู้ให้เช่าบอกเลิกได้หลังค้างค่าเช่า 7 วัน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 21 (case-21-disturbance-3-day-notice): กรณีสมมุติ 21: รบกวนผู้เช่ารายอื่น บอกเลิกได้หลังแจ้ง 3 วัน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 22 (case-22-tenant-termination-late-refund): กรณีสมมุติ 22: ผู้เช่าเลิกได้ แต่คืนค่าเช่าล่วงหน้าหลัง 30 วัน
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 23 (case-23-all-unsure): กรณีสมมุติ 23: ไม่แน่ใจทุกข้อ (หลังตอบขอบเขตและวันที่ทำสัญญา)
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 24 (case-24-exemption-clause-judgement): กรณีสมมุติ 24: มีข้อยกเว้นความรับผิดของผู้ให้เช่า
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > Case 25 (case-25-flat-rate-utilities-unknown): กรณีสมมุติ 25: ค่าน้ำค่าไฟเหมาจ่ายแต่ไม่ทราบอัตราจริง
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > has at least 15 cases and every case answers only questions that exist in pack.json
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > every in-scope case sums to the number of rules (counts are exhaustive)
 ✓ tests/rental-cases.test.ts > Rental Pack Cases Verification (ชุดตัวอย่างแต่งขึ้น) > summary: all hypothetical cases match expected outputs 100%
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > validates dummy pack against Zod schema
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > stops evaluation early when out of scope
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > evaluates all rules when in scope (compliant and violated)
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > returns undetermined when answers are unsure or missing
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > Privacy-Safe Link Sharing > encodes and decodes answers accurately without PII
 ✓ tests/engine.test.ts > Engine Core (Decoupled from Rental Pack) > Privacy-Safe Link Sharing > returns null gracefully on invalid hash

 Test Files  3 passed (3)
      Tests  109 passed (109)
   Start at  14:06:27
   Duration  1.24s (transform 300ms, setup 0ms, collect 730ms, tests 78ms, environment 1ms, prepare 819ms)

exit: 0
```

### 6.3 typecheck — npm run typecheck

```text

> check-before-sign@0.1.0 typecheck
> tsc --noEmit

exit: 0
```

### 6.4 build — npm run build

```text

> check-before-sign@0.1.0 prebuild
> tsx scripts/validate-packs.ts

[Pack Validator] Scanning packs in: d:\check-before-sign\packs

--> Validating pack: rental
  [OK] pack.json is valid (21 questions, 18 rules)
  [OK] rules.ts exists
  [OK] cases.json is valid (25 test cases, all marked hypothetical)

[Pack Validator] All pack schemas validated successfully!

> check-before-sign@0.1.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
<w> [webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo] Resolving '../../../typescript/lib/typescript' in d:\check-before-sign\node_modules\next\dist\build for build dependencies doesn't lead to expected result 'D:\check-before-sign\node_modules\typescript\lib\typescript.js', but to 'd:\check-before-sign\node_modules\typescript\lib\typescript.js' instead. Resolving dependencies are ignored for this path.
<w>  at resolve commonjs file ../../../typescript/lib/typescript (expected D:\check-before-sign\node_modules\typescript\lib\typescript.js)
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\load-jsconfig.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\load-jsconfig.js
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\webpack-config.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\webpack-config.js
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\handle-externals.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\handle-externals.js
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
<w>  at resolve commonjs d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
<w> [webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo] Resolving '../../../typescript/lib/typescript' in d:\check-before-sign\node_modules\next\dist\build for build dependencies doesn't lead to expected result 'D:\check-before-sign\node_modules\typescript\lib\typescript.js', but to 'd:\check-before-sign\node_modules\typescript\lib\typescript.js' instead. Resolving dependencies are ignored for this path.
<w>  at resolve commonjs file ../../../typescript/lib/typescript (expected D:\check-before-sign\node_modules\typescript\lib\typescript.js)
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\load-jsconfig.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\load-jsconfig.js
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\webpack-config.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\webpack-config.js
<w>  at file dependencies d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
<w>  at file d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
<w>  at resolve commonjs d:\check-before-sign\node_modules\next\dist\build\webpack\loaders\next-swc-loader.js
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
┌ ○ /                                    175 B          96.1 kB
├ ○ /_not-found                          873 B          88.1 kB
└ ƒ /check/[packId]                      30.8 kB         127 kB
+ First Load JS shared by all            87.3 kB
  ├ chunks/117-905fadd7e2e1b826.js       31.7 kB
  ├ chunks/fd9d1056-cce117dc4e21e608.js  53.6 kB
  └ other shared chunks (total)          1.89 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

exit: 0
```

### 6.5 audit ก่อนอัปเกรด (next 14.2.23) — npm audit

```text
# npm audit report

@vitest/mocker  <=4.1.11
Severity: moderate
Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock - https://github.com/advisories/GHSA-82fw-gwwq-j7x9
Vitest: Code injection via unauthenticated manual mock registration - https://github.com/advisories/GHSA-qxg6-89mg-rqv8
Depends on vulnerable versions of vite
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/@vitest/mocker
  vitest  <=4.1.10
  Depends on vulnerable versions of @vitest/mocker
  Depends on vulnerable versions of tinypool
  Depends on vulnerable versions of vite
  Depends on vulnerable versions of vite-node
  node_modules/vitest

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/vite/node_modules/esbuild
  vite  <=6.4.3
  Depends on vulnerable versions of esbuild
  node_modules/vite
    vite-node  <=2.2.0-beta.2
    Depends on vulnerable versions of vite
    node_modules/vite-node

next  0.9.9 - 16.3.0-preview.10
Severity: critical
Information exposure in Next.js dev server due to lack of origin verification - https://github.com/advisories/GHSA-3h52-269p-cp9r
Next.js Affected by Cache Key Confusion for Image Optimization API Routes - https://github.com/advisories/GHSA-g5qg-72qw-gw5v
Next.js Improper Middleware Redirect Handling Leads to SSRF - https://github.com/advisories/GHSA-4342-x723-ch2f
Next.js Content Injection Vulnerability for Image Optimization - https://github.com/advisories/GHSA-xv57-4mr9-wg8v
Next.js Race Condition to Cache Poisoning - https://github.com/advisories/GHSA-qpjv-v59x-3qc4
Next Vulnerable to Denial of Service with Server Components - https://github.com/advisories/GHSA-mwv6-3258-q52c
Next has a Denial of Service with Server Components - Incomplete Fix Follow-Up - https://github.com/advisories/GHSA-5j59-xgg2-r9c4
Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns configuration - https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components - https://github.com/advisories/GHSA-h25m-26qc-wcjf
Authorization Bypass in Next.js Middleware - https://github.com/advisories/GHSA-f82v-jwr5-mffw
Next.js: HTTP request smuggling in rewrites - https://github.com/advisories/GHSA-ggv3-7p47-pfv8
Next.js: Unbounded next/image disk cache growth can exhaust storage - https://github.com/advisories/GHSA-3x4c-7xq6-9pq8
Next.js has a Denial of Service with Server Components - https://github.com/advisories/GHSA-q4gf-8mx6-v5v3
Next.js Vulnerable to Denial of Service with Server Components - https://github.com/advisories/GHSA-8h8q-6873-q5fj
Next.js's Middleware / Proxy redirects can be cache-poisoned - https://github.com/advisories/GHSA-3g8h-86w9-wvmq
Next.js vulnerable to cross-site scripting in App Router applications using CSP nonces - https://github.com/advisories/GHSA-ffhc-5mcf-pf4q
Next.js vulnerable to cache poisoning via collisions in React Server Component cache-busting - https://github.com/advisories/GHSA-vfv6-92ff-j949
Next.js has cross-site scripting in beforeInteractive scripts with untrusted input - https://github.com/advisories/GHSA-gx5p-jg67-6x7h
Next.js has a Denial of Service in the Image Optimization API - https://github.com/advisories/GHSA-h64f-5h5j-jqjh
Next.js vulnerable to server-side request forgery in applications using WebSocket upgrades - https://github.com/advisories/GHSA-c4j6-fc7j-m34r
Next.js vulnerable to cache poisoning in React Server Component responses - https://github.com/advisories/GHSA-wfc6-r584-vfw7
Next.js has a Middleware / Proxy bypass in Pages Router applications using i18n - https://github.com/advisories/GHSA-36qx-fr4f-26g5
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-m99w-x7hq-7vfj
Next.js: Server-Side Request Forgery in Server Actions on custom servers - https://github.com/advisories/GHSA-89xv-2m56-2m9x
Next.js: Cache confusion of response bodies for requests with bodies - https://github.com/advisories/GHSA-68g3-v927-f742
Next.js: Cache confusion of response bodies for requests with bodies containing invalid UTF-8 byte sequences - https://github.com/advisories/GHSA-4633-3j49-mh5q
Next.js: Unbounded Server Action payload in Edge runtime - https://github.com/advisories/GHSA-4c39-4ccg-62r3
Next.js: Server-Side Request Forgery in rewrites via attacker-controlled destination hostname - https://github.com/advisories/GHSA-p9j2-gv94-2wf4
Next.js: Unauthenticated disclosure of internal Server Function endpoints - https://github.com/advisories/GHSA-955p-x3mx-jcvp
Next.js: Unauthenticated Remote Code Execution on windows-hosted servers - https://github.com/advisories/GHSA-p293-qw3h-jr36
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used - https://github.com/advisories/GHSA-2xp9-vwfh-vxw4
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used - https://github.com/advisories/GHSA-2464-fhr4-w9xw
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-p3m5-59mp-jv5r
Depends on vulnerable versions of postcss
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next

postcss  <=8.5.22
Severity: high
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments - https://github.com/advisories/GHSA-6g55-p6wh-862q
PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset - https://github.com/advisories/GHSA-fxqj-rqcc-2cmp
PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure - https://github.com/advisories/GHSA-r28c-9q8g-f849
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next/node_modules/postcss

tinypool  <=2.1.1
Severity: critical
Tinypool: Prototype Pollution gadget in worker options leads to Remote Code Execution - https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
Tinypool: Prototype Pollution Gadget to RCE in run() options - https://github.com/advisories/GHSA-85c8-ppgw-ccpr
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/tinypool



zod  <4.6.6
Severity: high
Zod can exhaust memory while validating oversized constrained collections - https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
fix available via `npm audit fix --force`
Will install zod@4.6.7, which is a breaking change
node_modules/zod

9 vulnerabilities (3 moderate, 3 high, 3 critical)

To address all issues (including breaking changes), run:
  npm audit fix --force
```

### 6.6 audit หลังอัปเกรด (next 14.2.35) — npm audit

```text
# npm audit report

@vitest/mocker  <=4.1.11
Severity: moderate
Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock - https://github.com/advisories/GHSA-82fw-gwwq-j7x9
Vitest: Code injection via unauthenticated manual mock registration - https://github.com/advisories/GHSA-qxg6-89mg-rqv8
Depends on vulnerable versions of vite
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/@vitest/mocker
  vitest  <=4.1.10
  Depends on vulnerable versions of @vitest/mocker
  Depends on vulnerable versions of tinypool
  Depends on vulnerable versions of vite
  Depends on vulnerable versions of vite-node
  node_modules/vitest

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/vite/node_modules/esbuild
  vite  <=6.4.3
  Depends on vulnerable versions of esbuild
  node_modules/vite
    vite-node  <=2.2.0-beta.2
    Depends on vulnerable versions of vite
    node_modules/vite-node

next  9.3.4-canary.0 - 16.3.0-preview.10
Severity: critical
Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns configuration - https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components - https://github.com/advisories/GHSA-h25m-26qc-wcjf
Next.js: HTTP request smuggling in rewrites - https://github.com/advisories/GHSA-ggv3-7p47-pfv8
Next.js: Unbounded next/image disk cache growth can exhaust storage - https://github.com/advisories/GHSA-3x4c-7xq6-9pq8
Next.js has a Denial of Service with Server Components - https://github.com/advisories/GHSA-q4gf-8mx6-v5v3
Next.js Vulnerable to Denial of Service with Server Components - https://github.com/advisories/GHSA-8h8q-6873-q5fj
Next.js's Middleware / Proxy redirects can be cache-poisoned - https://github.com/advisories/GHSA-3g8h-86w9-wvmq
Next.js vulnerable to cross-site scripting in App Router applications using CSP nonces - https://github.com/advisories/GHSA-ffhc-5mcf-pf4q
Next.js vulnerable to cache poisoning via collisions in React Server Component cache-busting - https://github.com/advisories/GHSA-vfv6-92ff-j949
Next.js has cross-site scripting in beforeInteractive scripts with untrusted input - https://github.com/advisories/GHSA-gx5p-jg67-6x7h
Next.js has a Denial of Service in the Image Optimization API - https://github.com/advisories/GHSA-h64f-5h5j-jqjh
Next.js vulnerable to server-side request forgery in applications using WebSocket upgrades - https://github.com/advisories/GHSA-c4j6-fc7j-m34r
Next.js vulnerable to cache poisoning in React Server Component responses - https://github.com/advisories/GHSA-wfc6-r584-vfw7
Next.js has a Middleware / Proxy bypass in Pages Router applications using i18n - https://github.com/advisories/GHSA-36qx-fr4f-26g5
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-m99w-x7hq-7vfj
Next.js: Server-Side Request Forgery in Server Actions on custom servers - https://github.com/advisories/GHSA-89xv-2m56-2m9x
Next.js: Cache confusion of response bodies for requests with bodies - https://github.com/advisories/GHSA-68g3-v927-f742
Next.js: Cache confusion of response bodies for requests with bodies containing invalid UTF-8 byte sequences - https://github.com/advisories/GHSA-4633-3j49-mh5q
Next.js: Unbounded Server Action payload in Edge runtime - https://github.com/advisories/GHSA-4c39-4ccg-62r3
Next.js: Server-Side Request Forgery in rewrites via attacker-controlled destination hostname - https://github.com/advisories/GHSA-p9j2-gv94-2wf4
Next.js: Unauthenticated disclosure of internal Server Function endpoints - https://github.com/advisories/GHSA-955p-x3mx-jcvp
Next.js: Unauthenticated Remote Code Execution on windows-hosted servers - https://github.com/advisories/GHSA-p293-qw3h-jr36
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used - https://github.com/advisories/GHSA-2xp9-vwfh-vxw4
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used - https://github.com/advisories/GHSA-2464-fhr4-w9xw
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-p3m5-59mp-jv5r
Depends on vulnerable versions of postcss
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next

postcss  <=8.5.22
Severity: high
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments - https://github.com/advisories/GHSA-6g55-p6wh-862q
PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset - https://github.com/advisories/GHSA-fxqj-rqcc-2cmp
PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure - https://github.com/advisories/GHSA-r28c-9q8g-f849
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next/node_modules/postcss

tinypool  <=2.1.1
Severity: critical
Tinypool: Prototype Pollution gadget in worker options leads to Remote Code Execution - https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
Tinypool: Prototype Pollution Gadget to RCE in run() options - https://github.com/advisories/GHSA-85c8-ppgw-ccpr
fix available via `npm audit fix --force`
Will install vitest@5.1.0, which is a breaking change
node_modules/tinypool



zod  <4.6.6
Severity: high
Zod can exhaust memory while validating oversized constrained collections - https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
fix available via `npm audit fix --force`
Will install zod@4.6.7, which is a breaking change
node_modules/zod

9 vulnerabilities (3 moderate, 3 high, 3 critical)

To address all issues (including breaking changes), run:
  npm audit fix --force
exit: 1
```

### 6.7 audit เฉพาะ production — npm audit --omit=dev

```text
# npm audit report

next  9.3.4-canary.0 - 16.3.0-preview.10
Severity: critical
Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns configuration - https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components - https://github.com/advisories/GHSA-h25m-26qc-wcjf
Next.js: HTTP request smuggling in rewrites - https://github.com/advisories/GHSA-ggv3-7p47-pfv8
Next.js: Unbounded next/image disk cache growth can exhaust storage - https://github.com/advisories/GHSA-3x4c-7xq6-9pq8
Next.js has a Denial of Service with Server Components - https://github.com/advisories/GHSA-q4gf-8mx6-v5v3
Next.js Vulnerable to Denial of Service with Server Components - https://github.com/advisories/GHSA-8h8q-6873-q5fj
Next.js's Middleware / Proxy redirects can be cache-poisoned - https://github.com/advisories/GHSA-3g8h-86w9-wvmq
Next.js vulnerable to cross-site scripting in App Router applications using CSP nonces - https://github.com/advisories/GHSA-ffhc-5mcf-pf4q
Next.js vulnerable to cache poisoning via collisions in React Server Component cache-busting - https://github.com/advisories/GHSA-vfv6-92ff-j949
Next.js has cross-site scripting in beforeInteractive scripts with untrusted input - https://github.com/advisories/GHSA-gx5p-jg67-6x7h
Next.js has a Denial of Service in the Image Optimization API - https://github.com/advisories/GHSA-h64f-5h5j-jqjh
Next.js vulnerable to server-side request forgery in applications using WebSocket upgrades - https://github.com/advisories/GHSA-c4j6-fc7j-m34r
Next.js vulnerable to cache poisoning in React Server Component responses - https://github.com/advisories/GHSA-wfc6-r584-vfw7
Next.js has a Middleware / Proxy bypass in Pages Router applications using i18n - https://github.com/advisories/GHSA-36qx-fr4f-26g5
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-m99w-x7hq-7vfj
Next.js: Server-Side Request Forgery in Server Actions on custom servers - https://github.com/advisories/GHSA-89xv-2m56-2m9x
Next.js: Cache confusion of response bodies for requests with bodies - https://github.com/advisories/GHSA-68g3-v927-f742
Next.js: Cache confusion of response bodies for requests with bodies containing invalid UTF-8 byte sequences - https://github.com/advisories/GHSA-4633-3j49-mh5q
Next.js: Unbounded Server Action payload in Edge runtime - https://github.com/advisories/GHSA-4c39-4ccg-62r3
Next.js: Server-Side Request Forgery in rewrites via attacker-controlled destination hostname - https://github.com/advisories/GHSA-p9j2-gv94-2wf4
Next.js: Unauthenticated disclosure of internal Server Function endpoints - https://github.com/advisories/GHSA-955p-x3mx-jcvp
Next.js: Unauthenticated Remote Code Execution on windows-hosted servers - https://github.com/advisories/GHSA-p293-qw3h-jr36
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used - https://github.com/advisories/GHSA-2xp9-vwfh-vxw4
Next.js: Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used - https://github.com/advisories/GHSA-2464-fhr4-w9xw
Next.js: Denial of Service in App Router using Server Actions - https://github.com/advisories/GHSA-p3m5-59mp-jv5r
Depends on vulnerable versions of postcss
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next

postcss  <=8.5.22
Severity: high
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments - https://github.com/advisories/GHSA-6g55-p6wh-862q
PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset - https://github.com/advisories/GHSA-fxqj-rqcc-2cmp
PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure - https://github.com/advisories/GHSA-r28c-9q8g-f849
fix available via `npm audit fix --force`
Will install next@16.4.5, which is a breaking change
node_modules/next/node_modules/postcss

zod  <4.6.6
Severity: high
Zod can exhaust memory while validating oversized constrained collections - https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
fix available via `npm audit fix --force`
Will install zod@4.6.7, which is a breaking change
node_modules/zod

3 vulnerabilities (2 high, 1 critical)

To address all issues (including breaking changes), run:
  npm audit fix --force
exit: 1
```
