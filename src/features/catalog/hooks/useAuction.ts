'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { liveRefetchInterval, useAuctionLiveUpdates } from '@shared/realtime';
import { catalogApi } from '../api/catalog.api';

export function useAuction(id: string) {
  const queryKey = QUERY_KEYS.catalog.auction(id);
  // Socket events trigger refetches; polling stays as reconciliation (30 s with realtime, 5 s
  // without) and only while the auction can still change (LIVE).
  const realtime = useAuctionLiveUpdates(id, queryKey);
  return useQuery({
    queryKey,
    queryFn: () => catalogApi.getAuction(id),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'LIVE' ? liveRefetchInterval(realtime) : false,
  });
}
