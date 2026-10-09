'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { ErrorState, EmptyState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { SearchField } from '@shared/components/ui';
import { AuctionGrid, AuctionGridSkeleton } from '@shared/components/cards';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useCategories } from '../hooks/useCategories';
import { useAuctions } from '../hooks/useAuctions';
import { CategoryChips } from '../components/CategoryChips';
import { StatusFilter } from '../components/StatusFilter';
import type { AuctionStatusFilter } from '../types/catalog.types';

const STATUS_VALUES: AuctionStatusFilter[] = ['live', 'upcoming', 'ended'];

function parseStatus(value: string | null): AuctionStatusFilter | undefined {
  return STATUS_VALUES.find((status) => status === value);
}

export function AuctionsBrowsePage() {
  const { t, isReady } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const { number } = useMoney();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL owns the filters rather than component state: the home feed's section links and
  // category tiles arrive here pre-filtered, back/forward behaves, and a filtered view is
  // shareable. Chips write to the URL and read straight back out of it.
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const status = parseStatus(searchParams.get('status'));
  const appliedQuery = searchParams.get('q') ?? '';

  // The search box is the one exception — keystrokes shouldn't each become a history entry, so
  // it holds its own draft and commits on submit.
  const [draftQuery, setDraftQuery] = useState(appliedQuery);

  const setFilter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.size ? `${ROUTES.auctions}?${next}` : ROUTES.auctions, { scroll: false });
  };

  const categories = useCategories();
  const auctions = useAuctions({
    categoryId,
    status,
    q: appliedQuery || undefined,
    limit: 24,
  });

  const hasFilters = Boolean(categoryId || status || appliedQuery);

  const clearFilters = () => {
    setDraftQuery('');
    router.replace(ROUTES.auctions, { scroll: false });
  };

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader title={t('browse.title')} isRoot />

      <div className="flex flex-col gap-3 px-gutter pb-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilter('q', draftQuery.trim() || undefined);
          }}
        >
          <SearchField
            value={draftQuery}
            onChange={setDraftQuery}
            label={tCommon('search.label')}
            placeholder={tCommon('search.placeholder')}
            clearLabel={tCommon('search.clear')}
          />
        </form>

        <StatusFilter selected={status} onSelect={(value) => setFilter('status', value)} />
        {categories.data ? (
          <CategoryChips
            categories={categories.data}
            selectedId={categoryId}
            onSelect={(value) => setFilter('categoryId', value)}
          />
        ) : null}

        {/* No count line at zero: the empty state below already says there's nothing. */}
        {auctions.data && auctions.data.meta.total > 0 ? (
          <p className="text-footnote text-muted-foreground">
            {t('browse.results', {
              count: auctions.data.meta.total,
              // i18next selects the plural form from `count`, but the digits the user reads have
              // to be Arabic-Indic — so the interpolated value is formatted separately.
              formattedCount: number(auctions.data.meta.total),
            })}
          </p>
        ) : null}

        {auctions.isPending ? (
          <AuctionGridSkeleton count={6} />
        ) : auctions.isError ? (
          <ErrorState onRetry={() => void auctions.refetch()} />
        ) : auctions.data.data.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('browse.emptyTitle')}
            message={t('browse.empty')}
            actionLabel={hasFilters ? t('browse.clearFilters') : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          <AuctionGrid auctions={auctions.data.data} />
        )}
      </div>
    </>
  );
}
