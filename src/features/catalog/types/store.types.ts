import type { z } from 'zod';
import type {
  STORE_REVIEW_TAGS,
  storeFrontSchema,
  storeReviewSchema,
  storeReviewSummarySchema,
  storeReviewsSchema,
} from '../schemas/store.schema';

export type StoreFront = z.infer<typeof storeFrontSchema>;
export type StoreReview = z.infer<typeof storeReviewSchema>;
export type StoreReviewSummary = z.infer<typeof storeReviewSummarySchema>;
export type StoreReviewsPage = z.infer<typeof storeReviewsSchema>;
export type StoreReviewTag = (typeof STORE_REVIEW_TAGS)[number];

/** The store page's tabs: its auctions by status, then its ratings. */
export type StoreTab = 'live' | 'upcoming' | 'ended' | 'ratings';
