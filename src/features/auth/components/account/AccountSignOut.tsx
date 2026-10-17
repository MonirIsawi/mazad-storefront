'use client';

import { Button, Icon, MenuRow } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';
import { useLogout } from '../../hooks/useLogout';

/** Sign out, then Delete account alone far below it: danger kept apart by space, not just colour. */
export function AccountSignOut() {
  const { t } = useAuthTranslation();
  const logout = useLogout();
  return (
    <>
      <Button
        variant="soft"
        isFullWidth
        className="mt-4"
        isLoading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {logout.isPending ? null : <Icon name="sign-out" size={20} className="ltr:-scale-x-100" />}
        {t('account.signOut')}
      </Button>
      <MenuRow
        href={ROUTES.deleteAccount}
        icon="trash"
        title={t('account.deleteRow')}
        subtitle={t('account.deleteRowHint')}
        isDanger
        className="mt-11"
      />
    </>
  );
}
