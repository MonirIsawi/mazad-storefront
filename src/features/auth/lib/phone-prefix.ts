import { toAsciiDigits } from '@shared/lib/phone';

/** The country code the sign-in fields show in front of the number (design: fixed +964). */
export const IRAQ_DIAL_CODE = '+964';

/**
 * The phone as the API reads it, from what was typed after the fixed +964: "770 812 4419" and
 * "0770 812 4419" become "+964770 812 4419". A number typed or pasted with its own country code
 * (+…, 00…, 964…) is kept as it is, so nothing is ever prefixed twice.
 */
export function withIraqiPrefix(input: string): string {
  const text = toAsciiDigits(input).trim();
  if (!text || text.startsWith('+') || text.startsWith('00')) return text;
  if (/^964/.test(text.replace(/\D/g, ''))) return `+${text}`;
  return `${IRAQ_DIAL_CODE}${text.replace(/^0+/, '')}`;
}
