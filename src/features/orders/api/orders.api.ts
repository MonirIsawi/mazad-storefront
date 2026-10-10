import { httpClient } from '@shared/api';
import { orderSchema, ordersListSchema } from '../schemas/orders.schema';
import type { Order, OrderStatus, OrdersList } from '../types/orders.types';

export type SellerReturnAction = 'approve' | 'reject' | 'received' | 'refund';

export const ordersApi = {
  list: async (): Promise<OrdersList> => {
    const response = await httpClient.get<unknown>('/me/orders', { params: { limit: 50 } });
    return ordersListSchema.parse(response.data);
  },

  get: async (id: string): Promise<Order> => {
    const response = await httpClient.get<unknown>(`/orders/${id}`);
    return orderSchema.parse(response.data);
  },

  // Only allowed while the order is still CREATED — mazad-api rejects anything later with
  // ORDER_STATUS_INVALID, which the detail screen surfaces by errorCode.
  cancel: async (id: string, reason?: string): Promise<void> => {
    await httpClient.post(`/orders/${id}/cancel`, { reason });
  },

  openReturn: async (orderItemId: string, reason: string): Promise<void> => {
    await httpClient.post(`/order-items/${orderItemId}/return`, { reason });
  },

  /** The seller's received orders across their stores, newest first (same bare-array shape). */
  listSales: async (): Promise<OrdersList> => {
    const response = await httpClient.get<unknown>('/me/sales', { params: { limit: 50 } });
    return ordersListSchema.parse(response.data);
  },

  /**
   * Seller: CREATED → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED (mazad-api SELLER_TRANSITIONS).
   * Delivering an unpaid cash-on-delivery order needs `cashReceived`, the exact total the seller
   * confirmed (CASH_CONFIRMATION_REQUIRED / CASH_AMOUNT_MISMATCH otherwise).
   */
  updateStatus: async (id: string, status: OrderStatus, cashReceived?: number): Promise<void> => {
    await httpClient.post(
      `/orders/${id}/status`,
      cashReceived != null ? { status, cashReceived } : { status },
    );
  },

  /** Seller side of a return: approve, reject (reason required), product received, refund. */
  returnAction: async (
    returnId: string,
    action: SellerReturnAction,
    reason?: string,
  ): Promise<void> => {
    await httpClient.post(
      `/returns/${returnId}/${action}`,
      action === 'reject' ? { reason } : undefined,
    );
  },
};
