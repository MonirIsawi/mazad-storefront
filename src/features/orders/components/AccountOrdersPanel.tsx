'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Card, InitialTile, Price, SectionHeader, SeeAllLink } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { useOrders } from '../hooks/useOrders';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { orderStoreName } from '../lib/order-display';
import { isOpenOrder } from '../lib/order-status';
import { OrderStatusBadge } from './OrderStatusBadge';

/** The account screen's desktop column: the orders still on their way, newest first. */
export function AccountOrdersPanel() {
  const { t, isReady } = useOrdersTranslation();
  const { locale } = useLocale();
  const orders = useOrders();
  if (!isReady || !orders.data) return null;
  const open = orders.data.pages.flat().filter(isOpenOrder).slice(0, 4);

  return (
    <Card isInset className="grid gap-3">
      <SectionHeader
        title={t('card.openOrders')}
        action={<SeeAllLink href={ROUTES.orders}>{t('card.seeAll')}</SeeAllLink>}
      />
      {open.length === 0 ? (
        <p className="py-4 text-sm text-foreground-soft">{t('card.noOpen')}</p>
      ) : (
        <ul className="grid">
          {open.map((order) => (
            <li key={order.id} className="border-t border-border first:border-t-0">
              <Link href={ROUTES.orderDetail(order.id)} className="flex items-center gap-3 py-3">
                <InitialTile name={orderStoreName(order, locale)} size={44} />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-medium">{orderStoreName(order, locale)}</span>
                  <span
                    dir="ltr"
                    className="justify-self-start font-tabular text-xs text-muted-foreground"
                  >
                    {order.orderNumber}
                  </span>
                </span>
                <OrderStatusBadge status={order.status} />
                <Price value={order.total} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
