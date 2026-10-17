'use client';

import { Icon } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { cn, formatDateTime } from '@shared/lib';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { orderTimeline, type TimelineStep } from '../../lib/order-status';
import type { Order } from '../../types/orders.types';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { DetailCard } from './DetailCard';

/** Where the order is (design `.tline`): done steps in gold, the current one ringed. */
export function OrderTimelineCard({ order, isSeller }: { order: Order; isSeller: boolean }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const isWin = order.items.some((item) => item.win);

  const label = (step: TimelineStep) => {
    if (step.key === 'created') return t(isWin && !isSeller ? 'timeline.won' : 'timeline.created');
    if (step.key === 'confirmed')
      return t(isSeller ? 'timeline.confirmedSeller' : 'timeline.confirmed');
    return t(`timeline.${step.key}`);
  };
  const when = (step: TimelineStep) => {
    if (step.at) return formatDateTime(step.at, locale);
    if (step.state === 'current' && step.key === 'shipped' && isSeller)
      return t('timeline.waitingCourier');
    return null;
  };

  return (
    <DetailCard title={t('timeline.title')} trailing={<OrderStatusBadge status={order.status} />}>
      <ol className="grid">
        {orderTimeline(order).map((step, index, all) => (
          <li
            key={step.key}
            className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-[18px] last:pb-0"
          >
            {index < all.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute start-[13px] top-7 bottom-0 w-0.5',
                  step.state === 'done' ? 'bg-gold' : 'bg-border-strong',
                )}
              />
            ) : null}
            <span
              aria-hidden
              className={cn(
                'grid size-7 place-items-center rounded-full',
                step.state === 'done' && 'bg-grad text-gold-ink',
                step.state === 'current' &&
                  'border-[1.5px] border-gold text-gold shadow-[0_0_0_5px_var(--color-gold-soft)]',
                step.state === 'todo' &&
                  'border-[1.5px] border-border-strong bg-surface-raised text-muted-foreground',
                step.key === 'cancelled' && 'bg-destructive-soft bg-none text-destructive',
              )}
            >
              <Icon name={step.icon} size={14} />
            </span>
            <span className="grid gap-0.5">
              <span
                className={cn(
                  'text-[14.5px] font-medium',
                  step.state === 'todo' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {label(step)}
              </span>
              {when(step) ? (
                <span className="text-xs text-muted-foreground">{when(step)}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </DetailCard>
  );
}
