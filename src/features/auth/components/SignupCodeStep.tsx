'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import type { SentSignupCode } from '../hooks/useSignupOtp';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { OtpCodeField } from './fields/OtpCodeField';
import { ResendCodeButton } from './ResendCodeButton';

interface SignupCodeStepProps {
  sent: SentSignupCode;
  code: string;
  codeField: UseFormRegisterReturn<'code'>;
  codeError?: string;
  notice: string | null;
  isResending: boolean;
  onResend: () => void;
}

/** The code half of sign-up and reset: six boxes, a "new code sent" note and the resend timer. */
export function SignupCodeStep({
  sent,
  code,
  codeField,
  codeError,
  notice,
  isResending,
  onResend,
}: SignupCodeStepProps) {
  const { t } = useAuthTranslation();
  return (
    <div className="grid gap-3">
      <OtpCodeField label={t('fields.code')} value={code} error={codeError} field={codeField} />
      {notice ? (
        <p role="status" className="text-center text-sm text-live">
          {notice}
        </p>
      ) : null}
      <ResendCodeButton
        availableAt={sent.resendAvailableAt}
        isResending={isResending}
        onResend={onResend}
      />
    </div>
  );
}
