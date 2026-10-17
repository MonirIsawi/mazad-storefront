import { z } from 'zod';
import { paymentMethodSchema, paymentStatusSchema } from './payments.schema';

export const orderStatusSchema = z.enum([
  'CREATED',
  'CONFIRMED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const returnStatusSchema = z.enum([
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PRODUCT_RETURNED',
  'REFUNDED',
  'CANCELLED',
]);

/**
 * What was bought, as the order was created (mazad-api's snapshot; older orders fall back to the
 * product as it is now). Later renames, new photos or a blocked listing don't change it. Every
 * field is optional: an older API sends none of this and the item still renders.
 */
const orderItemDisplaySchema = z.object({
  productId: z.string().nullish(),
  auctionId: z.string().nullish(),
  nameEn: z.string().nullish(),
  nameAr: z.string().nullish(),
  imageUrl: z.string().nullish(),
  thumbUrl: z.string().nullish(),
  condition: z.string().nullish(),
  marketPrice: z.string().nullish(),
  buyNowPrice: z.string().nullish(),
  finalPrice: z.string().nullish(),
  fromSnapshot: z.boolean().nullish(),
  /** The auction page can still be opened; no "View listing" link otherwise. */
  listingAvailable: z.boolean().nullish(),
});

/** The buyer's rating of an order item, as GET /orders/:id carries it (prefills the edit sheet). */
export const orderItemReviewSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()).nullish(),
  comment: z.string().nullish(),
  editableUntil: z.string().nullish(),
});

const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  finalPrice: z.string(),
  product: z.object({ id: z.string(), nameEn: z.string(), nameAr: z.string() }).nullish(),
  display: orderItemDisplaySchema.nullish(),
  win: z.object({ id: z.string(), amount: z.string() }).nullable(),
  // Store rating (Bidoom API): absent on an API without ratings, which hides the rating card.
  review: orderItemReviewSchema.nullish(),
  canReview: z.boolean().optional(),
  reviewWindowEndsAt: z.string().nullish(),
  // The 7-day guarantee: present once the buyer has opened a return on this item.
  returnRequest: z
    .object({
      id: z.string(),
      status: returnStatusSchema,
      reason: z.string().nullable(),
      requestedAt: z.string(),
    })
    .nullable(),
});

/**
 * GET /me/orders and GET /orders/:id both return mazad-api's `orderInclude` shape — a bare array
 * for the list (no `{ data, meta }` envelope, unlike the admin lists) and a single object for the
 * detail. Money fields are Decimal strings throughout.
 */
export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotal: z.string(),
  deliveryFee: z.string(),
  total: z.string(),
  shipCity: z.string(),
  shipArea: z.string().nullable(),
  shipStreet: z.string().nullable(),
  shipDetails: z.string().nullable(),
  shipPhone: z.string().nullable(),
  note: z.string().nullable(),
  cancelReason: z.string().nullable(),
  // Who cancelled (mazad-api Order.cancelledBy); absent from older API builds.
  cancelledBy: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SYSTEM']).nullish(),
  createdAt: z.string(),
  confirmedAt: z.string().nullable(),
  shippedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  // Set once the order is paid (cash on delivery or SwiftPayIQ); older APIs omit it.
  paidAt: z.string().nullish(),
  items: z.array(orderItemSchema),
  // The store's name when the order was created: shown instead of `store`, which is current.
  storeName: z.object({ nameEn: z.string().nullish(), nameAr: z.string().nullish() }).nullish(),
  // Newest first, status and amounts only (older APIs omit it).
  payments: z
    .array(
      z.object({
        id: z.string(),
        method: paymentMethodSchema,
        status: paymentStatusSchema,
        paidAt: z.string().nullish(),
      }),
    )
    .nullish(),
  store: z.object({
    id: z.string(),
    nameEn: z.string(),
    nameAr: z.string(),
    city: z.string(),
  }),
  seller: z.object({ id: z.string(), fullName: z.string(), isVerified: z.boolean() }),
  // The buyer: included by mazad-api's orderInclude, shown to the seller (Sales).
  customer: z
    .object({ id: z.string(), fullName: z.string(), phone: z.string().nullable() })
    .nullish(),
});

export const ordersListSchema = z.array(orderSchema);

/** GET /me/sales/summary: open = CREATED + CONFIRMED + OUT_FOR_DELIVERY. */
export const salesSummarySchema = z.object({
  open: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number()).optional(),
});
