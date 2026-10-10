import { z } from 'zod';

/**
 * mazad-api's public payment shape (toPublicPayment): status and amounts only, no provider ids.
 * Unknown statuses or methods from a newer API fall back to a neutral value instead of failing
 * the whole order screen.
 */
export const paymentStatusSchema = z
  .enum(['PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED'])
  .catch('PENDING');
export const paymentMethodSchema = z
  .enum(['CASH_ON_DELIVERY', 'SWIFTPAY'])
  .catch('CASH_ON_DELIVERY');

export const paymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  amount: z.string(),
  currency: z.literal('IQD').catch('IQD'),
  isLive: z.boolean().nullable().optional(),
  expiresAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  /** True while the buyer can still (re)open this checkout. */
  open: z.boolean(),
});

/** GET /orders/:id/payments */
export const orderPaymentsSchema = z.object({
  orderId: z.string(),
  paidAt: z.string().nullable(),
  paidPaymentId: z.string().nullable(),
  payments: z.array(paymentSchema),
});

/** GET /me/payments */
export const myPaymentsSchema = z.object({
  data: z.array(
    paymentSchema.extend({
      order: z.object({
        id: z.string(),
        orderNumber: z.string(),
        status: z.string(),
        store: z.object({ id: z.string(), nameEn: z.string(), nameAr: z.string() }).nullable(),
      }),
    }),
  ),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

/** GET /payments/methods */
export const paymentMethodsSchema = z.object({
  cashOnDelivery: z.object({ enabled: z.boolean() }),
  swiftpay: z.object({
    enabled: z.boolean(),
    mode: z.enum(['test', 'live']).catch('test'),
    currency: z.string(),
  }),
});

/** POST /orders/:id/payments/swiftpay */
export const checkoutSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  status: paymentStatusSchema,
  amount: z.string(),
  currency: z.string(),
  checkoutUrl: z.string().url(),
  expiresAt: z.string().nullable(),
  mode: z.enum(['test', 'live']).catch('test'),
  reused: z.boolean(),
});

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type OrderPayments = z.infer<typeof orderPaymentsSchema>;
export type MyPayments = z.infer<typeof myPaymentsSchema>;
export type PaymentMethods = z.infer<typeof paymentMethodsSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
