'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { ErrorState } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { SearchField } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { FeedSection } from '../components/FeedSection';
import { PromoPanel } from '../components/PromoPanel';

export interface HomePageProps {
  /** Composed in by the route — the categories query belongs to the catalog feature. */
  categoryRail?: ReactNode;
  /** Unread badge for the bell, supplied by the route from the notifications feature. */
  unreadNotificationCount?: number;
}

export function HomePage({ categoryRail, unreadNotificationCount = 0 }: HomePageProps) {
  const { t, isReady } = useHomeTranslation();
  const { t: tCommon } = useTranslation('common');
  const { number } = useMoney();
  const router = useRouter();
  const feed = useHomeFeed();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) router.push(`${ROUTES.auctions}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <ScreenHeader
        title={isReady ? t('title') : tCommon('app.name')}
        isRoot
        hasLogo
        actions={[
          {
            name: 'bell',
            label: tCommon('nav.notifications'),
            href: ROUTES.notifications,
            badge: unreadNotificationCount > 0 ? number(unreadNotificationCount) : undefined,
          },
        ]}
      />

      <div className="flex flex-col gap-5 px-gutter pb-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <SearchField
            value={query}
            onChange={setQuery}
            label={tCommon('search.label')}
            placeholder={tCommon('search.placeholder')}
            clearLabel={tCommon('search.clear')}
          />
        </form>

        {isReady ? (
          <PromoPanel
            title={t('promo.title')}
            subtitle={t('promo.subtitle')}
            ctaLabel={t('promo.cta')}
            ctaHref={ROUTES.auctions}
          />
        ) : null}

        {categoryRail}

        {feed.isError ? (
          <ErrorState onRetry={() => void feed.refetch()} />
        ) : (
          <div className="flex flex-col gap-5">
            {/* Only while something ends soon: an empty "nothing ending" block pushed the live
                auctions below the fold (as on mobile). */}
            {feed.isPending || (feed.data?.endingSoon.length ?? 0) > 0 ? (
              <FeedSection
                title={t('sections.endingSoon')}
                auctions={feed.data?.endingSoon ?? []}
                emptyMessage={t('empty.endingSoon')}
                actionLabel={t('viewAll')}
                actionHref={`${ROUTES.auctions}?status=live&endingSoon=true`}
                isLoading={feed.isPending}
              />
            ) : null}
            <FeedSection
              title={t('sections.live')}
              auctions={feed.data?.live ?? []}
              emptyMessage={t('empty.live')}
              actionLabel={t('viewAll')}
              actionHref={`${ROUTES.auctions}?status=live`}
              isLoading={feed.isPending}
            />
            <FeedSection
              title={t('sections.upcoming')}
              auctions={feed.data?.upcoming ?? []}
              emptyMessage={t('empty.upcoming')}
              actionLabel={t('viewAll')}
              actionHref={`${ROUTES.auctions}?status=upcoming`}
              isLoading={feed.isPending}
            />
          </div>
        )}
      </div>
    </>
  );
}
