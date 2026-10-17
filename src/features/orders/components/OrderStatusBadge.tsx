'use client';

import { Badge } from '@shared/components/ui';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { ORDER_STATUS_BADGE } from '../lib/order-status';
import type { OrderStatus } from '../types/orders.types';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useOrdersTranslation();
  const badge = ORDER_STATUS_BADGE[status];
  return (
    <Badge tone={badge.tone} icon={badge.icon}>
      {t(`status.${status}`)}
    </Badge>
  );
}
