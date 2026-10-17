'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, PasswordInput } from '@shared/components/ui';
import { deleteAccountSchema } from '../schemas/auth.schema';
import { resolveDeletionFailure } from '../lib/account-deletion';
import type { DeleteAccountValues } from '../types/auth.types';
import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { useLogout } from '../hooks/useLogout';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { DeletionBlockedList } from './DeletionBlockedList';
import { FormAlert } from './fields/FormAlert';

/**
 * The confirmation: password (optional, the API decides), "I understand", then the destructive
 * button, outlined red and alone at the end with space before it.
 */
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
        setError(
          'password',
          { message: `deleteAccount.errors.${result.code}` },
          { shouldFocus: true },
        );
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3.5">
      <Card isInset className="grid gap-4">
        <h2 className="text-h3 font-medium text-foreground">{t('deleteAccount.confirmTitle')}</h2>
        <PasswordInput
          label={t('fields.password')}
          autoComplete="current-password"
          hint={t('deleteAccount.passwordHint')}
          error={errors.password ? t(errors.password.message ?? '') : undefined}
          {...register('password')}
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
          <input type="checkbox" className="peer sr-only" {...register('isConfirmed')} />
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong text-transparent peer-checked:border-transparent peer-checked:bg-grad peer-checked:text-gold-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
          >
            <Icon name="check" size={14} />
          </span>
          {t('deleteAccount.confirmLabel')}
        </label>
      </Card>

      {failure?.type === 'blocked' ? <DeletionBlockedList reasons={failure.reasons} /> : null}
      {failure?.type === 'reauth' ? (
        <div role="alert" className="grid gap-2.5 rounded-lg bg-destructive-soft p-4 text-sm">
          <p className="text-destructive">{t('deleteAccount.errors.REAUTH_REQUIRED')}</p>
          <Button
            variant="soft"
            size="sm"
            className="justify-self-start"
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {t('deleteAccount.reauthAction')}
          </Button>
        </div>
      ) : null}
      {failure?.type === 'message' ? (
        <FormAlert>
          {failure.namespace === 'common' ? tCommon(failure.key) : t(failure.key)}
        </FormAlert>
      ) : null}

      <Button variant="soft" isFullWidth disabled={deletion.isPending} onClick={onCancel}>
        {t('deleteAccount.cancel')}
      </Button>
      <Button
        type="submit"
        variant="dangerLine"
        isFullWidth
        className="mt-8"
        disabled={!isConfirmed}
        isLoading={deletion.isPending}
      >
        {t('deleteAccount.confirm')}
      </Button>
    </form>
  );
}
