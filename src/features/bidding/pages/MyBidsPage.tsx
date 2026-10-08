'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ErrorState, EmptyState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Card, Icon, Skeleton } from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ios';
import { ROUTES } from '@shared/constants';
import { useLocale, useMoney, useServerClock } from '@shared/hooks';
import { formatDuration, getImageTintStyle, pickLocalizedName, resolveAssetUrl } from '@shared/lib';
import { useMyBids } from '../hooks/useMyBids';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { BidStanding, MyBidItem } from '../types/bidding.types';

// The three segments a buyer actually thinks in: what I'm still in, what I won, what's over.
// The API's five standings collapse onto them.
type BidSegment = 'active' | 'won' | 'ended';

const SEGMENT_STANDINGS: Record<BidSegment, BidStanding[]> = {
  active: ['WINNING', 'OUTBID'],
  won: ['AWAITING_CONFIRMATION', 'WON'],
  ended: ['LOST'],
};

const STANDING_TONE: Record<BidStanding, 'live' | 'warning' | 'upcoming' | 'neutral'> = {
  WINNING: 'live',
  OUTBID: 'warning',
  AWAITING_CONFIRMATION: 'upcoming',
  WON: 'live',
  LOST: 'neutral',
};

export function MyBidsPage() {
  const { t, isReady } = useBiddingTranslation();
  const [segment, setSegment] = useState<BidSegment>('active');
  const { data, isPending, isError, refetch } = useMyBids({ limit: 50 });

  if (!isReady) return <PageLoader />;

  const visible = (data?.data ?? []).filter((item) =>
    SEGMENT_STANDINGS[segment].includes(item.standing),
  );

  return (
    <>
      <ScreenHeader title={t('myBids.title')} isRoot />

      <div className="flex flex-col gap-4 px-gutter pb-6">
        <SegmentedControl
          label={t('myBids.title')}
          value={segment}
          onChange={setSegment}
          segments={[
            { id: 'active', label: t('myBids.segments.active') },
            { id: 'won', label: t('myBids.segments.won') },
            { id: 'ended', label: t('myBids.segments.ended') },
          ]}
        />

        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} radius="lg" className="h-20 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState icon="gavel" title={t('myBids.emptyTitle')} message={t('myBids.empty')} />
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((item) => (
              <MyBidRow key={item.auctionId} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MyBidRow({ item }: { item: MyBidItem }) {
  const { t } = useBiddingTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const { now } = useServerClock();

  const name = pickLocalizedName(item.auction.product, locale);
  const coverImage = resolveAssetUrl(item.auction.product.coverImage);
  const endsInMs = new Date(item.auction.endsAt).getTime() - now();

  return (
    <Link href={ROUTES.auctionDetail(item.auctionId)}>
      <Card className="flex items-center gap-3 p-3 transition-transform duration-fast ease-ios active:scale-[0.985]">
        <div
          className="relative size-14 shrink-0 overflow-hidden rounded-sm"
          style={coverImage ? undefined : getImageTintStyle(item.auction.product.id)}
        >
          {coverImage ? (
            <Image src={coverImage} alt={name} fill sizes="56px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-foreground/22">
              <Icon name="package" size={22} />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-subhead font-semibold text-foreground">{name}</p>
          <p className="text-caption text-muted-foreground">
            {t('myBids.yourBid', { amount: money(item.myHighestBid) })}
          </p>
          <Badge
            tone={STANDING_TONE[item.standing]}
            hasDot={item.standing === 'WINNING'}
            className="self-start"
          >
            {t(`standing.${item.standing}`)}
          </Badge>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-callout font-bold text-foreground tabular-nums">
            {money(item.auction.currentPrice ?? item.auction.startingPrice)}
          </span>
          {item.auction.status === 'LIVE' && endsInMs > 0 ? (
            <span className="text-caption-2 text-muted-foreground tabular-nums">
              {formatDuration(endsInMs, locale)}
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
