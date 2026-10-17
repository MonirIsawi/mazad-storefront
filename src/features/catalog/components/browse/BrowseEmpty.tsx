'use client';

import { ROUTES } from '@shared/constants';
import { EmptyState } from '@shared/components/feedback';
import { AuctionCard, Rail } from '@shared/components/cards';
import { useAuctions } from '../../hooks/useAuctions';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { BrowseFilters } from '../../lib/browse-filters';

/**
 * No results (design `search-empty`): why there is nothing, and the fastest way out, which is
 * clearing the filters. Under it, live lots to carry on with. There is no saved-search alert:
 * the API has none.
 */
export function BrowseEmpty({
  filters,
  hasFilters,
  onClear,
}: {
  filters: BrowseFilters;
  hasFilters: boolean;
  onClear: () => void;
}) {
  const { t } = useCatalogTranslation();
  const message = filters.q
    ? t('empty.query', { q: filters.q })
    : hasFilters
      ? t('empty.filtered')
      : t('empty.none');

  return (
    <div className="grid gap-6">
      <EmptyState
        icon="search-minus"
        title={t('empty.title')}
        message={message}
        actionLabel={hasFilters ? t('browse.clearFilters') : undefined}
        onAction={hasFilters ? onClear : undefined}
      />
      {hasFilters ? <MightLike /> : null}
    </div>
  );
}

function MightLike() {
  const { t } = useCatalogTranslation();
  const live = useAuctions({ status: 'live', limit: 8 });
  const auctions = live.data?.data ?? [];
  if (auctions.length === 0) return null;
  return (
    <Rail
      title={t('empty.mightLike')}
      seeAll={{ href: `${ROUTES.auctions}?status=live`, label: t('empty.seeAll') }}
    >
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </Rail>
  );
}
