'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { BrandLockup } from '@shared/components/brand';
import { Avatar, IconButton } from '@shared/components/ui';

export interface HomeTopBarProps {
  unreadCount: number;
  /** The signed-in user's name for the avatar; undefined for a guest. */
  userName?: string;
}

/** The phone home bar (design `.mtop`): the lockup, the bell and the account avatar. */
export function HomeTopBar({ unreadCount, userName }: HomeTopBarProps) {
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();

  return (
    <div className="flex items-center gap-2.5 px-5 pt-1.5 pb-3.5 lg:hidden">
      <Link href={ROUTES.home} aria-label={tCommon('header.home')} className="rounded-md">
        <BrandLockup />
      </Link>
      <span className="min-w-0 flex-1" />
      <IconButton
        name="bell"
        label={tCommon('nav.notifications')}
        badge={unreadCount > 0 ? unreadCount : undefined}
        onClick={() => router.push(ROUTES.notifications)}
      />
      {userName != null ? (
        <Link
          href={ROUTES.account}
          aria-label={tCommon('nav.account')}
          className="rounded-full transition-transform duration-fast ease-ios active:scale-94"
        >
          <Avatar name={userName || '·'} />
        </Link>
      ) : (
        <IconButton
          name="user"
          label={tCommon('nav.signIn')}
          onClick={() => router.push(ROUTES.login)}
        />
      )}
    </div>
  );
}
