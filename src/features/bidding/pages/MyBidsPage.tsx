'use client';

import { useState } from 'react';
import { ErrorState, EmptyState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Skeleton } from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ios';
import { ROUTES } from '@shared/constants';
import { useMoney } from '@shared/hooks';
import { useMyBids } from '../hooks/useMyBids';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { MyBidRow } from '../components/MyBidRow';
import type { BidStanding, MyBidItem } from '../types/bidding.types';

// The three segments a buyer thinks in: what I'm still in, what I won, what's over. The API's
// five standings (all shown as chips on the rows) collapse onto them.
type BidSegment = 'active' | 'won' | 'ended';

const SEGMENT_STANDINGS: Record<BidSegment, BidStanding[]> = {
  active: ['WINNING', 'OUTBID'],
  won: ['AWAITING_CONFIRMATION', 'WON'],
  ended: ['LOST'],
};

/** Under the active bids: the latest finished ones, so a result is seen without switching. */
const RECENTLY_ENDED = 3;

const byLatestEnd = (a: MyBidItem, b: MyBidItem) =>
  new Date(b.auction.endsAt).getTime() - new Date(a.auction.endsAt).getTime();

/** My bids (design `bids`): every row answers "am I winning" and "how long is left". */
export function MyBidsPage() {
  const { t, isReady } = useBiddingTranslation();
  const { number } = useMoney();
  const [segment, setSegment] = useState<BidSegment>('active');
  const { data, isPending, isError, refetch } = useMyBids({ limit: 50 });

  if (!isReady) return <PageLoader />;

  const items = data?.data ?? [];
  const inSegment = (id: BidSegment) =>
    items.filter((item) => SEGMENT_STANDINGS[id].includes(item.standing));
  const visible = inSegment(segment);
  const recent =
    segment === 'active'
      ? items
          .filter((item) => !SEGMENT_STANDINGS.active.includes(item.standing))
          .sort(byLatestEnd)
          .slice(0, RECENTLY_ENDED)
      : [];
  const count = (id: BidSegment) => (data ? number(inSegment(id).length) : undefined);

  return (
    <>
      <ScreenHeader
        title={t('myBids.title')}
        isRoot
        crumbs={[{ label: t('myBids.account'), href: ROUTES.account }]}
      />
      <PageContainer className="grid gap-4 pb-8 lg:pb-16">
        <SegmentedControl
          label={t('myBids.title')}
          value={segment}
          onChange={setSegment}
          className="max-w-[520px]"
          segments={[
            { id: 'active', label: t('myBids.segments.active'), count: count('active') },
            { id: 'won', label: t('myBids.segments.won'), count: count('won') },
            { id: 'ended', label: t('myBids.segments.ended'), count: count('ended') },
          ]}
        />

        {isPending ? (
          <div aria-hidden className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} radius="xl" className="h-[98px] w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : visible.length === 0 && recent.length === 0 ? (
          <EmptyState icon="paddle" title={t('myBids.emptyTitle')} message={t('myBids.empty')} />
        ) : (
          <>
            {visible.length > 0 ? <BidList items={visible} /> : null}
            {recent.length > 0 ? (
              <section className="grid gap-3">
                <h2 className="px-1 pt-2 text-[13px] font-medium text-foreground-soft">
                  {t('myBids.recentlyEnded')}
                </h2>
                <BidList items={recent} />
              </section>
            ) : null}
          </>
        )}
      </PageContainer>
    </>
  );
}

function BidList({ items }: { items: MyBidItem[] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <MyBidRow key={item.auctionId} item={item} />
      ))}
    </ul>
  );
}
