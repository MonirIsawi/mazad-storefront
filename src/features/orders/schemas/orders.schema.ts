import { z } from 'zod';

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

const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  finalPrice: z.string(),
  product: z.object({ id: z.string(), nameEn: z.string(), nameAr: z.string() }),
  win: z.object({ id: z.string(), amount: z.string() }).nullable(),
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
  createdAt: z.string(),
  confirmedAt: z.string().nullable(),
  shippedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  // Set once the order is paid (cash on delivery or SwiftPayIQ); older APIs omit it.
  paidAt: z.string().nullish(),
  items: z.array(orderItemSchema),
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
