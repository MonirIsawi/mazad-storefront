import { ROUTES } from '@shared/constants';

/** The seller's own screens below the hub (the hub, list and stores routes are in ROUTES). */
export const SELLING_PATHS = {
  productNew: `${ROUTES.sellingProducts}/new`,
  productEdit: (id: string) => `${ROUTES.sellingProducts}/${encodeURIComponent(id)}`,
  auctionNew: (productId?: string) =>
    `${ROUTES.sellingAuctions}/new${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`,
  auctionRelist: (auctionId: string) =>
    `${ROUTES.sellingAuctions}/new?relist=${encodeURIComponent(auctionId)}`,
  auctionEdit: (id: string) => `${ROUTES.sellingAuctions}/${encodeURIComponent(id)}`,
} as const;
