'use client';

import { Button, Card, Icon, type IconName } from '@shared/components/ui';
import { useMoney, useSubmitGuard } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import { useAdvanceOrder } from '../../hooks/useOrderMutations';
import { useOrderPayments } from '../../hooks/usePayments';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { nextSellerStatus } from '../../lib/seller-orders';
import type { Order, OrderStatus } from '../../types/orders.types';

const NEXT_ICON: Partial<Record<OrderStatus, IconName>> = {
  CONFIRMED: 'check',
  OUT_FOR_DELIVERY: 'truck',
  DELIVERED: 'cash',
};

/**
 * The seller's one next step leads the sale (confirm → out for delivery → delivered). Delivering
 * an unpaid cash-on-delivery order records the cash as collected, so the seller confirms the exact
 * amount first: one accidental click must not mark money as received.
 */
export function SellerNextStepCard({ order }: { order: Order }) {
  const { t } = useOrdersTranslation();
  const { money } = useMoney();
  const advance = useAdvanceOrder(order.id);
  const payments = useOrderPayments(order.id);
  const guard = useSubmitGuard();
  const next = nextSellerStatus(order.status);
  if (!next) return null;
  const error = getErrorCode(advance.error);

  const deliver = (release: () => void) => {
    const isPaid = Boolean(payments.data?.paidAt);
    const question = isPaid
      ? t('sales.deliver.paidConfirm')
      : t('sales.deliver.cashConfirm', { amount: money(order.total) });
    if (!window.confirm(question)) return release();
    advance.mutate(
      { status: 'DELIVERED', cashReceived: isPaid ? undefined : Number(order.total) },
      { onSettled: release },
    );
  };
  const icon = NEXT_ICON[next];

  return (
    <Card isInset tone="gold" className="grid gap-3.5">
      <span className="text-sm text-foreground-soft">{t('view.nextStep')}</span>
      <h2 className="text-h2 font-medium text-foreground">{t(`nextTitle.${order.status}`)}</h2>
      <p className="text-[15px] leading-[1.7] text-foreground-soft">
        {t(`sales.nextHint.${order.status}`)}
      </p>
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${error}`, { defaultValue: t('errors.INVALID_ORDER_TRANSITION') })}
        </p>
      ) : null}
      <Button
        className="lg:justify-self-start"
        isLoading={advance.isPending}
        onClick={() =>
          guard((release) =>
            next === 'DELIVERED'
              ? deliver(release)
              : advance.mutate({ status: next }, { onSettled: release }),
          )
        }
        data-testid="sale-next-step"
      >
        {icon && !advance.isPending ? <Icon name={icon} size={20} /> : null}
        {t(`sales.next.${next}`)}
      </Button>
    </Card>
  );
}
