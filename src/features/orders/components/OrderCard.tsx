'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Badge, Icon, InitialTile, Price } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useOrderPaymentLabel } from '../hooks/useOrderPaymentLabel';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { orderItemImage, orderItemName, orderStoreName } from '../lib/order-display';
import { nextSellerStatus } from '../lib/seller-orders';
import { rateableItem } from '../lib/review-rules';
import type { Order } from '../types/orders.types';
import { OrderItemImage } from './OrderItemImage';
import { OrderStatusBadge } from './OrderStatusBadge';

/**
 * One order (design `.ord`): the store (or, for the seller, the buyer) with the order number in
 * Latin digits and the date, the status, the items as bought, how it is paid and the total.
 */
export function OrderCard({ order, isSeller = false }: { order: Order; isSeller?: boolean }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const payment = useOrderPaymentLabel(order);
  const [first] = order.items;
  const name = first ? orderItemName(first, locale) : '—';
  const more = order.items.length - 1;
  const itemPrice = more > 0 ? order.subtotal : (first?.display?.finalPrice ?? first?.finalPrice);
  const storeName = orderStoreName(order, locale);
  const next = isSeller ? nextSellerStatus(order.status) : null;
  const canRate = !isSeller && rateableItem(order.items)?.canReview === true;

  return (
    <Link
      href={isSeller ? ROUTES.saleDetail(order.id) : ROUTES.orderDetail(order.id)}
      className="grid gap-3.5 rounded-xl border border-border bg-surface p-[18px] transition-[border-color] duration-fast ease-ios hover:border-border-strong"
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <InitialTile
            name={isSeller ? (order.customer?.fullName ?? storeName) : storeName}
            size={40}
          />
          <span className="grid min-w-0">
            <span className="truncate font-medium text-foreground">
              {isSeller ? `${t('sales.buyer')}: ${order.customer?.fullName ?? '—'}` : storeName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              <span dir="ltr" className="font-tabular">
                {order.orderNumber}
              </span>{' '}
              · {formatDate(order.createdAt, locale)}
            </span>
          </span>
        </span>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-3">
        <OrderItemImage
          src={first ? orderItemImage(first, 'thumb') : null}
          alt={name}
          sizePx={64}
        />
        <span className="grid min-w-0 gap-1">
          <span
            className="line-clamp-2 text-[14.5px] leading-[1.4] font-medium text-foreground"
            data-testid="order-row-name"
          >
            {name}
            {more > 0 ? ` ${t('list.more', { count: more })}` : null}
          </span>
          <span className="truncate font-tabular text-xs text-muted-foreground">
            {t(more > 0 ? 'list.itemsAndDelivery' : 'list.itemAndDelivery', {
              item: money(itemPrice),
              delivery: money(order.deliveryFee),
            })}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-foreground-soft">
          <span data-testid="order-row-payment">{payment?.method ?? null}</span>
          {payment ? <span className="text-muted-foreground">· {payment.status}</span> : null}
          {canRate ? (
            <Badge tone="gold" icon="star" isIconFilled>
              {t('card.rate')}
            </Badge>
          ) : null}
          {next ? (
            <Badge tone="gold">{t('card.next', { step: t(`sales.next.${next}`) })}</Badge>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Price value={order.total} size="md" />
          <Icon name="caret-left" size={17} className="text-muted-foreground ltr:-scale-x-100" />
        </span>
      </div>
    </Link>
  );
}
