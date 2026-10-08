'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { ordersApi } from '../api/orders.api';

export function useOrders(isEnabled = true) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: QUERY_KEYS.orders.list,
    queryFn: ordersApi.list,
    enabled: isAuthenticated && isEnabled,
  });
}

/** The seller's received orders (Sales). */
export function useSales(isEnabled = true) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: QUERY_KEYS.orders.sales,
    queryFn: ordersApi.listSales,
    enabled: isAuthenticated && isEnabled,
  });
}

export function useOrder(id: string) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: QUERY_KEYS.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: isAuthenticated && Boolean(id),
  });
}
