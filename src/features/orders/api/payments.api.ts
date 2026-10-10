import { httpClient } from '@shared/api';
import {
  checkoutSchema,
  myPaymentsSchema,
  orderPaymentsSchema,
  paymentMethodsSchema,
  type Checkout,
  type MyPayments,
  type OrderPayments,
  type PaymentMethods,
} from '../schemas/payments.schema';

export const paymentsApi = {
  /** Whether electronic payment is offered (and in test or live mode). Public. */
  methods: async (): Promise<PaymentMethods> => {
    const response = await httpClient.get<unknown>('/payments/methods');
    return paymentMethodsSchema.parse(response.data);
  },

  /**
   * Opens (or reopens) the order's SwiftPayIQ payment page. The server prices the order; the
   * page's URL comes back. Paying there is confirmed only by SwiftPayIQ's webhook to mazad-api.
   */
  startSwiftPay: async (orderId: string): Promise<Checkout> => {
    const response = await httpClient.post<unknown>(`/orders/${orderId}/payments/swiftpay`);
    return checkoutSchema.parse(response.data);
  },

  forOrder: async (orderId: string): Promise<OrderPayments> => {
    const response = await httpClient.get<unknown>(`/orders/${orderId}/payments`);
    return orderPaymentsSchema.parse(response.data);
  },

  mine: async (page = 1): Promise<MyPayments> => {
    const response = await httpClient.get<unknown>('/me/payments', { params: { page, limit: 50 } });
    return myPaymentsSchema.parse(response.data);
  },
};
