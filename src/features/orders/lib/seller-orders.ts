import type { SellerReturnAction } from '../api/orders.api';
import type { Order, OrderStatus, ReturnStatus } from '../types/orders.types';

/** The seller's next step for an order (mazad-api SELLER_TRANSITIONS), or null when done. */
export function nextSellerStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'CREATED':
      return 'CONFIRMED';
    case 'CONFIRMED':
      return 'OUT_FOR_DELIVERY';
    case 'OUT_FOR_DELIVERY':
      return 'DELIVERED';
    default:
      return null;
  }
}

/** Orders that still need the seller to act on them (the Selling hub count). */
export function isOpenSale(order: Pick<Order, 'status'>): boolean {
  return nextSellerStatus(order.status) !== null;
}

/** What the seller can do with a return in its current state (mazad-api ReturnsService). */
export function sellerReturnActions(status: ReturnStatus): SellerReturnAction[] {
  switch (status) {
    case 'REQUESTED':
      return ['approve', 'reject'];
    case 'APPROVED':
      return ['received'];
    case 'PRODUCT_RETURNED':
      return ['refund'];
    default:
      return [];
  }
}
