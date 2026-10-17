'use client';

import { useState } from 'react';
import { ErrorState, EmptyState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { AuctionGrid, AuctionGridSkeleton } from '@shared/components/cards';
import { Chip } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useMoney, useServerClock } from '@shared/hooks';
import { useWatchlist } from '../hooks/useWatchlist';
import { useWatchlistTranslation } from '../hooks/useWatchlistTranslation';
import type { WatchlistItem } from '../types/watchlist.types';

type WatchFilter = 'all' | 'endingToday' | 'upcoming';
const FILTERS: WatchFilter[] = ['all', 'endingToday', 'upcoming'];

function matches(item: WatchlistItem, filter: WatchFilter, now: number): boolean {
  if (filter === 'upcoming') return item.auction.status === 'SCHEDULED';
  if (filter === 'endingToday') {
    const end = new Date(item.auction.endsAt);
    return (
      item.auction.status === 'LIVE' &&
      end.getTime() > now &&
      end.toDateString() === new Date(now).toDateString()
    );
  }
  return true;
}

/**
 * The watchlist (design `watchlist`): saved lots in the same full-photo cards as browsing, hearts
 * filled (the same control removes them), ended lots dimmed rather than removed.
 */
export function WatchlistPage() {
  const { t, isReady } = useWatchlistTranslation();
  const { number } = useMoney();
  const { now } = useServerClock();
  const [filter, setFilter] = useState<WatchFilter>('all');
  const { data, isPending, isError, refetch } = useWatchlist();

  if (!isReady) return <PageLoader />;

  const total = data?.meta.total ?? data?.data.length ?? 0;
  const visible = (data?.data ?? []).filter((item) => matches(item, filter, now()));

  return (
    <>
      <ScreenHeader
        title={t('page.title')}
        isRoot
        subtitle={
          data && total > 0
            ? t('page.count', { count: total, formattedCount: number(total) })
            : undefined
        }
        crumbs={[{ label: t('page.account'), href: ROUTES.account }]}
      />
      <PageContainer className="grid gap-4 pb-8 lg:pb-16">
        {isPending ? (
          <AuctionGridSkeleton count={4} />
        ) : isError || !data ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data.data.length === 0 ? (
          <EmptyState icon="heart" title={t('page.emptyTitle')} message={t('page.empty')} />
        ) : (
          <>
            <div
              role="group"
              aria-label={t('page.filterLabel')}
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0"
            >
              {FILTERS.map((id) => (
                <Chip key={id} isActive={filter === id} onClick={() => setFilter(id)}>
                  {t(`page.filters.${id}`)}
                </Chip>
              ))}
            </div>
            {visible.length === 0 ? (
              <EmptyState icon="heart" message={t('page.filterEmpty')} className="py-8" />
            ) : (
              // The same card as everywhere else, so the heart that removes an item is the same
              // control that added it.
              <AuctionGrid auctions={visible.map((item) => item.auction)} priorityCount={2} />
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
