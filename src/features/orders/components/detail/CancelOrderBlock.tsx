'use client';

import { Button } from '@shared/components/ui';
import { useSubmitGuard } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import { useCancelOrder } from '../../hooks/useOrderMutations';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import type { Order } from '../../types/orders.types';

/**
 * The buyer's cancel, only where the product allows it: mazad-api accepts a buyer cancellation
 * while the order is still CREATED, so nothing is offered once the seller confirmed.
 */
export function CancelOrderBlock({ order }: { order: Order }) {
  const { t } = useOrdersTranslation();
  const cancelOrder = useCancelOrder(order.id);
  const guard = useSubmitGuard();
  const error = getErrorCode(cancelOrder.error);

  return (
    <>
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${error}`, { defaultValue: t('errors.ORDER_STATUS_INVALID') })}
        </p>
      ) : null}
      {order.status === 'CREATED' ? (
        <Button
          variant="dangerLine"
          isFullWidth
          isLoading={cancelOrder.isPending}
          onClick={() => {
            guard((release) => {
              if (!window.confirm(t('actions.cancelConfirm'))) return release();
              cancelOrder.mutate(undefined, { onSettled: release });
            });
          }}
        >
          {t('actions.cancel')}
        </Button>
      ) : null}
    </>
  );
}

/** Who cancelled, and why, under a cancelled order. */
export function CancelledNote({ order }: { order: Order }) {
  const { t } = useOrdersTranslation();
  if (order.status !== 'CANCELLED') return null;
  return (
    <div
      className="grid gap-1 rounded-lg bg-destructive-soft px-4 py-3.5 text-sm text-destructive"
      data-testid="order-cancelled-by"
    >
      {order.cancelledBy ? <p>{t(`detail.cancelledBy.${order.cancelledBy}`)}</p> : null}
      {order.cancelReason ? (
        <p>
          {t('detail.cancelReason')}: {order.cancelReason}
        </p>
      ) : null}
    </div>
  );
}
