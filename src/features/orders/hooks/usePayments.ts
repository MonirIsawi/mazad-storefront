'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { QUERY_KEYS } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { paymentsApi } from '../api/payments.api';
import type { OrderPayments } from '../schemas/payments.schema';

/** How often an order waiting for SwiftPayIQ's confirmation is re-read (while the tab is visible). */
export const PAYMENT_POLL_MS = 5_000;

export function usePaymentMethods() {
  return useQuery({
    queryKey: QUERY_KEYS.payments.methods,
    queryFn: paymentsApi.methods,
    staleTime: 5 * 60_000,
  });
}

/** True while an electronic checkout of this order is open and not yet confirmed. */
export function isAwaitingConfirmation(data: OrderPayments | undefined) {
  if (!data || data.paidAt) return false;
  const latest = data.payments.find((payment) => payment.method === 'SWIFTPAY');
  return Boolean(latest && latest.status === 'PENDING' && latest.open);
}

/**
 * The order's payments. While a checkout waits for confirmation it is re-read every few seconds
 * and whenever the buyer comes back to this tab, so "paid" shows as soon as SwiftPayIQ's webhook
 * reaches mazad-api. Coming back alone never marks anything paid.
 */
export function useOrderPayments(orderId: string) {
  const isAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.payments.order(orderId),
    queryFn: () => paymentsApi.forOrder(orderId),
    enabled: isAuthenticated && Boolean(orderId),
    refetchOnWindowFocus: true,
    refetchInterval: (current) =>
      isAwaitingConfirmation(current.state.data) ? PAYMENT_POLL_MS : false,
    refetchIntervalInBackground: false,
  });

  // When the order becomes paid, the order itself (and the lists) changed too.
  const paidAt = query.data?.paidAt ?? null;
  const previous = useRef(paidAt);
  useEffect(() => {
    if (previous.current !== paidAt) {
      previous.current = paidAt;
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.mine });
    }
  }, [paidAt, orderId, queryClient]);

  return query;
}

/**
 * Opens SwiftPayIQ's hosted payment page in a new tab, keeping Mazad open here. The tab is opened
 * synchronously inside the click (so browsers don't block it) and pointed at the page once the
 * server answers; without a tab it falls back to this one.
 */
export function useStartSwiftPay(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const tab = typeof window !== 'undefined' ? window.open('', '_blank') : null;
      try {
        const checkout = await paymentsApi.startSwiftPay(orderId);
        if (tab && !tab.closed) {
          tab.opener = null;
          tab.location.href = checkout.checkoutUrl;
        } else {
          window.location.assign(checkout.checkoutUrl);
        }
        return checkout;
      } catch (error) {
        tab?.close();
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.order(orderId) });
    },
  });
}

export function useMyPayments() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: QUERY_KEYS.payments.mine,
    queryFn: () => paymentsApi.mine(),
    enabled: isAuthenticated,
  });
}
