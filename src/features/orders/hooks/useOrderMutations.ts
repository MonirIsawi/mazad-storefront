'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { ordersApi, type SellerReturnAction } from '../api/orders.api';
import type { OrderStatus } from '../types/orders.types';
import { useOrdersTranslation } from './useOrdersTranslation';

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useOrdersTranslation();

  return useMutation({
    mutationFn: (reason?: string) => ordersApi.cancel(orderId, reason),
    onSuccess: () => {
      toast.success(t('toast.cancelled'));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
    },
  });
}

export function useOpenReturn(orderId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useOrdersTranslation();

  return useMutation({
    mutationFn: ({ orderItemId, reason }: { orderItemId: string; reason: string }) =>
      ordersApi.openReturn(orderItemId, reason),
    onSuccess: () => {
      toast.success(t('toast.returnOpened'));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
    },
  });
}

function useRefreshOrder(orderId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(orderId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.sales });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
  };
}

/** Seller: move the order one step (confirm, out for delivery, delivered). */
export function useAdvanceOrder(orderId: string) {
  const toast = useToast();
  const { t } = useOrdersTranslation();
  const refresh = useRefreshOrder(orderId);

  return useMutation({
    mutationFn: ({ status, cashReceived }: { status: OrderStatus; cashReceived?: number }) =>
      ordersApi.updateStatus(orderId, status, cashReceived),
    onSuccess: (_data, { status }) => {
      toast.success(t(`sales.toast.${status}`));
      refresh();
    },
  });
}

/** Seller: approve / reject / mark received / refund a return on one of their orders. */
export function useReturnAction(orderId: string) {
  const toast = useToast();
  const { t } = useOrdersTranslation();
  const refresh = useRefreshOrder(orderId);

  return useMutation({
    mutationFn: ({
      returnId,
      action,
      reason,
    }: {
      returnId: string;
      action: SellerReturnAction;
      reason?: string;
    }) => ordersApi.returnAction(returnId, action, reason),
    onSuccess: (_data, { action }) => {
      toast.success(t(`sales.returnToast.${action}`));
      refresh();
    },
  });
}
