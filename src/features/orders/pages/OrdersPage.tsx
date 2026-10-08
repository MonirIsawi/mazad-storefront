'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Card, Icon, Skeleton } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDate, joinList, pickLocalizedName } from '@shared/lib';
import { useOrders, useSales } from '../hooks/useOrders';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import type { Order, OrderStatus } from '../types/orders.types';

const STATUS_TONE: Record<OrderStatus, 'live' | 'upcoming' | 'warning' | 'neutral'> = {
  CREATED: 'upcoming',
  CONFIRMED: 'upcoming',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'live',
  CANCELLED: 'neutral',
};

export type OrdersMode = 'buyer' | 'seller';

/**
 * The buyer's orders, or (mode "seller", the Selling hub's "Orders received") the orders other
 * people placed on the seller's auctions: GET /me/sales, same rows with the buyer's name.
 */
export function OrdersPage({ mode = 'buyer' }: { mode?: OrdersMode }) {
  const { t, isReady } = useOrdersTranslation();
  const isSeller = mode === 'seller';
  // Only the list on screen is fetched.
  const buyerOrders = useOrders(!isSeller);
  const sales = useSales(isSeller);
  const orders = isSeller ? sales : buyerOrders;

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader
        title={t(isSeller ? 'sales.title' : 'page.title')}
        backHref={isSeller ? ROUTES.selling : ROUTES.account}
      />

      <div className="flex flex-col gap-3 px-gutter pb-6">
        {orders.isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-24 w-full" />
          ))
        ) : orders.isError ? (
          <ErrorState onRetry={() => void orders.refetch()} />
        ) : orders.data.length === 0 ? (
          isSeller ? (
            <EmptyState icon="package" title={t('sales.emptyTitle')} message={t('sales.empty')} />
          ) : (
            <EmptyState icon="package" title={t('page.emptyTitle')} message={t('page.empty')} />
          )
        ) : (
          orders.data.map((order) => <OrderRow key={order.id} order={order} mode={mode} />)
        )}
      </div>
    </>
  );
}

/** Seller route: the received orders. */
export function SalesPage() {
  return <OrdersPage mode="seller" />;
}

function OrderRow({ order, mode }: { order: Order; mode: OrdersMode }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money, number } = useMoney();
  const isSeller = mode === 'seller';

  return (
    <Link href={isSeller ? ROUTES.saleDetail(order.id) : ROUTES.orderDetail(order.id)}>
      <Card
        isInset
        className="flex flex-col gap-2 transition-transform duration-fast ease-ios active:scale-[0.985]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-subhead font-semibold text-foreground">
            {isSeller
              ? `${t('sales.buyer')}: ${order.customer?.fullName ?? '—'}`
              : pickLocalizedName(order.store, locale)}
          </span>
          <Badge tone={STATUS_TONE[order.status]} hasDot={order.status === 'OUT_FOR_DELIVERY'}>
            {t(`status.${order.status}`)}
          </Badge>
        </div>

        <p className="truncate text-footnote text-muted-foreground">
          {joinList(
            order.items.slice(0, 2).map((item) => pickLocalizedName(item.product, locale)),
            locale,
          )}
          {order.items.length > 2 ? ' …' : ''}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
            <Icon name="package" size={14} />
            {number(order.items.length)}
            <span className="mx-1">·</span>
            {formatDate(order.createdAt, locale)}
          </span>
          <span className="text-callout font-bold text-foreground tabular-nums">
            {money(order.total)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
