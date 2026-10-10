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
  sortOrder: z.number(),
  isCover: z.boolean(),
});

const productVariantSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  valueEn: z.string(),
  valueAr: z.string(),
});

const auctionCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
});

/** Every photo in display order: the cover first, then by sortOrder. */
function orderedImageUrls(images: z.infer<typeof productImageSchema>[]): string[] {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = sorted.find((image) => image.isCover);
  const ordered = cover ? [cover, ...sorted.filter((image) => image !== cover)] : sorted;
  return ordered.flatMap((image) => {
    const url = resolveAssetUrl(image.url);
    return url ? [url] : [];
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
    imageUrls: orderedImageUrls(product.images),
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
  paymentMethods: z.array(z.string()).optional(),
  returnWindowDays: z.number().optional(),
  sellerRating: z.object({ average: z.number().nullable(), count: z.number() }).optional(),
  serverTime: z.string().optional(),
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
  bidder: z.object({ maskedName: z.string() }),
});

export const bidHistorySchema = z.array(bidHistoryItemSchema);

// --- Stores ------------------------------------------------------------------

export const storePageSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  city: z.string(),
  area: z.string().nullable(),
  street: z.string().nullable(),
  details: z.string().nullable(),
  contactPhone: z.string().nullable(),
  deliveryFee: z.string(),
  seller: z.object({ id: z.string(), fullName: z.string(), isVerified: z.boolean() }),
});
