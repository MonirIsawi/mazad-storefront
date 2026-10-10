'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { biddingApi } from '../api/bidding.api';
import type { MyStanding } from '../types/bidding.types';

/**
 * The signed-in user's standing on one auction (GET /auctions/:id/me): whether they lead (an
 * auto-bid included), their highest bid, and their auto-bid with whether it is exhausted. Every
 * own bidding action invalidates it; null for a guest.
 */
export function useMyStanding(auctionId: string): MyStanding | null {
  const isAuthenticated = useIsAuthenticated();
  const query = useQuery({
    queryKey: QUERY_KEYS.bidding.myStanding(auctionId),
    queryFn: () => biddingApi.getMyStanding(auctionId),
    enabled: isAuthenticated && !!auctionId,
  });
  return isAuthenticated ? (query.data ?? null) : null;
}
