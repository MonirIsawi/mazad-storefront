/**
 * A `tel:` link for a phone number the screen already shows (the delivery phone a buyer gave), or
 * null when it isn't dialable. Keeps a leading `+` and the digits only (spaces, dashes and
 * brackets are dropped), and expects 7–15 digits, the E.164 range.
 */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/**
 * A phone number isolated left-to-right (U+2066 … U+2069), so "+964…" keeps its plus sign in front
 * inside Arabic text without changing the paragraph's alignment.
 */
export function isolatePhone(phone: string): string {
  return `⁦${phone}⁩`;
}

/*
 * Phone numbers as Iraqi users type them, read the way mazad-api reads them (phone.util.ts):
 * 07…, 7…, +964…, 00964…, Arabic-Indic or Persian digits, spaces, dashes, dots and brackets.
 * The canonical form is +9647XXXXXXXXX; a local number never becomes "+07…".
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** ٠–٩ and ۰–۹ → 0–9; everything else unchanged. */
export function toAsciiDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN.indexOf(digit)));
}

/** An Iraqi mobile without the country code or trunk zero: 7, then 3–9, then 8 digits. */
const IRAQI_MOBILE = /^7[3-9]\d{8}$/;

/**
 * The canonical phone (+9647XXXXXXXXX for Iraqi mobiles, +<digits> for a foreign number written
 * with its country code), or null when the text isn't a usable phone number.
 */
export function parsePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const text = toAsciiDigits(input).trim();
  if (!text || /[^\d+\s\-().]/.test(text)) return null;
  const plus = text.startsWith('+');
  if ((text.match(/\+/g) ?? []).length > (plus ? 1 : 0)) return null;
  let digits = text.replace(/\D/g, '');
  const international = plus || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Iraqi: 9647…, 96407…, 07…, 7…
  let national: string | null = null;
  if (digits.startsWith('964')) national = digits.slice(3).replace(/^0/, '');
  else if (!international) national = digits.replace(/^0/, '');
  if (national && IRAQI_MOBILE.test(national)) return `+964${national}`;
  // Short demo numbers seeded with +964 keep working as typed.
  if (digits.startsWith('964') && /^\d{9,10}$/.test(digits.slice(3))) return `+${digits}`;

  if (international && !digits.startsWith('964') && /^[1-9]\d{7,14}$/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}

/** What to send: the canonical form when the number is recognised, else the trimmed text. */
export function normalizePhone(input: string): string {
  return parsePhone(input) ?? toAsciiDigits(input).trim();
}
