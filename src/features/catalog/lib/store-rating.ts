import type { StoreFront, StoreReviewSummary } from '../types/store.types';

export interface ShownRating {
  average: number;
  count: number;
}

/**
 * The score under the store's name, from the best source the API offers: the store's own rating
 * (GET /stores/:id `rating`), else the ratings summary, else the seller's rating that older APIs
 * send. Nothing before the first rating.
 */
export function pickStoreRating(
  store: Pick<StoreFront, 'rating' | 'sellerRating'>,
  summary: StoreReviewSummary | undefined,
): ShownRating | null {
  const own = store.rating ?? (summary ? { avg: summary.avg, count: summary.count } : undefined);
  if (own) return own.count > 0 && own.avg != null ? { average: own.avg, count: own.count } : null;
  const seller = store.sellerRating;
  return seller && seller.count > 0 && seller.average != null
    ? { average: seller.average, count: seller.count }
    : null;
}
