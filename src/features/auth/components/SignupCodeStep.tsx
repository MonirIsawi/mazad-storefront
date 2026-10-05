'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button, Input } from '@shared/components/ui';
import { OTP_CODE_LENGTH } from '../schemas/auth.schema';
import type { SentSignupCode } from '../hooks/useSignupOtp';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { ResendCodeButton } from './ResendCodeButton';

interface SignupCodeStepProps {
  sent: SentSignupCode;
  codeField: UseFormRegisterReturn<'code'>;
  codeError?: string;
  notice: string | null;
  isResending: boolean;
  onResend: () => void;
  onChangePhone: () => void;
}

/** Second half of sign-up: where the code went, the code field, resend and "wrong number". */
export function SignupCodeStep({
  sent,
  codeField,
  codeError,
  notice,
  isResending,
  onResend,
  onChangePhone,
}: SignupCodeStepProps) {
  const { t } = useAuthTranslation();
  const { delivered, telegramDeepLink } = sent.result;
  // Isolated left-to-right so "+964…" keeps its plus sign in front inside Arabic text.
  const phone = `⁦${sent.phone}⁩`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {delivered ? t('register.codeSentTo', { phone }) : t('register.openTelegram', { phone })}
      </p>
      {!delivered && telegramDeepLink ? (
        <a
          href={telegramDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent hover:underline"
        >
          {t('register.openTelegramLink')}
        </a>
      ) : null}
      <Input
        label={t('fields.code')}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_CODE_LENGTH}
        error={codeError}
        {...codeField}
      />
      {notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <ResendCodeButton
          availableAt={sent.resendAvailableAt}
          isResending={isResending}
          onResend={onResend}
        />
        <Button variant="plain" size="sm" onClick={onChangePhone}>
          {t('register.changePhone')}
        </Button>
      </div>
    </div>
  );
}
