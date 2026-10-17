'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { SegmentedControl, type Segment } from '@shared/components/ios';
import { ROUTES } from '@shared/constants';
import { useLocale, useMoney } from '@shared/hooks';
import { pickLocalizedName } from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useStore } from '../hooks/useStore';
import { useStoreAuctions } from '../hooks/useStoreAuctions';
import { useStoreReviews } from '../hooks/useStoreReviews';
import { pickStoreRating } from '../lib/store-rating';
import { StoreHero } from '../components/store/StoreHero';
import { StoreStats } from '../components/store/StoreStats';
import { StoreAuctionsPanel } from '../components/store/StoreAuctionsPanel';
import { StoreRatingsPanel } from '../components/store/StoreRatingsPanel';
import { StoreUnavailable } from '../components/store/StoreUnavailable';
import type { StoreTab } from '../types/store.types';

export interface StorePageProps {
  id: string;
  /** `?tab=ratings` from a seller's rating opens the ratings tab. */
  initialTab?: StoreTab;
  renderSellerFollowToggle?: (sellerId: string) => ReactNode;
}

/**
 * A store is a shopfront (Bidoom design `store`): its head, its numbers, then its auctions by
 * status in tabs, and its ratings as the fourth tab while the API has store ratings.
 */
export function StorePage({ id, initialTab, renderSellerFollowToggle }: StorePageProps) {
  const { t, isReady } = useCatalogTranslation();
  const { locale } = useLocale();
  const { number } = useMoney();
  const router = useRouter();
  const store = useStore(id);
  const reviews = useStoreReviews(id);
  const live = useStoreAuctions(id, 'live');
  const upcoming = useStoreAuctions(id, 'upcoming');
  const ended = useStoreAuctions(id, 'ended');
  const [tab, setTab] = useState<StoreTab>(initialTab ?? 'live');
  const tabsRef = useRef<HTMLDivElement>(null);

  if (!isReady || store.isPending) return <PageLoader />;
  if (store.isError || !store.data) {
    return (
      <PageContainer className="py-6">
        <StoreUnavailable error={store.error} onRetry={() => void store.refetch()} />
      </PageContainer>
    );
  }

  const data = store.data;
  const hasRatings = reviews.isAvailable === true;
  // A ratings link from an API that has no ratings lands on the live tab instead.
  const shown: StoreTab = tab === 'ratings' && reviews.isAvailable === false ? 'live' : tab;
  const queries = { live, upcoming, ended };
  const total = (key: keyof typeof queries) => queries[key].data?.pages[0]?.meta.total;
  const count = (value: number | undefined) => (value ? number(value) : undefined);

  const segments: Segment<StoreTab>[] = (['live', 'upcoming', 'ended'] as const).map((key) => ({
    id: key,
    label: t(`store.tabs.${key}`),
    count: count(total(key)),
  }));
  if (hasRatings) {
    segments.push({
      id: 'ratings',
      label: t('store.tabs.ratings'),
      count: count(reviews.summary?.count),
    });
  }

  const selectTab = (next: StoreTab) => {
    setTab(next);
    // Keeps the tab in the address, so a shared or reloaded link opens the same one.
    window.history.replaceState(
      null,
      '',
      next === 'live' ? window.location.pathname : `?tab=${next}`,
    );
  };
  const openRatings = () => {
    selectTab('ratings');
    tabsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));
  const rating = pickStoreRating(data, reviews.summary);

  return (
    <>
      <StoreHero
        store={data}
        name={pickLocalizedName(data, locale)}
        rating={rating}
        onOpenRatings={hasRatings && rating ? openRatings : undefined}
        followSlot={renderSellerFollowToggle?.(data.seller.id)}
        onBack={goBack}
      />

      <PageContainer className="grid gap-[18px] pt-[18px] pb-8">
        <StoreStats store={data} liveTotal={total('live')} />
        <div ref={tabsRef} className="scroll-mt-24">
          <SegmentedControl
            label={t('store.sections')}
            value={shown}
            onChange={selectTab}
            segments={segments}
            className="max-w-[620px]"
          />
        </div>
        <div role="tabpanel" aria-label={t(`store.tabs.${shown}`)}>
          {shown === 'ratings' ? (
            <StoreRatingsPanel query={reviews} />
          ) : (
            <StoreAuctionsPanel key={shown} status={shown} query={queries[shown]} />
          )}
        </div>
      </PageContainer>
    </>
  );
}
