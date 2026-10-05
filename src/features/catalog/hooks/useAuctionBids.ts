'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { liveRefetchInterval, useAuctionLiveUpdates } from '@shared/realtime';
import { catalogApi } from '../api/catalog.api';

// `isLive` comes from the caller (bid history itself carries no auction status) — polling only
// makes sense while the auction can still receive new bids. Socket events refetch immediately.
export function useAuctionBids(id: string, isLive: boolean) {
  const queryKey = QUERY_KEYS.catalog.auctionBids(id);
  const realtime = useAuctionLiveUpdates(id, queryKey);
  return useQuery({
    queryKey,
    queryFn: () => catalogApi.getAuctionBids(id),
    enabled: !!id,
    refetchInterval: isLive ? liveRefetchInterval(realtime) : false,
  });
}
