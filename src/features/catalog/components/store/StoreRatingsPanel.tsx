'use client';

import { EmptyState, ErrorState } from '@shared/components/feedback';
import { Button } from '@shared/components/ui';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { useStoreReviews } from '../../hooks/useStoreReviews';
import { RatingsSummaryCard } from './RatingsSummaryCard';
import { ReviewCard } from './ReviewCard';

/** The fourth tab: the summary beside (desktop) or above (phones) the reviews, newest first. */
export function StoreRatingsPanel({ query }: { query: ReturnType<typeof useStoreReviews> }) {
  const { t } = useCatalogTranslation();

  if (!query.summary) {
    return query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null;
  }
  if (query.summary.count === 0) {
    return (
      <EmptyState
        icon="star"
        title={t('store.ratings.emptyTitle')}
        titleAs="h3"
        message={t('store.ratings.emptyMessage')}
      />
    );
  }

  return (
    <div className="grid items-start gap-3.5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <RatingsSummaryCard summary={query.summary} />
      <div className="grid gap-3.5">
        {query.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
        {query.hasNextPage ? (
          <Button
            variant="soft"
            isFullWidth
            isLoading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('store.ratings.showMore')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
