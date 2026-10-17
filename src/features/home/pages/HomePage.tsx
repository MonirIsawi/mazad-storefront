'use client';

import type { ReactNode } from 'react';
import { ErrorState } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { useFirstRunWelcome } from '../hooks/useFirstRunWelcome';
import { endingBoard, pickFeatured } from '../lib/home-feed';
import { EndingBoard } from '../components/EndingBoard';
import { FeaturedLot } from '../components/FeaturedLot';
import { FinalHourRail, LiveNowSection, StartingSoonRail } from '../components/HomeFeedSections';
import { FeaturedLotSkeleton, FeedSkeleton, HeaderSkeleton } from '../components/HomeSkeleton';
import { HeroCopy } from '../components/HeroCopy';
import { HomeGreeting } from '../components/HomeGreeting';
import { HomeSearch } from '../components/HomeSearch';
import { HomeTopBar } from '../components/HomeTopBar';
import { HowItWorks } from '../components/HowItWorks';
import { PerksRow } from '../components/PerksRow';
import { StoresRail } from '../components/StoresRail';

/** The list without the featured lot, so it isn't shown twice. */
function without<T extends { id: string }>(list: T[], id: string | undefined): T[] {
  return list.filter((item) => item.id !== id);
}

export interface HomePageProps {
  /** Composed in by the route — the categories query belongs to the catalog feature. */
  categoryRail?: ReactNode;
  /** Unread badge for the bell, supplied by the route from the notifications feature. */
  unreadNotificationCount?: number;
  /** The signed-in user's full name (auth feature); undefined for a guest. */
  userName?: string;
  /** The heart on the featured lot (watchlist feature). */
  renderWatchToggle?: (auctionId: string) => ReactNode;
}

/**
 * Home: what is live and how long is left, before anything else. The featured lot is the one
 * persuasive moment; below it, rails and a grid to scan. The static chrome (bar, greeting, search,
 * categories, promises) renders at once and stays usable while the lots load.
 */
export function HomePage({
  categoryRail,
  unreadNotificationCount = 0,
  userName,
  renderWatchToggle,
}: HomePageProps) {
  useFirstRunWelcome();
  const { isReady } = useHomeTranslation();
  const feed = useHomeFeed();
  const featured = pickFeatured(feed.data);

  return (
    <>
      <HomeTopBar unreadCount={unreadNotificationCount} userName={userName} />
      <PageContainer className="grid grid-cols-[minmax(0,1fr)] gap-[22px] pt-1 pb-8 lg:gap-12 lg:pt-5 lg:pb-16">
        {isReady ? (
          <>
            <HomeGreeting userName={userName} />
            <HomeSearch />
          </>
        ) : (
          <HeaderSkeleton />
        )}
        {categoryRail}

        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-[22px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-11">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-20 -top-32 hidden size-[640px] bg-glow lg:block"
          />
          {isReady ? <HeroCopy /> : null}
          {feed.isPending || !isReady ? (
            <FeaturedLotSkeleton />
          ) : featured ? (
            <FeaturedLot auction={featured} watchToggle={renderWatchToggle?.(featured.id)} />
          ) : null}
        </div>
        {isReady ? <PerksRow className="lg:hidden" /> : null}

        {feed.isError ? (
          <ErrorState onRetry={() => void feed.refetch()} />
        ) : feed.isPending || !isReady ? (
          <FeedSkeleton />
        ) : (
          <>
            <EndingBoard board={endingBoard(feed.data, featured?.id)} />
            <FinalHourRail auctions={without(feed.data.endingSoon, featured?.id)} />
            <LiveNowSection
              auctions={without(feed.data.live, featured?.id)}
              hasFeatured={featured != null}
            />
            <StartingSoonRail auctions={feed.data.upcoming} />
          </>
        )}
        {isReady ? (
          <>
            <StoresRail />
            <HowItWorks />
          </>
        ) : null}
      </PageContainer>
    </>
  );
}
