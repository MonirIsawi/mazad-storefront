'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { Avatar, IconButton, buttonVariants } from '@shared/components/ui';
import { PreferenceToggles } from '@shared/components/layout';
import { useCurrentUser } from '@features/auth';
import { useUnreadNotificationCount } from '@features/notifications';

/**
 * The desktop header's end: the theme and language switches, then the bell with the unread count
 * and the account avatar when signed in, a sign-in button otherwise. Composed here in app/
 * because it reads two features.
 */
export function HeaderActions() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <>
      <PreferenceToggles />
      {isAuthenticated ? <SignedInActions /> : <SignInLink />}
    </>
  );
}

function SignedInActions() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const user = useCurrentUser();
  const unread = useUnreadNotificationCount().data ?? 0;
  const name = user.data?.fullName ?? '';

  return (
    <>
      <IconButton
        name="bell"
        label={t('nav.notifications')}
        badge={unread > 0 ? unread : undefined}
        onClick={() => router.push(ROUTES.notifications)}
      />
      <Link
        href={ROUTES.account}
        aria-label={t('nav.account')}
        className="rounded-full transition-transform duration-fast ease-ios active:scale-94"
      >
        <Avatar name={name || '·'} />
      </Link>
    </>
  );
}

function SignInLink() {
  const { t } = useTranslation('common');
  return (
    <Link href={ROUTES.login} className={buttonVariants({ variant: 'soft', size: 'sm' })}>
      {t('nav.signIn')}
    </Link>
  );
}
