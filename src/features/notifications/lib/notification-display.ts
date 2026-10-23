import type { IconName } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import type { Notification, NotificationType } from '../types/notifications.types';

export type NotificationTone = 'bad' | 'gold' | 'warn' | 'info' | 'ok' | 'neutral';

/**
 * Each type's glyph and tone (design `notifications`): outbid red, won gold, ending amber,
 * orders neutral.
 */
export const NOTIFICATION_VISUAL: Record<
  NotificationType,
  { icon: IconName; tone: NotificationTone }
> = {
  OUTBID: { icon: 'rising', tone: 'bad' },
  AUCTION_ENDING_SOON: { icon: 'hourglass', tone: 'warn' },
  AUCTION_EXTENDED: { icon: 'clock', tone: 'info' },
  AUCTION_WON: { icon: 'trophy', tone: 'gold' },
  // No longer sent (wins need no confirmation); kept for old rows.
  WIN_EXPIRING_SOON: { icon: 'hourglass', tone: 'warn' },
  WIN_PASSED_TO_YOU: { icon: 'trophy', tone: 'gold' },
  AUCTION_APPROVED: { icon: 'check-circle', tone: 'ok' },
  AUCTION_REJECTED: { icon: 'x-circle', tone: 'bad' },
  ORDER_STATUS_CHANGED: { icon: 'truck', tone: 'neutral' },
  NEW_BID_ON_YOUR_AUCTION: { icon: 'gavel', tone: 'gold' },
  RETURN_REQUESTED: { icon: 'undo', tone: 'neutral' },
  RETURN_STATUS_CHANGED: { icon: 'undo', tone: 'neutral' },
  FOLLOWED_SELLER_NEW_AUCTION: { icon: 'live', tone: 'gold' },
  WATCHED_AUCTION_STARTING: { icon: 'heart', tone: 'info' },
  ADMIN_AUCTION_PENDING: { icon: 'bell', tone: 'neutral' },
  ADMIN_RETURN_REQUESTED: { icon: 'bell', tone: 'neutral' },
  PAYMENT_STATUS_CHANGED: { icon: 'card', tone: 'neutral' },
  AUCTION_CANCELLED: { icon: 'x-circle', tone: 'bad' },
  AUCTION_LOST: { icon: 'gavel', tone: 'neutral' },
  AUCTION_LIVE: { icon: 'live', tone: 'ok' },
  AUCTION_UNSOLD: { icon: 'gavel', tone: 'neutral' },
  REVIEW_RECEIVED: { icon: 'star', tone: 'gold' },
  REVIEW_REPLIED: { icon: 'star', tone: 'info' },
  SUPPORT_REPORT_RESOLVED: { icon: 'check-circle', tone: 'ok' },
  OTHER: { icon: 'bell', tone: 'neutral' },
};

export const TONE_TILE: Record<NotificationTone, string> = {
  bad: 'bg-destructive-soft text-destructive',
  gold: 'bg-gold-soft text-gold light:text-gold-lo',
  warn: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  ok: 'bg-live-soft text-live',
  neutral: 'bg-surface-high text-foreground-soft',
};

function field(data: unknown, key: string): string | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : null;
}

// AUCTION_WON / WIN_PASSED_TO_YOU now carry data.orderId (the order the win created), which
// routes to the order above; the wins list is the fallback for old rows without one.
const WIN_TYPES: NotificationType[] = ['AUCTION_WON', 'WIN_PASSED_TO_YOU', 'WIN_EXPIRING_SOON'];

/**
 * Where a notification leads: the order (the seller's sale view when it was sent to the seller),
 * the wins, the auction, the seller or the contact history. Null when it carries nothing to open.
 */
export function notificationHref(notification: Notification): string | null {
  const { type, data } = notification;
  const orderId = field(data, 'orderId');
  const isSeller = field(data, 'role') === 'seller' || type === 'REVIEW_RECEIVED';
  if (type === 'SUPPORT_REPORT_RESOLVED') return ROUTES.contact;
  if (orderId) return isSeller ? ROUTES.saleDetail(orderId) : ROUTES.orderDetail(orderId);
  if (WIN_TYPES.includes(type)) return ROUTES.wins;
  const auctionId = field(data, 'auctionId');
  if (auctionId) return ROUTES.auctionDetail(auctionId);
  const sellerId = field(data, 'sellerId');
  if (sellerId) return ROUTES.sellerProfile(sellerId);
  if (field(data, 'orderNumber')) return isSeller ? ROUTES.sellingSales : ROUTES.orders;
  return null;
}

/** "today", "yesterday" or the day's own key, on the viewer's calendar. */
export function dayKey(iso: string, now: number): 'today' | 'yesterday' | string {
  const day = new Date(iso);
  const today = new Date(now);
  const yesterday = new Date(now - 86_400_000);
  if (day.toDateString() === today.toDateString()) return 'today';
  if (day.toDateString() === yesterday.toDateString()) return 'yesterday';
  return day.toDateString();
}
