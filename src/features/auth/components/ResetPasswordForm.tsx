'use client';

import { useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, PasswordInput } from '@shared/components/ui';
import { normalizePhone } from '@shared/lib';
import { resetPasswordSchema } from '../schemas/auth.schema';
import type { ResetPasswordValues } from '../types/auth.types';
import { useSignupOtp } from '../hooks/useSignupOtp';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { useCodeSentLine } from '../hooks/useCodeSentLine';
import { resolveAuthErrorCode } from '../lib/auth-errors';
import { withIraqiPrefix } from '../lib/phone-prefix';
import { AuthHeading } from './shell/AuthHeading';
import { StepBar } from './shell/StepBar';
import { PhoneField } from './fields/PhoneField';
import { FormAlert } from './fields/FormAlert';
import { SignupCodeStep } from './SignupCodeStep';
import { CodeStepActions } from './CodeStepActions';

const STEP_NUMBER = { phone: 1, code: 2, password: 3 } as const;

/**
 * Password reset, one form in three steps (docs/api/authentication.md, "Password reset"), each
 * named in words above the bar: phone → "send code" (POST /auth/otp/request, PASSWORD_RESET),
 * code → "verify" (POST /auth/otp/verify → single-use reset token), new password → "save"
 * (POST /auth/password/reset, typed twice). The phone stays mounted and locked once a code is
 * pending, so the token is for exactly the number the code went to.
 */
export function ResetPasswordForm() {
  const { t } = useAuthTranslation();
  const { t: tCommon } = useTranslation('common');
  const otp = useSignupOtp('PASSWORD_RESET');
  const { verify, save } = usePasswordReset();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    trigger,
    getValues,
    resetField,
    control,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { phone: '', code: '', newPassword: '', confirmPassword: '' },
  });
  const code = useWatch({ control, name: 'code' }) ?? '';
  const sentLine = useCodeSentLine(otp.sent);

  const step = resetToken ? 'password' : otp.sent ? 'code' : 'phone';
  const fieldError = (key?: string) => (key ? t(key) : undefined);

  const sendCode = (phone: string, isResend: boolean) => {
    setNotice(null);
    verify.reset();
    otp.request(phone, {
      onSuccess: () => {
        resetField('code');
        if (isResend) setNotice(t('register.newCodeSent'));
      },
    });
  };

  const startOver = () => {
    otp.reset();
    verify.reset();
    save.reset();
    setResetToken(null);
    resetField('code');
    resetField('newPassword');
    resetField('confirmPassword');
    setNotice(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 'phone') {
      if (await trigger('phone'))
        sendCode(normalizePhone(withIraqiPrefix(getValues('phone'))), false);
      return;
    }
    if (step === 'code') {
      if (!otp.sent || !(await trigger('code'))) return;
      setNotice(null);
      otp.mutation.reset();
      verify.mutate(
        { phone: otp.sent.phone, code: getValues('code').trim() },
        { onSuccess: (result) => setResetToken(result.resetToken) },
      );
      return;
    }
    if (!resetToken || !(await trigger(['newPassword', 'confirmPassword']))) return;
    save.mutate({ resetToken, newPassword: getValues('newPassword') });
  };

  const errorCode = resolveAuthErrorCode(save.error ?? verify.error ?? otp.mutation.error);
  const heading = {
    phone: { title: t('reset.title'), intro: t('reset.intro') },
    code: { title: t('reset.codeTitle'), intro: sentLine },
    password: { title: t('reset.passwordTitle'), intro: t('reset.passwordIntro') },
  }[step];
  const submitLabel = {
    phone: t('register.sendCode'),
    code: t('reset.verify'),
    password: t('reset.submit'),
  }[step];
  const isPending = {
    phone: otp.mutation.isPending,
    code: verify.isPending,
    password: save.isPending,
  }[step];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <StepBar step={STEP_NUMBER[step]} total={3} />
      <AuthHeading title={heading.title} intro={heading.intro} />
      <div hidden={step !== 'phone'}>
        <PhoneField
          label={t('fields.phone')}
          placeholder={t('fields.phonePlaceholder')}
          readOnly={step !== 'phone'}
          error={fieldError(errors.phone?.message)}
          {...register('phone')}
        />
      </div>
      {step === 'code' && otp.sent ? (
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
      {step === 'password' ? (
        <>
          <PasswordInput
            label={t('reset.newPassword')}
            autoComplete="new-password"
            autoFocus
            hint={t('register.passwordHint')}
            error={fieldError(errors.newPassword?.message)}
            {...register('newPassword')}
          />
          <PasswordInput
            label={t('reset.confirmPassword')}
            autoComplete="new-password"
            error={fieldError(errors.confirmPassword?.message)}
            {...register('confirmPassword')}
          />
        </>
      ) : null}
      {errorCode ? (
        <FormAlert>
          {tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </FormAlert>
      ) : null}
      {errorCode === 'RESET_TOKEN_INVALID' ? (
        <Button variant="soft" size="sm" className="justify-self-start" onClick={startOver}>
          {t('reset.startOver')}
        </Button>
      ) : null}
      <Button type="submit" isFullWidth isLoading={isPending}>
        {submitLabel}
      </Button>
      {step === 'code' && otp.sent ? (
        <CodeStepActions
          telegramDeepLink={otp.sent.result.telegramDeepLink}
          onChangePhone={startOver}
        />
      ) : null}
    </form>
  );
}
