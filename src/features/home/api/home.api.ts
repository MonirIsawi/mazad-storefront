import { httpClient } from '@shared/api';
import { homeFeedSchema, publicStoreListSchema } from '../schemas/home.schema';
import type { HomeFeed, PublicStoreList } from '../types/home.types';

export const homeApi = {
  getFeed: async (): Promise<HomeFeed> => {
    const response = await httpClient.get<unknown>('/homepage');
    return homeFeedSchema.parse(response.data);
  },

  /** GET /stores: public stores, best rated and most active first (the Bidoom contract). */
  listStores: async (limit: number): Promise<PublicStoreList> => {
    const response = await httpClient.get<unknown>('/stores', { params: { limit } });
    return publicStoreListSchema.parse(response.data);
  },
};
