import type { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { toMinorUnits } from '@shared/lib';
import type { BidResponse } from '../types/bidding.types';

type PostBidAuction = BidResponse['auction'];

/** The fields both cached copies of an auction share (catalog detail also has bidCount). */
type CachedAuction = {
  currentPrice: string | null;
  endsAt: string;
  status: string;
  bidCount?: number;
};

/** True when the cache already holds a later state than the bid response (a newer refetch won). */
function isAhead(cached: CachedAuction, result: PostBidAuction): boolean {
  if (cached.bidCount != null && cached.bidCount > result.bidCount) return true;
  const cachedPrice = toMinorUnits(cached.currentPrice);
  const resultPrice = toMinorUnits(result.currentPrice);
  return cachedPrice != null && resultPrice != null && cachedPrice > resultPrice;
}

function merge<T extends CachedAuction>(
  cached: T | undefined,
  result: PostBidAuction,
): T | undefined {
  if (!cached || isAhead(cached, result)) return cached;
  return {
    ...cached,
    currentPrice: result.currentPrice,
    endsAt: result.endsAt,
    status: result.status,
    ...(cached.bidCount != null ? { bidCount: result.bidCount } : {}),
  };
}

/**
 * After the user's own bid (or buy now / an auto-bid that bid), show the server's post-bid state
 * at once instead of after the refetch: the response's `auction.*` is mazad-api's committed state
 * after any auto-bid counters ran (bidding.schema.ts). The refetch that follows still reconciles,
 * and a cache that a newer refetch already moved past is left alone, so the price never steps
 * back.
 */
export function applyBidResult(
  queryClient: QueryClient,
  auctionId: string,
  result: PostBidAuction,
) {
  queryClient.setQueryData<CachedAuction>(QUERY_KEYS.bidding.auctionPricing(auctionId), (cached) =>
    merge(cached, result),
  );
  queryClient.setQueryData<CachedAuction>(QUERY_KEYS.catalog.auction(auctionId), (cached) =>
    merge(cached, result),
  );
}
