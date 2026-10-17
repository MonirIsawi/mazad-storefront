import type { SellerAuction, SellerProduct } from '../types/selling.types';

/**
 * Live auctions per store, from the seller's own lists: /me/auctions names the product, and the
 * product names its store. A store with none is absent (callers read 0).
 */
export function liveCountsByStore(
  products: readonly Pick<SellerProduct, 'id' | 'store'>[],
  auctions: readonly Pick<SellerAuction, 'status' | 'product'>[],
): Map<string, number> {
  const storeOf = new Map(products.map((product) => [product.id, product.store.id]));
  const counts = new Map<string, number>();
  for (const auction of auctions) {
    const storeId = auction.product ? storeOf.get(auction.product.id) : undefined;
    if (auction.status !== 'LIVE' || !storeId) continue;
    counts.set(storeId, (counts.get(storeId) ?? 0) + 1);
  }
  return counts;
}
