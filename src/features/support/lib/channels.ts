/*
 * Chat channels for support, from build-time config only. Both are unset today, so nothing is
 * shown; a value that isn't well formed is ignored rather than linked.
 * - NEXT_PUBLIC_SUPPORT_WHATSAPP: the number in international form, digits only (9647XXXXXXXXX).
 * - NEXT_PUBLIC_SUPPORT_TELEGRAM: the account or bot username, without the @.
 */

export interface SupportChannel {
  id: 'whatsapp' | 'telegram';
  href: string;
}

const WHATSAPP_NUMBER = /^[1-9]\d{7,14}$/;
const TELEGRAM_USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export function supportChannels(
  whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP,
  telegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM,
): SupportChannel[] {
  const channels: SupportChannel[] = [];
  const number = whatsapp?.trim().replace(/^\+/, '');
  if (number && WHATSAPP_NUMBER.test(number)) {
    channels.push({ id: 'whatsapp', href: `https://wa.me/${number}` });
  }
  const username = telegram?.trim().replace(/^@/, '');
  if (username && TELEGRAM_USERNAME.test(username)) {
    channels.push({ id: 'telegram', href: `https://t.me/${username}` });
  }
  return channels;
}
