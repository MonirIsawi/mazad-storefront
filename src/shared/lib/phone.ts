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
