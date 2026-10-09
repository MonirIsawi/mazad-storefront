'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, PasswordInput } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { getErrorCode } from '@shared/lib';
import { loginSchema } from '../schemas/auth.schema';
import type { LoginValues } from '../types/auth.types';
import { useLogin } from '../hooks/useLogin';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

export function LoginForm() {
  const { t } = useAuthTranslation();
  const { t: tCommon } = useTranslation('common');
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => login.mutate(values));
  const errorCode = getErrorCode(login.error);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={t('fields.phone')}
        type="tel"
        autoComplete="tel"
        placeholder={t('fields.phonePlaceholder')}
        error={errors.phone ? t(errors.phone.message ?? '') : undefined}
        {...register('phone')}
      />
      <PasswordInput
        label={t('fields.password')}
        autoComplete="current-password"
        error={errors.password ? t(errors.password.message ?? '') : undefined}
        {...register('password')}
      />
      <Link
        href={ROUTES.resetPassword}
        className="self-end text-sm font-medium text-accent hover:underline"
      >
        {t('reset.forgot')}
      </Link>
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      <Button type="submit" isLoading={login.isPending}>
        {t('login.submit')}
      </Button>
    </form>
  );
}
