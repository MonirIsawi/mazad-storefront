import { z } from 'zod';

export const winStatusSchema = z.enum(['PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED', 'EXPIRED']);

/**
 * GET /me/wins returns the raw `AuctionWin` rows with the auction and order-item relations
 * included (see mazad-api's WinsService.listMyWins) — a bare array, not a `{ data, meta }`
 * envelope, and `amount` is a Decimal string like every other price.
 */
export const winSchema = z.object({
  id: z.string(),
  auctionId: z.string(),
  rank: z.number(),
  amount: z.string(),
  status: winStatusSchema,
  confirmationDeadline: z.string(),
  confirmedAt: z.string().nullable(),
  createdAt: z.string(),
  auction: z.object({
    id: z.string(),
    status: z.string(),
    storeId: z.string(),
    endsAt: z.string(),
    product: z.object({ nameEn: z.string(), nameAr: z.string() }),
  }),
  // Present once the win has been turned into an order — the link to follow from here.
  orderItem: z.object({ orderId: z.string() }).nullable(),
});

export const winsListSchema = z.array(winSchema);

export const confirmWinsResultSchema = z.unknown();
