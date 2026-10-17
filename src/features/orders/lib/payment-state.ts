import type { BadgeTone } from '@shared/components/ui';
import type { OrderPayments } from '../schemas/payments.schema';
import type { OrderStatus } from '../types/orders.types';

/** Orders the buyer may still pay electronically (mazad-api's PAYABLE_ORDER_STATUSES). */
/** True while an electronic checkout of this order is open and not yet confirmed. */
export function isAwaitingConfirmation(data: OrderPayments | undefined) {
  if (!data || data.paidAt) return false;
  const latest = data.payments.find((payment) => payment.method === 'SWIFTPAY');
  return Boolean(latest && latest.status === 'PENDING' && latest.open);
}

export const PAYABLE: OrderStatus[] = ['CREATED', 'CONFIRMED', 'OUT_FOR_DELIVERY'];

export type PaymentState =
  'paid' | 'paidCash' | 'refunded' | 'partiallyRefunded' | 'awaiting' | 'failed' | 'unpaid';

/** What the order's payments add up to, from the server's records only. */
export function paymentStateOf(data: OrderPayments | undefined): PaymentState {
  if (!data) return 'unpaid';
  const settling = data.payments.find((payment) => payment.id === data.paidPaymentId);
  if (settling) {
    if (settling.status === 'REFUNDED') return 'refunded';
    if (settling.status === 'PARTIALLY_REFUNDED') return 'partiallyRefunded';
    return settling.method === 'SWIFTPAY' ? 'paid' : 'paidCash';
  }
  if (isAwaitingConfirmation(data)) return 'awaiting';
  const latest = data.payments.find((payment) => payment.method === 'SWIFTPAY');
  if (latest?.status === 'FAILED') return 'failed';
  return 'unpaid';
}

/**
 * The seller's one payment line. "Collect the total" only while the order is still on its way and
 * the cash is not in yet; delivered with the cash collected reads as done; a cancelled order has
 * nothing to collect (null: no line at all).
 */
export function sellerPaymentLineKey(state: PaymentState, status: OrderStatus): string | null {
  if (state === 'paid') return 'payment.seller.paid';
  if (state === 'refunded' || state === 'partiallyRefunded') return 'payment.seller.refunded';
  if (status === 'CANCELLED') return null;
  if (state === 'paidCash') {
    return status === 'DELIVERED' ? 'payment.seller.collected' : 'payment.state.paidCash';
  }
  return PAYABLE.includes(status) ? 'payment.seller.cod' : 'payment.state.unpaid';
}

export const STATE_TONE: Record<PaymentState, BadgeTone> = {
  paid: 'live',
  paidCash: 'live',
  refunded: 'neutral',
  partiallyRefunded: 'neutral',
  awaiting: 'warning',
  failed: 'warning',
  unpaid: 'upcoming',
};
