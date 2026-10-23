'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { supportApi } from '../api/support.api';
import type { ReportOrder } from '../schemas/support.schema';

/**
 * The orders the picker offers: my recent orders, plus the one the form was opened from when it
 * isn't among them (an older order, or a sale). An order that can't be read is simply not offered.
 */
export function useReportOrders(linkedOrderId?: string) {
  const list = useQuery({ queryKey: QUERY_KEYS.support.orders, queryFn: supportApi.myOrders });
  const isListed = Boolean(list.data?.some((order) => order.id === linkedOrderId));
  const linked = useQuery({
    queryKey: QUERY_KEYS.support.order(linkedOrderId ?? ''),
    queryFn: () => supportApi.order(linkedOrderId ?? ''),
    enabled: Boolean(linkedOrderId) && list.isSuccess && !isListed,
    retry: false,
  });
  const orders: ReportOrder[] = [...(linked.data ? [linked.data] : []), ...(list.data ?? [])];
  return {
    orders,
    isLoading: list.isPending || linked.isFetching,
    /** The linked order once known (null when it can't be found among my orders). */
    linkedOrder: orders.find((order) => order.id === linkedOrderId) ?? null,
    isLinkedSettled:
      !linkedOrderId || isListed || linked.isSuccess || linked.isError || list.isError,
  };
}
