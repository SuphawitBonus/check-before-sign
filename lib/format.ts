// Display-only helpers. They never touch pack data or rule results.

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

/** The site shows Arabic numerals everywhere (DESIGN.md §2); pack.json keeps the gazette's Thai numerals. */
export function toArabicDigits(text: string): string {
  return text.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)));
}
