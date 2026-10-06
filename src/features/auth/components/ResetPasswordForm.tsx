'use client';

import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@shared/components/ui';
import { resetPasswordSchema } from '../schemas/auth.schema';
import type { ResetPasswordValues } from '../types/auth.types';
import { useSignupOtp } from '../hooks/useSignupOtp';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { resolveAuthErrorCode } from '../lib/auth-errors';
import { SignupCodeStep } from './SignupCodeStep';

/**
 * Password reset, one form in three steps (docs/api/authentication.md, "Password reset"):
 * phone → "send code" (POST /auth/otp/request, purpose PASSWORD_RESET), code → "verify"
 * (POST /auth/otp/verify → single-use reset token), new password → "save"
 * (POST /auth/password/reset, typed twice). The phone is locked once a code is pending, so the token is for
 * exactly the number the code went to.
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
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { phone: '', code: '', newPassword: '', confirmPassword: '' },
  });

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
      if (await trigger('phone')) sendCode(getValues('phone').trim(), false);
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={t('fields.phone')}
        type="tel"
        autoComplete="tel"
        placeholder={t('fields.phonePlaceholder')}
        readOnly={step !== 'phone'}
        error={fieldError(errors.phone?.message)}
        {...register('phone')}
      />
      {step === 'code' && otp.sent ? (
        <SignupCodeStep
          sent={otp.sent}
          codeField={register('code')}
          codeError={fieldError(errors.code?.message)}
          notice={notice}
          isResending={otp.mutation.isPending}
          onResend={() => otp.sent && sendCode(otp.sent.phone, true)}
          onChangePhone={startOver}
        />
      ) : null}
      {step === 'password' ? (
        <Input
          label={t('reset.newPassword')}
          type="password"
          autoComplete="new-password"
          autoFocus
          error={fieldError(errors.newPassword?.message)}
          {...register('newPassword')}
        />
      ) : null}
      {step === 'password' ? (
        <Input
          label={t('reset.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.confirmPassword?.message)}
          {...register('confirmPassword')}
        />
      ) : null}
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      {errorCode === 'RESET_TOKEN_INVALID' ? (
        <Button variant="plain" size="sm" onClick={startOver}>
          {t('reset.startOver')}
        </Button>
      ) : null}
      <Button type="submit" isLoading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
