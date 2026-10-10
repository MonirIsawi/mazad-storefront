import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'OUTBID',
  'AUCTION_ENDING_SOON',
  'AUCTION_EXTENDED',
  'AUCTION_WON',
  'WIN_EXPIRING_SOON',
  'WIN_PASSED_TO_YOU',
  'AUCTION_APPROVED',
  'AUCTION_REJECTED',
  'ORDER_STATUS_CHANGED',
  'NEW_BID_ON_YOUR_AUCTION',
  'RETURN_REQUESTED',
  'RETURN_STATUS_CHANGED',
  'FOLLOWED_SELLER_NEW_AUCTION',
  'WATCHED_AUCTION_STARTING',
  'ADMIN_AUCTION_PENDING',
  'ADMIN_RETURN_REQUESTED',
  'PAYMENT_STATUS_CHANGED',
  'AUCTION_CANCELLED',
  'AUCTION_LOST',
  'AUCTION_LIVE',
  'AUCTION_UNSOLD',
]);

/**
 * Unlike /categories and /stores, notifications are *not* localized server-side from
 * Accept-Language — the rows carry both languages and the client picks (mazad-api stores
 * titleEn/titleAr/bodyEn/bodyAr on the Notification model). `data` is an untyped JSON bag whose
 * shape varies per type; it's kept as unknown and only read through narrow accessors.
 */
export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema.catch('OUTBID'),
  titleEn: z.string(),
  titleAr: z.string(),
  bodyEn: z.string(),
  bodyAr: z.string(),
  data: z.unknown(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const notificationsListSchema = z.array(notificationSchema);

export const unreadCountSchema = z.object({ count: z.number() });
