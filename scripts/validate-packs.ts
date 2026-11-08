import fs from 'fs';
import path from 'path';
import { PackDefinitionSchema, CasesSchema } from '../lib/engine/schema';

function validateAllPacks() {
  const packsDir = path.resolve(process.cwd(), 'packs');
  console.log(`[Pack Validator] Scanning packs in: ${packsDir}`);

  if (!fs.existsSync(packsDir)) {
    console.error(`[Pack Validator] Error: packs directory not found at ${packsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(packsDir, { withFileTypes: true });
  const packDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'));

  if (packDirs.length === 0) {
    console.error(`[Pack Validator] Error: No pack directories found in ${packsDir}`);
    process.exit(1);
  }

  let totalErrors = 0;

  for (const dir of packDirs) {
    const packPath = path.join(packsDir, dir.name);
    console.log(`\n--> Validating pack: ${dir.name}`);

    // 1. Check pack.json
    const packJsonPath = path.join(packPath, 'pack.json');
    if (!fs.existsSync(packJsonPath)) {
      console.error(`  [FAIL] Missing pack.json in ${packPath}`);
      totalErrors++;
      continue;
    }

    try {
      const rawJson = fs.readFileSync(packJsonPath, 'utf-8');
      const packData = JSON.parse(rawJson);
      const validatedPack = PackDefinitionSchema.parse(packData);
      console.log(`  [OK] pack.json is valid (${validatedPack.questions.length} questions, ${validatedPack.rules.length} rules)`);
    } catch (err: any) {
      console.error(`  [FAIL] pack.json schema validation error in ${dir.name}:`);
      console.error(err.message || err);
      totalErrors++;
    }

    // 2. Check rules.ts
    const rulesTsPath = path.join(packPath, 'rules.ts');
    if (!fs.existsSync(rulesTsPath)) {
      console.error(`  [FAIL] Missing rules.ts in ${packPath}`);
      totalErrors++;
    } else {
      console.log(`  [OK] rules.ts exists`);
    }

    // 3. Check cases.json
    const casesJsonPath = path.join(packPath, 'cases.json');
    if (!fs.existsSync(casesJsonPath)) {
      console.error(`  [FAIL] Missing cases.json in ${packPath}`);
      totalErrors++;
    } else {
      try {
        const rawCases = fs.readFileSync(casesJsonPath, 'utf-8');
        const casesData = JSON.parse(rawCases);
        const validatedCases = CasesSchema.parse(casesData);
        console.log(`  [OK] cases.json is valid (${validatedCases.length} test cases, all marked hypothetical)`);
      } catch (err: any) {
        console.error(`  [FAIL] cases.json schema validation error in ${dir.name}:`);
        console.error(err.message || err);
        totalErrors++;
      }
    }
  }

  if (totalErrors > 0) {
    console.error(`\n[Pack Validator] Build failed with ${totalErrors} error(s)!`);
    process.exit(1);
  } else {
    console.log(`\n[Pack Validator] All pack schemas validated successfully!`);
  }
}

validateAllPacks();
