import { z } from 'zod';
import { resolveAssetUrl } from '@shared/lib';
import { storePageSchema } from './catalog.schema';

/*
 * The Bidoom storefront additions to GET /stores/:id and the store ratings route (DESIGN-BRIEF,
 * "API contract": stores and store ratings). Every addition is optional: until the deployed API
 * sends a field, the page leaves that part out rather than inventing it.
 */

export const storeFrontSchema = storePageSchema.extend({
  // A storage key or URL; null when the store has no cover (the page draws its initial instead).
  coverUrl: z
    .string()
    .nullish()
    .transform((value) => resolveAssetUrl(value)),
  /** The seller's verified mark (follows and verification are per seller). */
  isVerified: z.boolean().optional(),
  rating: z.object({ avg: z.number().nullable(), count: z.number() }).optional(),
  followers: z.number().optional(),
  liveCount: z.number().optional(),
  soldCount: z.number().optional(),
});

/** The fixed tag set: praise for 4–5 stars, problems for 1–3. Unknown tags are not shown. */
export const STORE_REVIEW_TAGS = [
  'AS_DESCRIBED',
  'FAST_DELIVERY',
  'GOOD_PACKAGING',
  'FRIENDLY_SELLER',
  'GOOD_VALUE',
  'NOT_AS_DESCRIBED',
  'LATE_DELIVERY',
  'POOR_PACKAGING',
  'UNRESPONSIVE_SELLER',
  'DAMAGED',
] as const;

export const storeReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  tags: z.array(z.string()).default([]),
  comment: z.string().nullish(),
  /** The reviewer's full name: a rating publishes under it, with the item's name. */
  authorName: z.string(),
  /** The bought item in the request language (the order's snapshot), and both languages. */
  itemName: z.string().nullish(),
  itemNameEn: z.string().nullish(),
  itemNameAr: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
  reply: z.object({ text: z.string(), createdAt: z.string() }).nullish(),
});

export const storeReviewSummarySchema = z.object({
  avg: z.number().nullable(),
  count: z.number(),
  /** How many ratings gave 1, 2, 3, 4 and 5 stars, in that order. */
  distribution: z.array(z.number()).default([]),
  topTags: z.array(z.object({ tag: z.string(), count: z.number() })).default([]),
});

export const storeReviewsSchema = z.object({
  summary: storeReviewSummarySchema,
  items: z.array(storeReviewSchema),
  /** The next page's cursor; absent or null on the last page. */
  nextCursor: z.string().nullish(),
});
