'use client';

import { useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@shared/components/ui';
import { normalizePhone } from '@shared/lib';
import { registerSchema } from '../schemas/auth.schema';
import type { RegisterValues } from '../types/auth.types';
import { useRegister } from '../hooks/useRegister';
import { useSignupOtp } from '../hooks/useSignupOtp';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { useCodeSentLine } from '../hooks/useCodeSentLine';
import { resolveAuthErrorCode } from '../lib/auth-errors';
import { withIraqiPrefix } from '../lib/phone-prefix';
import { AuthHeading } from './shell/AuthHeading';
import { StepBar } from './shell/StepBar';
import { RegisterDetailsFields } from './RegisterDetailsFields';
import { SignupCodeStep } from './SignupCodeStep';
import { CodeStepActions } from './CodeStepActions';
import { FormAlert } from './fields/FormAlert';
import { TermsNotice } from './TermsNotice';

/** Checked before a code is requested; the code itself is only asked for afterwards. */
const DETAIL_FIELDS = ['fullName', 'phone', 'password'] as const;

/**
 * Two real steps on one form: details → "send code" (POST /auth/otp/request, purpose SIGNUP),
 * then code → "create account" (POST /auth/register with the code). The details stay mounted and
 * locked while a code is pending, so the account is created for exactly the phone the code was
 * sent to, and "Change number" goes back with the name and password kept.
 */
export function RegisterForm() {
  const { t } = useAuthTranslation();
  const { t: tCommon } = useTranslation('common');
  const registerMutation = useRegister();
  const otp = useSignupOtp();
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    resetField,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', password: '', code: '' },
  });
  const code = useWatch({ control, name: 'code' }) ?? '';
  const sentLine = useCodeSentLine(otp.sent);

  const isVerifying = otp.sent !== null;
  const fieldError = (key?: string) => (key ? t(key) : undefined);

  const sendCode = (phone: string, isResend: boolean) => {
    setNotice(null);
    registerMutation.reset();
    otp.request(phone, {
      onSuccess: () => {
        resetField('code');
        if (isResend) setNotice(t('register.newCodeSent'));
      },
    });
  };

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!(await trigger([...DETAIL_FIELDS]))) return;
    sendCode(normalizePhone(withIraqiPrefix(getValues('phone'))), false);
  };

  const createAccount = handleSubmit((values) => {
    setNotice(null);
    otp.mutation.reset();
    registerMutation.mutate(values);
  });

  const changePhone = () => {
    otp.reset();
    registerMutation.reset();
    resetField('code');
    setNotice(null);
  };

  const errorCode = resolveAuthErrorCode(registerMutation.error ?? otp.mutation.error);

  return (
    <form onSubmit={isVerifying ? createAccount : requestCode} noValidate className="grid gap-5">
      <StepBar step={isVerifying ? 2 : 1} total={2} />
      <AuthHeading
        title={isVerifying ? t('register.codeTitle') : t('register.title')}
        intro={isVerifying ? sentLine : t('register.intro')}
      />
      <RegisterDetailsFields
        register={register}
        errors={errors}
        isLocked={isVerifying}
        fieldError={fieldError}
      />
      {otp.sent ? (
        <SignupCodeStep
          sent={otp.sent}
          code={code}
          codeField={register('code')}
          codeError={fieldError(errors.code?.message)}
          notice={notice}
          isResending={otp.mutation.isPending}
          onResend={() => otp.sent && sendCode(otp.sent.phone, true)}
        />
      ) : null}
      {errorCode ? (
        <FormAlert>
          {tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </FormAlert>
      ) : null}
      <Button
        type="submit"
        isFullWidth
        isLoading={isVerifying ? registerMutation.isPending : otp.mutation.isPending}
      >
        {isVerifying ? null : <Icon name="telegram" size={20} />}
        {isVerifying ? t('register.submit') : t('register.sendCode')}
      </Button>
      {otp.sent ? (
        <CodeStepActions
          telegramDeepLink={otp.sent.result.telegramDeepLink}
          onChangePhone={changePhone}
        />
      ) : (
        <TermsNotice />
      )}
    </form>
  );
}
