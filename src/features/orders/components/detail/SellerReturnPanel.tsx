'use client';

import { useState } from 'react';
import { Button, Input } from '@shared/components/ui';
import { useMoney, useSubmitGuard } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import type { SellerReturnAction } from '../../api/orders.api';
import { useReturnAction } from '../../hooks/useOrderMutations';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { sellerReturnActions } from '../../lib/seller-orders';
import type { Order } from '../../types/orders.types';

type ReturnRequest = NonNullable<Order['items'][number]['returnRequest']>;

/** Seller side of a return: the buyer's reason and the actions its status allows. */
export function SellerReturnPanel({
  orderId,
  returnRequest,
  refundAmount,
}: {
  orderId: string;
  returnRequest: ReturnRequest;
  refundAmount: string;
}) {
  const { t } = useOrdersTranslation();
  const { money } = useMoney();
  const action = useReturnAction(orderId);
  const guard = useSubmitGuard();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const actions = sellerReturnActions(returnRequest.status);
  const error = getErrorCode(action.error);

  const run = (name: SellerReturnAction) =>
    guard((release) => {
      // Recording a refund can't be undone: say how much before sending it.
      const question = `${t('sales.returns.refundConfirm', { amount: money(refundAmount) })} ${t('sales.returns.refundConfirmBody')}`;
      if (name === 'refund' && !window.confirm(question)) return release();
      action.mutate({ returnId: returnRequest.id, action: name }, { onSettled: release });
    });

  const reject = () =>
    guard((release) =>
      action.mutate(
        { returnId: returnRequest.id, action: 'reject', reason: reason.trim() },
        { onSuccess: () => setIsRejecting(false), onSettled: release },
      ),
    );

  return (
    <div className="grid gap-2.5 rounded-lg bg-surface-raised p-3.5">
      {returnRequest.reason ? (
        <p className="text-[13px] text-foreground-soft">
          {t('sales.returns.reason')}: {returnRequest.reason}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${error}`, { defaultValue: t('errors.INVALID_RETURN_TRANSITION') })}
        </p>
      ) : null}
      {isRejecting ? (
        <>
          <Input
            label={t('sales.returns.rejectReason')}
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="dangerLine"
              disabled={!reason.trim()}
              isLoading={action.isPending}
              onClick={reject}
            >
              {t('sales.returns.rejectSubmit')}
            </Button>
            <Button variant="plain" size="sm" onClick={() => setIsRejecting(false)}>
              {t('sales.returns.back')}
            </Button>
          </div>
        </>
      ) : actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((name) =>
            name === 'reject' ? (
              <Button key={name} variant="plain" size="sm" onClick={() => setIsRejecting(true)}>
                {t('sales.returns.reject')}
              </Button>
            ) : (
              <Button
                key={name}
                size="sm"
                variant="line"
                isLoading={action.isPending && action.variables?.action === name}
                data-testid={`sale-return-${name}`}
                onClick={() => run(name)}
              >
                {t(`sales.returns.${name}`)}
              </Button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
