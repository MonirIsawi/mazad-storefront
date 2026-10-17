'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { storeApi } from '../api/store.api';

/** A seller's live auctions across their stores (the rail on the seller page). */
export function useSellerLiveAuctions(sellerId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.catalog.auctions({ sellerId, status: 'live' }),
    queryFn: () => storeApi.listSellerLiveAuctions(sellerId),
    enabled: !!sellerId,
  });
}
