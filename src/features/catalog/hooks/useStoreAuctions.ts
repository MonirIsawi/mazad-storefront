'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { storeApi } from '../api/store.api';
import type { AuctionStatusFilter } from '../types/catalog.types';

/** /stores/:id itself always returns an empty `auctions` placeholder, so the store page fetches
 *  the store's listings the same way the browse page fetches anyone's: filtered /auctions, one
 *  query per status tab (their totals are the tab counts). */
export function useStoreAuctions(storeId: string, status: AuctionStatusFilter) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.catalog.auctions({ storeId, status, paged: true }),
    queryFn: ({ pageParam }) => storeApi.listStoreAuctions(storeId, status, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : null),
    enabled: !!storeId,
  });
}
