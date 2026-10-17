'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { ordersApi } from '../api/orders.api';
import { ORDERS_PAGE_SIZE } from '../lib/paging';
import { isOpenSale } from '../lib/seller-orders';
import { isOpenOrder } from '../lib/order-status';
import type { OrdersList, OrderStatus } from '../types/orders.types';
import { orderItemImage } from '../lib/order-display';

/** Page n+1 while the last page was full; a short (or empty) page is the end of the list. */
function nextPage(lastPage: OrdersList, allPages: OrdersList[]): number | undefined {
  return lastPage.length >= ORDERS_PAGE_SIZE ? allPages.length + 1 : undefined;
}

/** The buyer's orders, newest first, a page at a time ("Load more"). */
export function useOrders(isEnabled = true) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.orders.list,
    queryFn: ({ pageParam }) => ordersApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: isAuthenticated && isEnabled,
  });
}

/** The seller's received orders (Sales), a page at a time. */
export function useSales(isEnabled = true) {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.orders.sales,
    queryFn: ({ pageParam }) => ordersApi.listSales(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: isAuthenticated && isEnabled,
  });
}

/**
 * Received orders that still need the seller (the Selling hub count), from GET /me/sales/summary.
 * While an older API has no such route (404) or it fails, falls back to counting the first page,
 * which is what the hub showed before. Never pages through every sale to count them.
 */
export function useOpenSalesCount(): number | undefined {
  const isAuthenticated = useIsAuthenticated();
  const summary = useQuery({
    queryKey: QUERY_KEYS.orders.salesSummary,
    queryFn: ordersApi.salesSummary,
    enabled: isAuthenticated,
    retry: false,
  });
  const firstPage = useQuery({
    queryKey: QUERY_KEYS.orders.salesFirstPage,
    queryFn: () => ordersApi.listSales(1),
    enabled: isAuthenticated && summary.isError,
  });

  if (summary.data) return summary.data.open;
  return summary.isError ? firstPage.data?.filter(isOpenSale).length : undefined;
}

export function useOrder(id: string) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: QUERY_KEYS.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

/**
 * The buyer's orders still on their way, counted from the first page the list already loads (50
 * newest). Undefined while loading; never pages through every order to count them.
 */
export function useOpenOrdersCount(): number | undefined {
  const orders = useOrders();
  return orders.data?.pages[0]?.filter(isOpenOrder).length;
}

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  /** The photo of each won item in the order, by the win it came from. */
  imageByWin: Record<string, string | null>;
}

/**
 * The buyer's orders (first page) by id, for screens that only hold an order id (My wins shows
 * the order each win created). Undefined while loading.
 */
export function useOrderSummaries(): Record<string, OrderSummary> | undefined {
  const orders = useOrders();
  const first = orders.data?.pages[0];
  if (!first) return undefined;
  return Object.fromEntries(
    first.map((order) => [
      order.id,
      {
        orderNumber: order.orderNumber,
        status: order.status,
        imageByWin: Object.fromEntries(
          order.items.flatMap((item) =>
            item.win ? [[item.win.id, orderItemImage(item, 'thumb')] as const] : [],
          ),
        ),
      },
    ]),
  );
}
