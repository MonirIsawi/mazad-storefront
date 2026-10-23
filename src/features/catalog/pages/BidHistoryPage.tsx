'use client';

import { ROUTES } from '@shared/constants';
import { ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Card } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { cn, pickLocalizedName } from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useAuction } from '../hooks/useAuction';
import { useAuctionBids } from '../hooks/useAuctionBids';
import { BidHistoryRows } from '../components/auction/BidHistoryRows';

/**
 * The full bid history of one auction (design `history`): how many bids, bidders and late-bid
 * extensions, then every bid, yours in gold. Bidders are named as the API names them (masked);
 * the API does not record when each extension happened, so the count stands in for inline events.
 */
export function BidHistoryPage({ id }: { id: string }) {
  const { t, isReady } = useCatalogTranslation();
  const { locale } = useLocale();
  const { number } = useMoney();
  const auction = useAuction(id);
  const bids = useAuctionBids(id, auction.data?.status === 'LIVE');

  if (!isReady || auction.isPending || bids.isPending) return <PageLoader />;
  if (auction.isError || bids.isError || !auction.data || !bids.data) {
    return <ErrorState message={t('detail.loadError')} onRetry={() => void bids.refetch()} />;
  }

  const data = auction.data;
  const bidders =
    data.bidderCount ??
    new Set(bids.data.map((bid) => bid.bidder.fullName ?? bid.bidder.maskedName)).size;
  const stats = [
    { key: 'bids', value: data.bidCount, label: t('history.statBids', { count: data.bidCount }) },
    { key: 'bidders', value: bidders, label: t('history.statBidders', { count: bidders }) },
    ...(data.extensionsCount != null
      ? [
          {
            key: 'extensions',
            value: data.extensionsCount,
            label: t('history.statExtensions', { count: data.extensionsCount }),
            isGold: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <ScreenHeader
        title={t('detail.bidHistory')}
        subtitle={pickLocalizedName(data.product, locale)}
        backHref={ROUTES.auctionDetail(id)}
        crumbs={[
          { label: pickLocalizedName(data.product, locale), href: ROUTES.auctionDetail(id) },
        ]}
      />
      <PageContainer className="grid max-w-[820px] gap-4 pb-12">
        <dl className="grid grid-cols-3 gap-2.5">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="grid gap-0.5 rounded-lg border border-border bg-surface p-3.5"
            >
              <dt className="order-2 text-xs text-muted-foreground">{stat.label}</dt>
              <dd
                className={cn(
                  'order-1 font-num text-[26px] font-light',
                  'isGold' in stat ? 'text-gold' : 'text-foreground',
                )}
              >
                {number(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
        <Card className="px-[18px] py-1.5">
          {bids.data.length === 0 ? (
            <p className="py-4 text-sm text-foreground-soft">{t('detail.noBids')}</p>
          ) : (
            <BidHistoryRows bids={bids.data} />
          )}
        </Card>
      </PageContainer>
    </>
  );
}
