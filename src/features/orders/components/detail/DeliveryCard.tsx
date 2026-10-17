'use client';

import { Icon } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { joinList, telHref } from '@shared/lib';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import type { Order } from '../../types/orders.types';
import { DetailCard } from './DetailCard';

/**
 * Where the order goes. The seller (who delivers, cash on delivery) sees the buyer and can call
 * the delivery phone the buyer gave in one tap; the buyer sees their own number as plain text.
 */
export function DeliveryCard({ order, isSeller }: { order: Order; isSeller: boolean }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const href = isSeller ? telHref(order.shipPhone) : null;

  return (
    <DetailCard title={isSeller ? t('view.buyerTitle') : t('view.deliveringTo')}>
      {isSeller && order.customer ? (
        <p className="font-medium text-foreground">
          {t('sales.buyer')}: {order.customer.fullName}
        </p>
      ) : null}
      <div className="grid gap-1 text-sm">
        <p className="text-foreground">
          {joinList([order.shipCity, order.shipArea, order.shipStreet], locale)}
        </p>
        {order.shipDetails ? <p className="text-foreground-soft">{order.shipDetails}</p> : null}
        {order.note ? (
          <p className="text-foreground-soft">
            {t('detail.note')}: {order.note}
          </p>
        ) : null}
      </div>
      {order.shipPhone ? (
        href ? (
          <a
            href={href}
            aria-label={`${t('sales.callBuyer')} ${order.shipPhone}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3.5 py-2.5"
          >
            <span dir="ltr" className="font-tabular font-semibold text-foreground">
              {order.shipPhone}
            </span>
            <span className="grid size-11 place-items-center rounded-full border border-gold-line text-gold">
              <Icon name="phone" size={20} />
            </span>
          </a>
        ) : (
          <p dir="ltr" className="justify-self-start font-tabular text-sm text-foreground-soft">
            {order.shipPhone}
          </p>
        )
      ) : isSeller ? (
        // Older orders saved none: say so, never a call link without a number, and never the
        // buyer's account phone instead.
        <p className="text-sm text-muted-foreground" data-testid="order-no-delivery-phone">
          {t('detail.noDeliveryPhone')}
        </p>
      ) : null}
    </DetailCard>
  );
}
