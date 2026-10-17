'use client';

import { isolatePhone } from '@shared/lib';
import type { SentSignupCode } from './useSignupOtp';
import { useAuthTranslation } from './useAuthTranslation';

/**
 * Where the code went: the Telegram chat linked to the number, or (not linked yet) how to get it
 * from the bot. The phone is isolated left-to-right so "+964…" keeps its plus sign in Arabic.
 */
export function useCodeSentLine(sent: SentSignupCode | null): string | null {
  const { t } = useAuthTranslation();
  if (!sent) return null;
  const phone = isolatePhone(sent.phone);
  return sent.result.delivered
    ? t('register.codeSentTo', { phone })
    : t('register.openTelegram', { phone });
}
