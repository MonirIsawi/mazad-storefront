import { z } from 'zod';
import { MAX_MONEY_AMOUNT } from '@shared/lib';

export const bidStandingSchema = z.enum([
  'WINNING',
  'OUTBID',
  'AWAITING_CONFIRMATION',
  'WON',
  'LOST',
]);

const bidAuctionSummarySchema = z.object({
  currentPrice: z.string(),
  bidCount: z.number(),
  endsAt: z.string(),
  status: z.string(),
});

// mazad-api can silently substitute another bidder's auto-bid counter-offer into this response's
// top-level id/amount when proxy bidding resolves in the same transaction — only `auction.*` is
// guaranteed to reflect the caller's own action. See usePlaceBid's onSuccess.
export const bidResponseSchema = z.object({
  id: z.string(),
  auctionId: z.string(),
  amount: z.string(),
  createdAt: z.string(),
  auction: bidAuctionSummarySchema,
  buyNow: z.boolean().optional(),
});

export const autoBidResponseSchema = z.object({
  auctionId: z.string(),
  maxAmount: z.string(),
  isActive: z.boolean(),
  bid: bidResponseSchema.nullable(),
});

export const autoBidCancelResponseSchema = z.object({
  auctionId: z.string(),
  isActive: z.literal(false),
});

// Bidding re-fetches only the pricing fields it needs from GET /auctions/:id, under its own
// query key/schema rather than reusing catalog's — see the interactive-features plan's
// cross-feature data rule.
export const auctionPricingSchema = z.object({
  id: z.string(),
  status: z.string(),
  startingPrice: z.string(),
  minIncrement: z.string(),
  currentPrice: z.string().nullable(),
  buyNowPrice: z.string().nullable(),
  endsAt: z.string(),
});

const myBidWinSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED', 'EXPIRED']),
  amount: z.string(),
  confirmationDeadline: z.string(),
});

export const myBidItemSchema = z.object({
  auctionId: z.string(),
  standing: bidStandingSchema,
  myHighestBid: z.string(),
  lastBidAt: z.string(),
  bidCount: z.number(),
  autoBid: z.object({ maxAmount: z.string(), isActive: z.boolean() }).nullable(),
  win: myBidWinSchema.nullable(),
  auction: z.object({
    id: z.string(),
    status: z.string(),
    startingPrice: z.string(),
    currentPrice: z.string().nullable(),
    startsAt: z.string(),
    endsAt: z.string(),
    product: z.object({
      id: z.string(),
      nameEn: z.string(),
      nameAr: z.string(),
      coverImage: z.string().nullable(),
    }),
    seller: z.object({ id: z.string(), fullName: z.string(), isVerified: z.boolean() }),
  }),
});

export const myBidsMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const myBidsListSchema = z.object({
  data: z.array(myBidItemSchema),
  meta: myBidsMetaSchema,
});

// --- Forms (mirror PlaceBidDto/AutoBidDto: number, max 2 decimal places, > 0) ---

export const placeBidFormSchema = z.object({
  amount: z
    .number({ error: 'errors.field.amountRequired' })
    .positive('errors.field.amountRequired')
    .multipleOf(0.01, 'errors.field.amountStep')
    .max(MAX_MONEY_AMOUNT, 'errors.field.amountTooHigh'),
});

export const autoBidFormSchema = z.object({
  maxAmount: z
    .number({ error: 'errors.field.amountRequired' })
    .positive('errors.field.amountRequired')
    .multipleOf(0.01, 'errors.field.amountStep')
    .max(MAX_MONEY_AMOUNT, 'errors.field.amountTooHigh'),
});
