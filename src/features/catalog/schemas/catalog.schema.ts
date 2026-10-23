import { z } from 'zod';
import { resolveAssetUrl } from '@shared/lib';

// --- Categories ---------------------------------------------------------

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  nameAr: string;
  iconUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

// Recursive schema needs an explicit type — z.infer can't derive one through z.lazy().
export const categoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    nameEn: z.string(),
    nameAr: z.string(),
    iconUrl: z.string().nullable(),
    sortOrder: z.number(),
    children: z.array(categoryNodeSchema),
  }),
);

// --- Auctions ------------------------------------------------------------

export const auctionStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'SOLD',
  'UNSOLD',
  'CANCELLED',
]);

export const productConditionSchema = z.enum(['NEW', 'LIKE_NEW', 'OPEN_BOX', 'USED']);

const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  // The 300 px thumbnail for strips and lists (equals `url` for external images; older APIs omit it).
  thumbUrl: z.string().nullish(),
  sortOrder: z.number(),
  isCover: z.boolean(),
});

// The product's specifications (detail only, may be empty): there are no brand/model fields.
const productVariantSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().nullish(),
  nameAr: z.string().nullish(),
  valueEn: z.string().nullish(),
  valueAr: z.string().nullish(),
});

const categoryRefSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
});

// With a parent, the parent is the main category and this one the subcategory.
const auctionCategorySchema = categoryRefSchema.extend({
  parent: categoryRefSchema.nullish(),
});

export interface GalleryImage {
  /** Full size, for the main image. */
  url: string;
  /** The small version for thumbnails; the full URL when there is none. */
  thumbUrl: string;
}

/** Every photo in display order: the cover first, then by sortOrder. */
function orderedGallery(images: z.infer<typeof productImageSchema>[]): GalleryImage[] {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = sorted.find((image) => image.isCover);
  const ordered = cover ? [cover, ...sorted.filter((image) => image !== cover)] : sorted;
  return ordered.flatMap((image) => {
    const url = resolveAssetUrl(image.url);
    return url ? [{ url, thumbUrl: resolveAssetUrl(image.thumbUrl) ?? url }] : [];
  });
}

function pickCoverImageUrl(images: z.infer<typeof productImageSchema>[]): string | null {
  if (images.length === 0) return null;
  const cover = images.find((image) => image.isCover);
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  return (cover ?? sorted[0])?.url ?? null;
}

// mazad-api's /auctions and /auctions/:id embed the full product with an `images[]` array, not
// a pre-picked cover — this transform derives `coverImage` once here (and resolves the raw
// storage key to a URL, see shared/lib/asset.ts) so every consumer gets it for free, and the
// result is a superset of shared/types' AuctionSummary shape.
const auctionProductSchema = z
  .object({
    id: z.string(),
    nameEn: z.string(),
    nameAr: z.string(),
    condition: productConditionSchema,
    marketPrice: z.string().nullable(),
    images: z.array(productImageSchema),
    variants: z.array(productVariantSchema).optional(),
    category: auctionCategorySchema.optional(),
    // Detail only; mazad-api already falls back to the other language when one is empty.
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
  })
  .transform((product) => ({
    ...product,
    coverImage: resolveAssetUrl(pickCoverImageUrl(product.images)),
    gallery: orderedGallery(product.images),
  }));

const auctionSellerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  isVerified: z.boolean(),
});

const auctionStoreSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  city: z.string(),
  deliveryFee: z.string(),
});

export const auctionSchema = z.object({
  id: z.string(),
  status: auctionStatusSchema,
  startingPrice: z.string(),
  minIncrement: z.string(),
  currentPrice: z.string().nullable(),
  bidCount: z.number(),
  // Distinct bidders (detail only; bidCount includes automatic bids).
  bidderCount: z.number().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  originalEndsAt: z.string(),
  buyNowPrice: z.string().nullable(),
  product: auctionProductSchema,
  seller: auctionSellerSchema,
  store: auctionStoreSchema,
  // The server's next-bid rule and what the detail adds for buyers (optional: older API builds).
  minNextBid: z.string().optional(),
  bidIncrement: z.string().optional(),
  saleCancelled: z.boolean().optional(),
  // This auction's delivery fee (the same as store.deliveryFee, which older builds only send).
  deliveryFee: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  returnWindowDays: z.number().optional(),
  sellerRating: z.object({ average: z.number().nullable(), count: z.number() }).optional(),
  serverTime: z.string().optional(),
  // false: the seller's fixed step (new listings); true: an older auction on the platform ladder.
  incrementLadder: z.boolean().optional(),
  // The late-bid rule for this auction, set by the seller: a bid in the last antiSnipingMinutes
  // extends it by extensionMinutes (the same number; null on older auctions, which extend by the
  // platform setting), at most maxExtensions times (optional: older API builds).
  antiSnipingMinutes: z.number().optional(),
  extensionMinutes: z.number().nullable().optional(),
  maxExtensions: z.number().optional(),
  extensionsCount: z.number().optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const auctionListSchema = z.object({
  data: z.array(auctionSchema),
  meta: paginationMetaSchema,
});

// --- Bids ------------------------------------------------------------------

export const bidHistoryItemSchema = z.object({
  id: z.string(),
  amount: z.string(),
  createdAt: z.string(),
  // Optional: older API builds. `isMine` only ever marks the signed-in viewer's own bids.
  isAutoBid: z.boolean().optional(),
  isMine: z.boolean().optional(),
  // Both carry the bidder's full name now; fullName is optional for older API builds.
  bidder: z.object({ maskedName: z.string(), fullName: z.string().optional() }),
});

export const bidHistorySchema = z.array(bidHistoryItemSchema);

// --- Stores ------------------------------------------------------------------

// GET /stores/:id is public: no address, phone or pin (the API stopped sending them), and any it
// did send would be dropped here. Its `auctions` is an always-empty placeholder — listings come
// from GET /auctions?storeId= — so it isn't read.
export const storePageSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  city: z.string(),
  deliveryFee: z.string(),
  seller: z.object({ id: z.string(), fullName: z.string(), isVerified: z.boolean() }),
  // Optional: older API builds.
  sellerRating: z.object({ average: z.number().nullable(), count: z.number() }).optional(),
});
