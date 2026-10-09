'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, PasswordInput } from '@shared/components/ui';
import { deleteAccountSchema } from '../schemas/auth.schema';
import { resolveDeletionFailure } from '../lib/account-deletion';
import type { DeleteAccountValues } from '../types/auth.types';
import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { useLogout } from '../hooks/useLogout';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { DeletionBlockedList } from './DeletionBlockedList';

/** Only facts the API enforces — see the consequences keys in i18n. */
const CONSEQUENCES = ['permanent', 'removed', 'kept', 'signedOut', 'phone'] as const;

export function DeleteAccountForm({ onCancel }: { onCancel: () => void }) {
  const { t } = useAuthTranslation();
  const { t: tCommon } = useTranslation('common');
  const deletion = useDeleteAccount();
  const logout = useLogout();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '', isConfirmed: false },
  });
  const isConfirmed = useWatch({ control, name: 'isConfirmed' });

  const failure = deletion.error ? resolveDeletionFailure(deletion.error) : null;

  const onSubmit = handleSubmit(({ password }) => {
    deletion.mutate(password || undefined, {
      onError: (error) => {
        const result = resolveDeletionFailure(error);
        if (result.type !== 'password') return;
        const message = `deleteAccount.errors.${result.code}`;
        setError('password', { message }, { shouldFocus: true });
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <ul className="flex list-disc flex-col gap-1.5 ps-5 text-footnote text-foreground-soft">
        {CONSEQUENCES.map((key) => (
          <li key={key}>{t(`deleteAccount.consequences.${key}`)}</li>
        ))}
      </ul>

      <PasswordInput
        label={t('fields.password')}
        autoComplete="current-password"
        hint={t('deleteAccount.passwordHint')}
        error={errors.password ? t(errors.password.message ?? '') : undefined}
        {...register('password')}
      />

      <label className="flex items-center gap-2 text-sm text-foreground-soft">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          {...register('isConfirmed')}
        />
        {t('deleteAccount.confirmLabel')}
      </label>

      {failure?.type === 'blocked' ? <DeletionBlockedList reasons={failure.reasons} /> : null}
      {failure?.type === 'reauth' ? (
        <div role="alert" className="flex flex-col gap-2 text-footnote">
          <p className="text-destructive">{t('deleteAccount.errors.REAUTH_REQUIRED')}</p>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {t('deleteAccount.reauthAction')}
          </Button>
        </div>
      ) : null}
      {failure?.type === 'message' ? (
        <p role="alert" className="text-sm text-destructive">
          {failure.namespace === 'common' ? tCommon(failure.key) : t(failure.key)}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="destructive"
          className="flex-1"
          disabled={!isConfirmed}
          isLoading={deletion.isPending}
        >
          {t('deleteAccount.confirm')}
        </Button>
        <Button variant="gray" disabled={deletion.isPending} onClick={onCancel}>
          {t('deleteAccount.cancel')}
        </Button>
      </div>
    </form>
  );
}
