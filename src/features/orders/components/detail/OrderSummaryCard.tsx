'use client';

import { KeyValueList, Price } from '@shared/components/ui';
import { useOrderPaymentLabel } from '../../hooks/useOrderPaymentLabel';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import type { Order } from '../../types/orders.types';
import { DetailCard } from './DetailCard';

/**
 * Items, delivery and the total in gold (design `.kv`), and how it is paid ("Cash on delivery ·
 * Not paid yet") from the order's own payment records. The seller reads the total as the cash to
 * collect on delivery.
 */
export function OrderSummaryCard({ order, isSeller }: { order: Order; isSeller: boolean }) {
  const { t } = useOrdersTranslation();
  const payment = useOrderPaymentLabel(order);
  const rows = [
    {
      key: 'subtotal',
      label: t('detail.subtotal'),
      value: <Price value={order.subtotal} size="sm" />,
    },
    {
      key: 'delivery',
      label: t('detail.deliveryFee'),
      value: <Price value={order.deliveryFee} size="sm" />,
    },
    {
      key: 'total',
      label: t('detail.total'),
      value: <Price value={order.total} size="lg" tone="gold" />,
      isTotal: true,
    },
  ];

  return (
    <DetailCard title={t('view.summary')}>
      <KeyValueList rows={rows} />
      {payment ? (
        <div
          className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm"
          data-testid="order-payment-summary"
        >
          <span className="text-foreground-soft">{t('payment.methodLabel')}</span>
          <span className="text-end font-medium text-foreground">
            {payment.method} · {payment.status}
          </span>
        </div>
      ) : null}
      {isSeller && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' ? (
        <p className="text-xs text-muted-foreground">{t('view.collect')}</p>
      ) : null}
    </DetailCard>
  );
}
