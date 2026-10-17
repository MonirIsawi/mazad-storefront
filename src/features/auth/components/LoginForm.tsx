'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, PasswordInput } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { getErrorCode } from '@shared/lib';
import { loginSchema } from '../schemas/auth.schema';
import type { LoginValues } from '../types/auth.types';
import { useLogin } from '../hooks/useLogin';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { PhoneField } from './fields/PhoneField';
import { FormAlert } from './fields/FormAlert';

/**
 * Phone (with the fixed +964) and password. Errors sit under the field that caused them; a wrong
 * phone or password (the API doesn't say which) is shown under the password.
 */
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
  const apiMessage = errorCode
    ? tCommon(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })
    : null;
  const isCredentials = errorCode === 'INVALID_CREDENTIALS';

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <PhoneField
        label={t('fields.phone')}
        placeholder={t('fields.phonePlaceholder')}
        error={errors.phone ? t(errors.phone.message ?? '') : undefined}
        {...register('phone')}
      />
      <div className="grid gap-3">
        <PasswordInput
          label={t('fields.password')}
          autoComplete="current-password"
          error={
            errors.password
              ? t(errors.password.message ?? '')
              : isCredentials
                ? (apiMessage ?? undefined)
                : undefined
          }
          {...register('password')}
        />
        <Link
          href={ROUTES.resetPassword}
          className="justify-self-start text-sm font-semibold text-gold underline-offset-4 hover:underline light:text-gold-lo"
        >
          {t('reset.forgot')}
        </Link>
      </div>
      {apiMessage && !isCredentials ? <FormAlert>{apiMessage}</FormAlert> : null}
      <Button type="submit" isFullWidth isLoading={login.isPending}>
        {t('login.submit')}
      </Button>
    </form>
  );
}
