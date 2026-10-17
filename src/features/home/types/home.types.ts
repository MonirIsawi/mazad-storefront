import type { z } from 'zod';
import type {
  homeFeedSchema,
  publicStoreListSchema,
  publicStoreSchema,
} from '../schemas/home.schema';

export type HomeFeed = z.infer<typeof homeFeedSchema>;
export type HomeAuction = HomeFeed['live'][number];
export type PublicStore = z.infer<typeof publicStoreSchema>;
export type PublicStoreList = z.infer<typeof publicStoreListSchema>;
