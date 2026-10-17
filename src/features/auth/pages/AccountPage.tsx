'use client';

import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader, ErrorState } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ProfileCard } from '../components/account/ProfileCard';
import { AccountCounters } from '../components/account/AccountCounters';
import { AccountMenu } from '../components/account/AccountMenu';
import { AccountSignOut } from '../components/account/AccountSignOut';

/** Counts the API really gives, read by the route from the features that own them. */
export interface AccountCounts {
  openOrders?: number;
  unreadNotifications?: number;
  openSales?: number;
}

export interface AccountPageProps {
  counts?: AccountCounts;
  /** The desktop column beside the menus (the route passes the open orders panel). */
  aside?: ReactNode;
}

/**
 * Profile, three live counters that link to what needs you, then grouped menus. Delete account
 * sits alone, far below sign-out, and opens its own page.
 */
export function AccountPage({ counts = {}, aside }: AccountPageProps) {
  const { t, isReady } = useAuthTranslation();
  const { data: user, isPending, isError, refetch } = useCurrentUser();

  if (!isReady || isPending) return <PageLoader />;
  if (isError || !user) return <ErrorState onRetry={() => void refetch()} />;

  const counters = [
    {
      key: 'orders',
      href: ROUTES.orders,
      label: t('account.openOrders'),
      value: counts.openOrders,
    },
    {
      key: 'notifications',
      href: ROUTES.notifications,
      label: t('account.unread'),
      value: counts.unreadNotifications,
      isGold: true,
    },
    {
      key: 'sales',
      href: ROUTES.sellingSales,
      label: t('account.incoming'),
      value: counts.openSales,
    },
  ];

  return (
    <>
      <ScreenHeader title={t('account.title')} isRoot />
      <PageContainer className="pb-10">
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="grid gap-4">
            <ProfileCard user={user} />
            <AccountCounters counters={counters} />
            <AccountMenu unreadNotifications={counts.unreadNotifications} />
            <AccountSignOut />
          </div>
          {aside ? (
            <div className="hidden gap-[18px] lg:sticky lg:top-[100px] lg:grid">{aside}</div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
