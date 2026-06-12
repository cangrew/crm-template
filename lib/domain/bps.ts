/**
 * Basis-point helpers for forms. Cuts and splits are stored as integer basis
 * points (10000 = 100%) so penny math stays exact; the UI edits them as
 * percent strings ("82.5").
 */

/** 8250 -> "82.5" */
export function bpsToPercentString(bps: number): string {
  return String(bps / 100);
}

/** "82.5" -> 8250. Assumes the string already passed form validation. */
export function percentStringToBps(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

/** Whether a trimmed string is a percentage between 0 and 100 (≤2 decimals). */
export function isValidPercentString(value: string): boolean {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return false;
  const n = parseFloat(value);
  return n >= 0 && n <= 100;
}

/** 8250 -> "82.5%" for display. */
export function fmtBpsPercent(bps: number): string {
  return `${bps / 100}%`;
}
