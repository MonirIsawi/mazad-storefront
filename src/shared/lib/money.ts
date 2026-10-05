import type { Locale } from '@shared/store';

const CURRENCY_LABEL: Record<Locale, string> = { ar: 'د.ع', en: 'IQD' };

// A string rather than an array so indexing is total — charAt never widens to `undefined` the
// way an element access does under noUncheckedIndexedAccess.
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * mazad-api serializes every price as a Decimal string (e.g. "1250.00"), never a JSON number
 * (see ADR-009). This is the only place that parses one.
 */
export function parseMoney(value: string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** mazad-api's Decimal(12, 2) ceiling; larger amounts are refused there. */
export const MAX_MONEY_AMOUNT = 9_999_999_999.99;

/**
 * Money arithmetic happens in integer minor units (hundredths, matching the API's Decimal(12, 2)),
 * never in binary floating point: the largest amount is 999,999,999,999 minor units, well inside
 * Number's exact-integer range. A Decimal string is parsed digit by digit; a number (a Stepper
 * value, an input) is first rounded to 2 decimals, which also absorbs float noise like 0.1 + 0.2.
 */
export function toMinorUnits(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const text =
    typeof value === 'number' ? (Number.isFinite(value) ? value.toFixed(2) : '') : value.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const [, sign, whole, fraction = ''] = match;
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) return null;
  return sign === '-' ? -minor : minor;
}

/** Minor units back to the amount the API takes (`{ amount: 1260.5 }` serializes exactly). */
export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

/** Snaps a computed amount (e.g. value ± step) to exact 2-decimal money. */
export function roundMoney(value: number): number {
  const minor = toMinorUnits(value);
  return minor == null ? value : fromMinorUnits(minor);
}

/**
 * Western numerals → Arabic-Indic. Every *quantity* the user reads in Arabic goes through this:
 * prices, bid counts, ratings, item counts. Countdowns deliberately don't — they stay Western
 * with tabular-nums so the digits don't jitter width while ticking (design system, "Money and
 * time").
 */
export function toArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS.charAt(Number(digit)));
}

/** Localizes a bare number — bid counts, follower counts — without a currency suffix. */
export function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  return locale === 'ar' ? toArabicDigits(grouped) : grouped;
}

/**
 * Iraqi Dinar has no minor unit, so amounts never show decimals. Grouping is always the Western
 * comma (`١٢٥,٠٠٠ د.ع`) rather than Intl's `ar` group separator — that's what the design system
 * specifies, and it keeps the separator identical across both locales.
 */
export function formatMoney(value: string | null | undefined, locale: Locale): string {
  const amount = parseMoney(value);
  if (amount == null) return '—';
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  const digits = locale === 'ar' ? toArabicDigits(grouped) : grouped;
  return `${digits} ${CURRENCY_LABEL[locale]}`;
}
