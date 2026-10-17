'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { SegmentedControl } from '@shared/components/ios';
import { Button, Skeleton } from '@shared/components/ui';
import { OrderCard } from '../components/OrderCard';
import { useOrders, useSales } from '../hooks/useOrders';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { isOpenOrder } from '../lib/order-status';
import type { Order } from '../types/orders.types';

export type OrdersMode = 'buyer' | 'seller';
type Filter = 'all' | 'open' | 'done';

const FILTERS: Record<Filter, (order: Order) => boolean> = {
  all: () => true,
  open: isOpenOrder,
  done: (order) => !isOpenOrder(order),
};

/**
 * The buyer's orders, one card per store order with status, total and payment state, or (mode
 * "seller", the Selling hub's incoming orders) GET /me/sales with the buyer and the next step the
 * seller owes. Newest first; no cart exists, a win or a buy-now creates the order.
 */
export function OrdersPage({ mode = 'buyer' }: { mode?: OrdersMode }) {
  const { t, isReady } = useOrdersTranslation();
  const isSeller = mode === 'seller';
  const [filter, setFilter] = useState<Filter>('all');
  // Only the list on screen is fetched.
  const buyerOrders = useOrders(!isSeller);
  const sales = useSales(isSeller);
  const orders = isSeller ? sales : buyerOrders;
  const list = orders.data?.pages.flat() ?? [];
  const shown = list.filter(FILTERS[filter]);

  if (!isReady) return <PageLoader />;

  const title = t(isSeller ? 'sales.title' : 'page.title');
  return (
    <>
      <ScreenHeader
        title={title}
        backHref={isSeller ? ROUTES.selling : ROUTES.account}
        crumbs={[
          isSeller
            ? { label: t('sales.hub'), href: ROUTES.selling }
            : { label: t('page.account'), href: ROUTES.account },
        ]}
      />
      <PageContainer className="grid gap-4 pb-10">
        {list.length > 0 ? (
          <SegmentedControl
            label={t('filters.label')}
            value={filter}
            onChange={setFilter}
            className="max-w-[420px]"
            segments={(['all', 'open', 'done'] as const).map((id) => ({
              id,
              label: t(`filters.${id}`),
            }))}
          />
        ) : null}
        {orders.isPending ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} radius="lg" className="h-52 w-full" />
            ))}
          </div>
        ) : orders.isError ? (
          <ErrorState onRetry={() => void orders.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="package"
            title={t(isSeller ? 'sales.emptyTitle' : 'page.emptyTitle')}
            message={t(isSeller ? 'sales.empty' : 'page.empty')}
          />
        ) : (
          <>
            {shown.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground-soft">
                {t(filter === 'open' ? 'filters.emptyOpen' : 'filters.emptyDone')}
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                {shown.map((order) => (
                  <OrderCard key={order.id} order={order} isSeller={isSeller} />
                ))}
              </div>
            )}
            {/* The next page, on request: older orders are never cut off at the first 50. */}
            {orders.hasNextPage ? (
              <Button
                variant="soft"
                isFullWidth
                isLoading={orders.isFetchingNextPage}
                onClick={() => void orders.fetchNextPage()}
                data-testid="orders-load-more"
              >
                {t('list.loadMore')}
              </Button>
            ) : null}
          </>
        )}
      </PageContainer>
    </>
  );
}

/** Seller route: the received orders. */
export function SalesPage() {
  return <OrdersPage mode="seller" />;
}
