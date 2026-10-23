import { z } from 'zod';

/**
 * A win becomes an order at once at the winner's default address: nothing to confirm or decline.
 * PASSED_OVER means the winner couldn't receive it and it went to the next bidder (shown as lost).
 */
export const winStatusSchema = z.enum(['CONFIRMED', 'PASSED_OVER']);

/**
 * GET /me/wins returns the caller's CONFIRMED `AuctionWin` rows with the auction and order-item
 * relations included (see mazad-api's WinsService.listMyWins) — a bare array, not a
 * `{ data, meta }` envelope, and `amount` is a Decimal string like every other price.
 */
export const winSchema = z.object({
  id: z.string(),
  auctionId: z.string(),
  rank: z.number(),
  amount: z.string(),
  status: winStatusSchema,
  confirmedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  auction: z.object({
    id: z.string(),
    status: z.string(),
    storeId: z.string(),
    endsAt: z.string(),
    product: z.object({ nameEn: z.string(), nameAr: z.string() }),
  }),
  // The order the win created — the link to follow from here.
  orderItem: z.object({ orderId: z.string() }).nullable(),
});

export const winsListSchema = z.array(winSchema);
