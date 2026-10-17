'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { catalogApi } from '../api/catalog.api';
import { toListParams, type BrowseFilters } from '../lib/browse-filters';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * How many auctions a set of filters would show, before they are applied: the list's own
 * `meta.total` for a one-item page, asked once the filters have settled for a moment.
 */
export function useResultCount(filters: BrowseFilters, isEnabled: boolean) {
  const settled = useDebouncedValue(filters, 300);
  const params = toListParams(settled, 1);
  const query = useQuery({
    queryKey: QUERY_KEYS.catalog.auctions(params),
    queryFn: () => catalogApi.listAuctions(params),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const isSettling = settled !== filters || query.isFetching;
  return { total: query.data?.meta.total, isSettling };
}
