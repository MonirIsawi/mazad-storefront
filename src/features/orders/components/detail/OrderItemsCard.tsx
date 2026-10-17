'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Icon, InitialTile } from '@shared/components/ui';
import { useApiFeature, useLocale } from '@shared/hooks';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { orderStoreName } from '../../lib/order-display';
import type { Order } from '../../types/orders.types';
import { DetailCard } from './DetailCard';
import { OrderItemRow } from './OrderItemRow';

/**
 * What was bought, from which store. The buyer of a delivered order can open a return on an item
 * (returns open for 7 days after delivery); "Problem with this order?" only while the API takes
 * support reports.
 */
export function OrderItemsCard({ order, isSeller }: { order: Order; isSeller: boolean }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const hasReports = useApiFeature('supportReports') === true;
  const storeName = orderStoreName(order, locale);
  const canReturn = !isSeller && order.status === 'DELIVERED';

  return (
    <DetailCard title={t('detail.items')}>
      <div className="flex items-center gap-2.5 text-[13px] text-foreground-soft">
        <InitialTile name={storeName} size={32} />
        <span>{storeName}</span>
      </div>
      <div id="order-items" className="grid gap-3.5">
        {order.items.map((item) => (
          <OrderItemRow
            key={item.id}
            orderId={order.id}
            item={item}
            isSeller={isSeller}
            canReturn={canReturn}
          />
        ))}
      </div>
      {canReturn ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="undo" size={15} />
          {t('returnWindow')}
        </p>
      ) : null}
      {!isSeller && hasReports ? (
        <Link
          href={ROUTES.orderProblem(order.id)}
          className="inline-flex items-center gap-1.5 justify-self-start text-[13px] font-semibold text-gold underline-offset-4 hover:underline light:text-gold-lo"
        >
          <Icon name="question" size={16} />
          {t('view.problem')}
        </Link>
      ) : null}
    </DetailCard>
  );
}
