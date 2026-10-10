/** Barcode helpers shared by order picking and inventory lookup. Pure functions. */

/** EAN-8, UPC-A (12), EAN-13 and ITF-14 are all 8 to 14 digits. */
const BARCODE_PATTERN = /^\d{8,14}$/;

/** Strips whitespace. Returns null when the input cannot be a retail barcode. */
export function normaliseBarcode(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, '');
  return BARCODE_PATTERN.test(cleaned) ? cleaned : null;
}

/**
 * Scanners disagree on UPC-A: some report 12 digits, others the same code as
 * EAN-13 with a leading zero. Treat those two forms as the same barcode.
 */
export function barcodesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const strip = (code: string) => (code.length === 13 && code.startsWith('0') ? code.slice(1) : code);
  return strip(a) === strip(b);
}
