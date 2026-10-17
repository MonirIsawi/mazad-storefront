'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { AuctionGrid, AuctionGridSkeleton } from '@shared/components/cards';
import { SearchField } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useCategories } from '../hooks/useCategories';
import { useAuctions } from '../hooks/useAuctions';
import { useBrowseFilters } from '../hooks/useBrowseFilters';
import { countSheetFilters, toListParams } from '../lib/browse-filters';
import { findCategory } from '../lib/category-list';
import { ActiveFilterChips } from '../components/browse/ActiveFilterChips';
import { BrowseEmpty } from '../components/browse/BrowseEmpty';
import { FilterPanel } from '../components/browse/FilterPanel';
import { FilterSheet } from '../components/browse/FilterSheet';
import { SortSelect } from '../components/browse/SortSelect';
import { StatusSegments } from '../components/browse/StatusSegments';

/**
 * Browse and search (design `browse`): one screen for search, status, categories and filters,
 * every one of them in the URL. Phones: search with the filter button, the status as a segmented
 * control, applied filters as removable chips, the filter sheet. Desktop: a persistent filter
 * column beside the results and the sort at the end of the title row.
 */
export function AuctionsBrowsePage() {
  const { t, isReady } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const { number } = useMoney();
  const { filters, update, clear, isSheetOpen, setSheetOpen } = useBrowseFilters();
  // The search box holds a draft: keystrokes shouldn't each become a request; it commits on submit.
  const [draftQuery, setDraftQuery] = useState(filters.q ?? '');
  const categories = useCategories();
  const auctions = useAuctions(toListParams(filters, 24));

  if (!isReady) return <PageLoader />;

  const categoryList = categories.data ?? [];
  const category = findCategory(categoryList, filters.categoryId);
  const hasFilters = Object.keys(filters).some((key) => key !== 'sort');
  const total = auctions.data?.meta.total ?? 0;
  const title =
    category?.name ?? (filters.q ? t('browse.resultsFor', { q: filters.q }) : t('browse.title'));
  const sort = <SortSelect value={filters.sort} onChange={(next) => update({ sort: next })} />;

  return (
    <>
      <ScreenHeader
        title={title}
        isRoot
        // No count line at zero: the empty state already says there's nothing.
        subtitle={
          total > 0
            ? t('browse.results', { count: total, formattedCount: number(total) })
            : undefined
        }
        crumbs={[
          { label: t('crumbs.home'), href: ROUTES.home },
          ...(category || filters.q ? [{ label: t('crumbs.browse'), href: ROUTES.auctions }] : []),
        ]}
        desktopTrailing={sort}
      />

      <PageContainer className="pb-8 lg:pb-16">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside aria-label={t('filters.title')} className="hidden lg:block">
            <FilterPanel
              value={filters}
              onChange={(next) => update(next)}
              categories={categoryList}
            />
          </aside>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
            <form
              role="search"
              className="lg:hidden"
              onSubmit={(event) => {
                event.preventDefault();
                update({ q: draftQuery.trim() || undefined });
              }}
            >
              <SearchField
                value={draftQuery}
                onChange={setDraftQuery}
                label={tCommon('search.label')}
                placeholder={t('browse.searchPlaceholder')}
                clearLabel={tCommon('search.clear')}
                onFilter={() => setSheetOpen(true)}
                // The count on the button is part of its name (what you see is what is read).
                filterLabel={
                  countSheetFilters(filters) > 0
                    ? t('filters.titleCount', { count: countSheetFilters(filters) })
                    : t('filters.title')
                }
                filterCount={countSheetFilters(filters)}
              />
            </form>
            <StatusSegments value={filters.status} onChange={(status) => update({ status })} />
            <ActiveFilterChips
              filters={filters}
              categories={categoryList}
              onRemove={(changes) => update(changes)}
              trailing={<span className="lg:hidden">{sort}</span>}
            />

            {auctions.isPending ? (
              <AuctionGridSkeleton count={6} columns={3} />
            ) : auctions.isError ? (
              <ErrorState onRetry={() => void auctions.refetch()} />
            ) : auctions.data.data.length === 0 ? (
              <BrowseEmpty
                filters={filters}
                hasFilters={hasFilters}
                onClear={() => {
                  setDraftQuery('');
                  clear();
                }}
              />
            ) : (
              <AuctionGrid auctions={auctions.data.data} columns={3} priorityCount={4} />
            )}
          </div>
        </div>
      </PageContainer>

      {isSheetOpen ? (
        <FilterSheet
          filters={filters}
          categories={categoryList}
          onApply={(next) => update(next, { closeSheet: true })}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}
