'use client';

import { useState } from 'react';
import { Badge, Button, Card, Icon, Price } from '@shared/components/ui';
import { useMoney, useSubmitGuard } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { useOrderPayments, usePaymentMethods, useStartSwiftPay } from '../hooks/usePayments';
import { PAYABLE, STATE_TONE, paymentStateOf, sellerPaymentLineKey } from '../lib/payment-state';
import type { Order } from '../types/orders.types';
import { PaymentMethodOption } from './PaymentMethodOption';

export { paymentStateOf, sellerPaymentLineKey } from '../lib/payment-state';

/**
 * The order's payment, the one block that needs the buyer, so it carries the gold action: cash on
 * delivery (the default, nothing to do) or electronic payment through SwiftPayIQ's hosted page,
 * then confirmed, failed or refunded. The seller sees whether to collect cash. Nothing here marks
 * an order paid: only mazad-api does, after SwiftPayIQ's signed webhook.
 */
export function OrderPaymentSection({ order, mode }: { order: Order; mode: 'buyer' | 'seller' }) {
  const { t } = useOrdersTranslation();
  const { money } = useMoney();
  const payments = useOrderPayments(order.id);
  const methods = usePaymentMethods();
  const start = useStartSwiftPay(order.id);
  const guard = useSubmitGuard();
  const [choice, setChoice] = useState<'cod' | 'swiftpay'>('cod');
  const [opened, setOpened] = useState(false);

  if (!payments.data) return null;
  const state = paymentStateOf(payments.data);
  const swiftpay = methods.data?.swiftpay;

  if (mode === 'seller') {
    const lineKey = sellerPaymentLineKey(state, order.status);
    if (!lineKey) return null;
    return (
      <Card isInset className="flex items-start gap-3" data-testid="order-payment">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-[14px] border bg-tile"
        >
          <Icon name="cash" tone="gold" size={24} />
        </span>
        <div className="grid gap-0.5">
          <h2 className="font-medium text-foreground">{t('payment.title')}</h2>
          <p className="text-[13px] leading-[1.6] text-foreground-soft">{t(lineKey)}</p>
        </div>
      </Card>
    );
  }

  const canPayOnline =
    Boolean(swiftpay?.enabled) && !payments.data.paidAt && PAYABLE.includes(order.status);
  const error = getErrorCode(start.error);
  const openCheckout = () =>
    guard((release) =>
      start.mutate(undefined, { onSuccess: () => setOpened(true), onSettled: release }),
    );

  return (
    <Card isInset className="grid gap-3.5" data-testid="order-payment">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-medium text-foreground">{t('payment.title')}</h2>
        <Badge tone={STATE_TONE[state]} hasDot={state === 'awaiting'}>
          {t(`payment.state.${state}`)}
        </Badge>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-foreground-soft">{t('payment.amountDue')}</span>
        <Price value={order.total} size="lg" />
      </div>
      {state === 'paid' ? <Hint>{t('payment.state.paidHint')}</Hint> : null}
      {state === 'failed' ? <Hint>{t('payment.state.failedHint')}</Hint> : null}
      {state === 'awaiting' ? (
        <>
          <p className="text-[13px] leading-[1.6] text-foreground-soft" role="status">
            {opened ? t('payment.openedHint') : t('payment.state.awaitingHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" isLoading={start.isPending} onClick={openCheckout}>
              {t('payment.continue')}
            </Button>
            <Button
              size="sm"
              variant="plain"
              isLoading={payments.isFetching}
              onClick={() => void payments.refetch()}
            >
              {t('payment.refresh')}
            </Button>
          </div>
        </>
      ) : null}
      {canPayOnline && state !== 'awaiting' ? (
        <fieldset className="grid gap-2.5" data-testid="payment-choice">
          <legend className="sr-only">{t('payment.methodLabel')}</legend>
          <PaymentMethodOption
            checked={choice === 'cod'}
            onSelect={() => setChoice('cod')}
            title={t('payment.cod')}
            hint={t('payment.codHint')}
            icon="cash"
          />
          <PaymentMethodOption
            checked={choice === 'swiftpay'}
            onSelect={() => setChoice('swiftpay')}
            title={t('payment.swiftpay')}
            hint={t('payment.swiftpayHint')}
            icon="card"
          />
          {choice === 'swiftpay' ? (
            <>
              {swiftpay?.mode === 'test' ? (
                <p className="text-[13px] font-semibold text-warning">{t('payment.testMode')}</p>
              ) : null}
              <Button
                isFullWidth
                isLoading={start.isPending}
                onClick={openCheckout}
                data-testid="pay-swiftpay"
              >
                {state === 'failed'
                  ? t('payment.retry')
                  : t('payment.payNow', { amount: money(order.total) })}
              </Button>
            </>
          ) : null}
        </fieldset>
      ) : null}
      {error || start.isError ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`payment.errors.${error ?? 'generic'}`, { defaultValue: t('payment.errors.generic') })}
        </p>
      ) : null}
    </Card>
  );
}

function Hint({ children }: { children: string }) {
  return <p className="text-[13px] leading-[1.6] text-foreground-soft">{children}</p>;
}
