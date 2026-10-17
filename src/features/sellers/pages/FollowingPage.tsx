'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader, ErrorState, EmptyState } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { buttonVariants } from '@shared/components/ui';
import { useFollowing } from '../hooks/useFollowing';
import { useSellersTranslation } from '../hooks/useSellersTranslation';
import { FollowingListRow } from '../components/FollowingListRow';
import type { FollowingItem } from '../types/sellers.types';

/**
 * Sellers you follow (design `following`). Unfollow is a toggle in place: an unfollowed seller
 * stays in the list with "Follow" until the page is left, so the change is reversible.
 */
export function FollowingPage() {
  const { t, isReady } = useSellersTranslation();
  const { data, isPending, isError, refetch } = useFollowing();
  const [unfollowed, setUnfollowed] = useState<Record<string, FollowingItem>>({});

  if (!isReady || isPending) return <PageLoader />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const followedIds = new Set(data.data.map((item) => item.sellerId));
  const kept = Object.values(unfollowed).filter((item) => !followedIds.has(item.sellerId));
  const rows = [...data.data, ...kept].sort((a, b) => b.followedAt.localeCompare(a.followedAt));

  return (
    <>
      <ScreenHeader
        title={t('followingPage.title')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('followingList.account'), href: ROUTES.account }]}
      />
      <PageContainer className="grid max-w-[820px] gap-2 pb-12 lg:gap-2.5">
        {rows.length === 0 ? (
          <EmptyState
            icon="users"
            title={t('followingPage.empty')}
            message={t('followingList.empty')}
            action={
              <Link href={ROUTES.auctions} className={buttonVariants({ variant: 'gold' })}>
                {t('followingList.browse')}
              </Link>
            }
          />
        ) : (
          rows.map((item) => (
            <FollowingListRow
              key={item.sellerId}
              item={item}
              isFollowing={followedIds.has(item.sellerId)}
              onUnfollowed={() =>
                setUnfollowed((current) => ({ ...current, [item.sellerId]: item }))
              }
            />
          ))
        )}
      </PageContainer>
    </>
  );
}
