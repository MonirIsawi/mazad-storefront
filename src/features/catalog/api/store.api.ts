import { httpClient } from '@shared/api';
import { auctionListSchema } from '../schemas/catalog.schema';
import { storeFrontSchema, storeReviewsSchema } from '../schemas/store.schema';
import type { AuctionList, AuctionStatusFilter } from '../types/catalog.types';
import type { StoreFront, StoreReviewsPage } from '../types/store.types';

export const STORE_AUCTIONS_PAGE_SIZE = 24;
export const STORE_REVIEWS_PAGE_SIZE = 10;

export const storeApi = {
  getStore: async (id: string): Promise<StoreFront> => {
    const response = await httpClient.get<unknown>(`/stores/${id}`);
    return storeFrontSchema.parse(response.data);
  },

  /** One status of the store's auctions, a page at a time (the store page's tabs). */
  listStoreAuctions: async (
    storeId: string,
    status: AuctionStatusFilter,
    page: number,
  ): Promise<AuctionList> => {
    const response = await httpClient.get<unknown>('/auctions', {
      params: { storeId, status, page, limit: STORE_AUCTIONS_PAGE_SIZE },
    });
    return auctionListSchema.parse(response.data);
  },

  /** A seller's live auctions across all of their stores (the seller page's rail). */
  listSellerLiveAuctions: async (sellerId: string): Promise<AuctionList> => {
    const response = await httpClient.get<unknown>('/auctions', {
      params: { sellerId, status: 'live', limit: 12 },
    });
    return auctionListSchema.parse(response.data);
  },

  /** 404 on an API without store ratings: callers treat that as "hide the ratings". */
  getStoreReviews: async (storeId: string, cursor?: string): Promise<StoreReviewsPage> => {
    const response = await httpClient.get<unknown>(`/stores/${storeId}/reviews`, {
      params: { limit: STORE_REVIEWS_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    });
    return storeReviewsSchema.parse(response.data);
  },
};
