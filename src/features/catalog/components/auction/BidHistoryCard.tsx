'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Card, CardTitle, Skeleton } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { BidHistoryItem } from '../../types/catalog.types';
import { BidHistoryRows } from './BidHistoryRows';

/** Rows on the auction page; the rest are one tap away on the history screen. */
const SHOWN_BIDS = 5;

/**
 * The latest bids on the auction page (design `Bid history` card), with "See all (18)" opening the
 * full history. Before the auction opens it says who will appear here.
 */
export function BidHistoryCard({
  auctionId,
  bids,
  isUpcoming,
}: {
  auctionId: string;
  bids: BidHistoryItem[] | undefined;
  isUpcoming: boolean;
}) {
  const { t } = useCatalogTranslation();
  const { number } = useMoney();
  const count = bids?.length ?? 0;

  return (
    <Card data-testid="detail-bids">
      <div className="flex items-center justify-between gap-3 pe-[18px]">
        <CardTitle>{t('detail.bidHistory')}</CardTitle>
        {count > SHOWN_BIDS ? (
          <Link
            href={ROUTES.auctionBids(auctionId)}
            className="relative pt-[18px] text-sm font-medium text-gold after:absolute after:-inset-x-2 after:-inset-y-1 light:text-gold-lo"
          >
            {t('history.seeAll', { count: number(count) })}
          </Link>
        ) : null}
      </div>
      <div className="px-[18px] pt-1.5 pb-2">
        {!bids ? (
          <div aria-hidden className="grid gap-3 py-3">
            <Skeleton radius="full" className="h-4 w-2/3" />
            <Skeleton radius="full" className="h-4 w-1/2" />
          </div>
        ) : count === 0 ? (
          <p className="py-3 text-sm text-foreground-soft">
            {isUpcoming ? t('history.upcomingEmpty') : t('detail.noBids')}
          </p>
        ) : (
          <BidHistoryRows bids={bids.slice(0, SHOWN_BIDS)} />
        )}
      </div>
    </Card>
  );
}
