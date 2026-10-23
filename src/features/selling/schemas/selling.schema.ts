import { z } from 'zod';
import { MAX_MONEY_AMOUNT } from '@shared/lib';
import { parseDinars } from '../lib/dinars';

/* ── Server shapes ──────────────────────────────────────────────────────────────────────── */

export const PRODUCT_CONDITIONS = ['NEW', 'LIKE_NEW', 'OPEN_BOX', 'USED'] as const;

export const SELLER_AUCTION_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'SOLD',
  'UNSOLD',
  'CANCELLED',
] as const;

// Decimal fields arrive as strings from mazad-api and stay strings here (ADR-009) — parse them
// with parseMoney at the point of arithmetic, never by coercing the schema to a number.
const storeRowSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  city: z.string(),
  area: z.string().nullable(),
  street: z.string().nullable(),
  details: z.string().nullable(),
  contactPhone: z.string().nullable(),
  deliveryFee: z.coerce.string(),
  isDefault: z.boolean(),
  coverUrl: z.string().nullish(),
  /** True when the API knows store covers (its rows carry a `coverUrl` key, even a null one). */
  supportsCover: z.boolean(),
});

// An API with store covers sends `coverUrl` on every row (null without a cover); an older one
// doesn't send the key at all, and the cover upload stays hidden.
export const storeSchema = z.preprocess(
  (raw) => (raw && typeof raw === 'object' ? { ...raw, supportsCover: 'coverUrl' in raw } : raw),
  storeRowSchema,
);

export const storeListSchema = z.array(storeSchema);

export const sellerProductSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  descriptionEn: z.string(),
  descriptionAr: z.string(),
  condition: z.enum(PRODUCT_CONDITIONS),
  marketPrice: z.coerce.string().nullable(),
  isBlocked: z.boolean(),
  category: z.object({ id: z.string(), name: z.string() }),
  store: z.object({ id: z.string(), name: z.string(), city: z.string() }),
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      // Not sent by /me/products today; resolveThumbUrl derives it from `url` until it is.
      thumbUrl: z.string().nullish(),
      sortOrder: z.number(),
      isCover: z.boolean(),
    }),
  ),
});

// GET /me/products is one of the paginated endpoints: { data, meta } (AGENTS.md, contract rule 3).
export const sellerProductListSchema = z.object({
  data: z.array(sellerProductSchema),
  meta: z
    .object({ page: z.number(), limit: z.number(), total: z.number() })
    .partial()
    .passthrough(),
});

/** GET /products/:id for the owner: only the block reason is read from it. */
export const productBlockSchema = z.object({ blockReason: z.string().nullish() });

export const sellerAuctionSchema = z.object({
  id: z.string(),
  status: z.enum(SELLER_AUCTION_STATUSES),
  startingPrice: z.coerce.string(),
  minIncrement: z.coerce.string(),
  // false on new listings (the seller's fixed step); true on older ones on the platform ladder.
  incrementLadder: z.boolean().optional(),
  currentPrice: z.coerce.string().nullable(),
  buyNowPrice: z.coerce.string().nullable(),
  bidCount: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  antiSnipingMinutes: z.number().nullable().optional(),
  maxExtensions: z.number().nullable().optional(),
  extensionMinutes: z.number().nullable().optional(),
  rejectionReason: z.string().nullable(),
  cancelReason: z.string().nullable(),
  // SOLD, but the order was cancelled: the product may be listed again (mazad-api saleCancelled).
  saleCancelled: z.boolean().optional(),
  product: z
    .object({
      id: z.string(),
      nameEn: z.string(),
      nameAr: z.string(),
      images: z.array(z.object({ url: z.string(), isCover: z.boolean() })).optional(),
    })
    .optional(),
});

export const sellerAuctionListSchema = z.array(sellerAuctionSchema);

export const uploadedImageSchema = z.object({
  key: z.string(),
  thumbKey: z.string(),
  url: z.string(),
  thumbUrl: z.string(),
});

/* ── Form shapes ────────────────────────────────────────────────────────────────────────── */

// Mirrors CreateStoreDto. PATCH /me/stores/:id accepts the same body, so create and edit share
// this schema rather than a .partial() variant.
export const storeFormSchema = z.object({
  nameEn: z.string().trim().min(1, 'errors.field.nameEnRequired').max(200),
  nameAr: z.string().trim().min(1, 'errors.field.nameArRequired').max(200),
  city: z.string().trim().min(1, 'errors.field.cityRequired').max(100),
  area: z.string().trim().optional(),
  street: z.string().trim().optional(),
  details: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  // Typed into a text field, sent as a number — the DTO validates @IsNumber().
  deliveryFee: z.coerce.number('errors.field.deliveryFeeInvalid').min(0),
});

// One language is enough: a name and a description in Arabic or English, and the empty side is
// filled from the other (buyers reading the other language still see something).
export const productFormSchema = z
  .object({
    storeId: z.string().min(1, 'errors.field.storeRequired'),
    categoryId: z.string().min(1, 'errors.field.categoryRequired'),
    nameEn: z.string().trim().max(300),
    nameAr: z.string().trim().max(300),
    descriptionEn: z.string().trim(),
    descriptionAr: z.string().trim(),
    // Chosen on purpose: no default, so "Used" is never claimed for a new item by accident.
    condition: z.enum(PRODUCT_CONDITIONS, 'errors.field.conditionRequired'),
    // The new retail price, typed as grouped whole dinars. Optional in the DTO; an empty field
    // must send nothing rather than 0, which would advertise a new price of zero on the auction.
    marketPrice: z
      .string()
      .optional()
      .transform((text, ctx) => {
        if (!text?.trim()) return undefined;
        const parsed = parseDinars(text);
        if ('value' in parsed && parsed.value <= MAX_MONEY_AMOUNT) return parsed.value;
        // Decimals get their own message ("whole dinars"), not a generic "invalid".
        const message =
          'value' in parsed
            ? 'errors.field.marketPriceTooHigh'
            : parsed.error === 'errors.field.wholeDinars'
              ? parsed.error
              : 'errors.field.marketPriceInvalid';
        ctx.addIssue({ code: 'custom', message });
        return z.NEVER;
      }),
  })
  .superRefine((values, ctx) => {
    if (!values.nameAr && !values.nameEn) {
      ctx.addIssue({ code: 'custom', path: ['nameAr'], message: 'errors.field.nameOneLanguage' });
    }
    if (!values.descriptionAr && !values.descriptionEn) {
      ctx.addIssue({
        code: 'custom',
        path: ['descriptionAr'],
        message: 'errors.field.descriptionOneLanguage',
      });
    }
  })
  .transform((values) => ({
    ...values,
    nameAr: values.nameAr || values.nameEn,
    nameEn: values.nameEn || values.nameAr,
    descriptionAr: values.descriptionAr || values.descriptionEn,
    descriptionEn: values.descriptionEn || values.descriptionAr,
  }));

export const auctionFormSchema = z
  .object({
    productId: z.string().min(1, 'errors.field.productRequired'),
    startingPrice: z.coerce.number('errors.field.startingPriceInvalid').min(0),
    // The seller's step and extension (mazad-api sellerAuctionRules); buildAuctionPayload checks
    // the bounds against the opening price, the API answers INVALID_BID_STEP / _EXTENSION_RULE.
    minIncrement: z.coerce.number('errors.field.minIncrementInvalid').int().min(0),
    antiSnipingMinutes: z.coerce.number().int().min(1).max(10),
    maxExtensions: z.coerce.number().int().min(1).max(20),
    // datetime-local gives "2026-08-11T18:30" with no zone; toIsoFromLocalInput converts.
    startsAt: z.string().min(1, 'errors.field.startsAtRequired'),
    endsAt: z.string().min(1, 'errors.field.endsAtRequired'),
    buyNowPrice: z
      .union([z.literal(''), z.coerce.number().min(0)])
      .optional()
      .transform((value) => (value === '' || value === undefined ? undefined : value)),
  })
  // The API rejects this with INVALID_AUCTION_DATES; catching it here means the seller finds out
  // before losing the rest of the form to a failed round trip.
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: 'errors.field.endsBeforeStarts',
    path: ['endsAt'],
  });
