import type { z } from 'zod';
import type {
  auctionStatusSchema,
  productConditionSchema,
  auctionSchema,
  auctionListSchema,
  bidHistoryItemSchema,
  storePageSchema,
} from '../schemas/catalog.schema';

export type { CategoryNode } from '../schemas/catalog.schema';
export type AuctionStatus = z.infer<typeof auctionStatusSchema>;
export type ProductCondition = z.infer<typeof productConditionSchema>;
export type Auction = z.infer<typeof auctionSchema>;
export type AuctionList = z.infer<typeof auctionListSchema>;
export type BidHistoryItem = z.infer<typeof bidHistoryItemSchema>;
export type StorePage = z.infer<typeof storePageSchema>;

export type AuctionStatusFilter = 'live' | 'upcoming' | 'ended';

export interface AuctionListParams {
  status?: AuctionStatusFilter;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  storeId?: string;
  q?: string;
  endingSoon?: boolean;
  page?: number;
  limit?: number;
  /** endingSoon (the server's default browse order), newest, priceLow; the rest are legacy. */
  sort?: CatalogSort | 'endsAt' | 'startsAt' | 'currentPrice';
}

export type CatalogSort = 'endingSoon' | 'newest' | 'priceLow';
