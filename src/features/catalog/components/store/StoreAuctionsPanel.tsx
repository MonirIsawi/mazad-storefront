'use client';

import Link from 'next/link';
import { AuctionGrid, AuctionGridSkeleton } from '@shared/components/cards';
import { EmptyState, ErrorState } from '@shared/components/feedback';
import { Button, buttonVariants } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { useStoreAuctions } from '../../hooks/useStoreAuctions';
import type { AuctionStatusFilter } from '../../types/catalog.types';

const EMPTY = {
  live: { title: 'store.empty.liveTitle', message: 'store.empty.liveMessage', icon: 'live' },
  upcoming: {
    title: 'store.empty.upcomingTitle',
    message: 'store.empty.upcomingMessage',
    icon: 'calendar',
  },
  ended: { title: 'store.empty.endedTitle', message: 'store.empty.endedMessage', icon: 'gavel' },
} as const;

/** One status tab of the store's auctions: the lot grid, a page at a time. */
export function StoreAuctionsPanel({
  status,
  query,
}: {
  status: AuctionStatusFilter;
  query: ReturnType<typeof useStoreAuctions>;
}) {
  const { t } = useCatalogTranslation();

  if (query.isPending) return <AuctionGridSkeleton count={4} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const auctions = query.data.pages.flatMap((page) => page.data);
  if (auctions.length === 0) {
    const empty = EMPTY[status];
    return (
      <EmptyState
        icon={empty.icon}
        title={t(empty.title)}
        titleAs="h3"
        message={t(empty.message)}
        action={
          status === 'live' ? (
            <Link
              href={`${ROUTES.auctions}?status=live`}
              className={buttonVariants({ variant: 'line', size: 'sm' })}
            >
              {t('detail.browseAuctions')}
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      <AuctionGrid auctions={auctions} priorityCount={2} />
      {query.hasNextPage ? (
        <Button
          variant="soft"
          isFullWidth
          isLoading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('store.showMore')}
        </Button>
      ) : null}
    </div>
  );
}
