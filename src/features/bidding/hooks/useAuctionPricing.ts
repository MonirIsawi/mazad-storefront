'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { liveRefetchInterval, useAuctionLiveUpdates } from '@shared/realtime';
import { biddingApi } from '../api/bidding.api';

export function useAuctionPricing(auctionId: string) {
  const queryKey = QUERY_KEYS.bidding.auctionPricing(auctionId);
  // Socket events refetch the minimum bid at once; polling remains as reconciliation and only
  // while the auction is live (a closed auction's pricing won't change).
  const realtime = useAuctionLiveUpdates(auctionId, queryKey);
  return useQuery({
    queryKey,
    queryFn: () => biddingApi.getAuctionPricing(auctionId),
    enabled: !!auctionId,
    refetchInterval: (query) =>
      query.state.data?.status === 'LIVE' ? liveRefetchInterval(realtime) : false,
  });
}
