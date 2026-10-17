'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input, PasswordInput } from '@shared/components/ui';
import type { RegisterValues } from '../types/auth.types';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { PhoneField } from './fields/PhoneField';

/**
 * Step one of sign-up. While the code step is shown these stay mounted (hidden and read-only), so
 * the account is created for the phone the code went to and nothing typed is lost.
 */
export function RegisterDetailsFields({
  register,
  errors,
  isLocked,
  fieldError,
}: {
  register: UseFormRegister<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
  isLocked: boolean;
  fieldError: (key?: string) => string | undefined;
}) {
  const { t } = useAuthTranslation();
  return (
    <div hidden={isLocked} className="grid gap-5">
      <Input
        label={t('fields.fullName')}
        type="text"
        autoComplete="name"
        readOnly={isLocked}
        error={fieldError(errors.fullName?.message)}
        {...register('fullName')}
      />
      <PhoneField
        label={t('fields.phone')}
        placeholder={t('fields.phonePlaceholder')}
        readOnly={isLocked}
        error={fieldError(errors.phone?.message)}
        {...register('phone')}
      />
      <PasswordInput
        label={t('fields.password')}
        autoComplete="new-password"
        placeholder={t('fields.passwordPlaceholder')}
        hint={t('register.passwordHint')}
        readOnly={isLocked}
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
    </div>
  );
}
