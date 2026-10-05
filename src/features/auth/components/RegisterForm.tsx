'use client';

import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@shared/components/ui';
import { registerSchema } from '../schemas/auth.schema';
import type { RegisterValues } from '../types/auth.types';
import { useRegister } from '../hooks/useRegister';
import { useSignupOtp } from '../hooks/useSignupOtp';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { resolveAuthErrorCode } from '../lib/auth-errors';
import { SignupCodeStep } from './SignupCodeStep';

/** Checked before a code is requested; the code itself is only asked for afterwards. */
const DETAIL_FIELDS = ['fullName', 'phone', 'password'] as const;

/**
 * Two steps on one form: details → "send code" (POST /auth/otp/request, purpose SIGNUP), then
 * code → "create account" (POST /auth/register with the code). The details are locked while a
 * code is pending so the account is created for exactly the phone the code was sent to.
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
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', password: '', code: '' },
  });

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
    sendCode(getValues('phone').trim(), false);
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
    <form
      onSubmit={isVerifying ? createAccount : requestCode}
      noValidate
      className="flex flex-col gap-4"
    >
      <Input
        label={t('fields.fullName')}
        type="text"
        autoComplete="name"
        readOnly={isVerifying}
        error={fieldError(errors.fullName?.message)}
        {...register('fullName')}
      />
      <Input
        label={t('fields.phone')}
        type="tel"
        autoComplete="tel"
        placeholder={t('fields.phonePlaceholder')}
        readOnly={isVerifying}
        error={fieldError(errors.phone?.message)}
        {...register('phone')}
      />
      <Input
        label={t('fields.password')}
        type="password"
        autoComplete="new-password"
        readOnly={isVerifying}
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
      {otp.sent ? (
        <SignupCodeStep
          sent={otp.sent}
          codeField={register('code')}
          codeError={fieldError(errors.code?.message)}
          notice={notice}
          isResending={otp.mutation.isPending}
          onResend={() => otp.sent && sendCode(otp.sent.phone, true)}
          onChangePhone={changePhone}
        />
      ) : null}
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      <Button
        type="submit"
        isLoading={isVerifying ? registerMutation.isPending : otp.mutation.isPending}
      >
        {isVerifying ? t('register.submit') : t('register.sendCode')}
      </Button>
    </form>
  );
}
