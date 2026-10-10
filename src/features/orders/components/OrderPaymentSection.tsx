'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardContent, Icon, SectionHeader } from '@shared/components/ui';
import { useMoney, useSubmitGuard } from '@shared/hooks';
import { cn, getErrorCode } from '@shared/lib';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import {
  isAwaitingConfirmation,
  useOrderPayments,
  usePaymentMethods,
  useStartSwiftPay,
} from '../hooks/usePayments';
import type { OrderPayments } from '../schemas/payments.schema';
import type { Order, OrderStatus } from '../types/orders.types';

/** Orders the buyer may still pay electronically (mazad-api's PAYABLE_ORDER_STATUSES). */
const PAYABLE: OrderStatus[] = ['CREATED', 'CONFIRMED', 'OUT_FOR_DELIVERY'];

type PaymentState =
  | 'paid'
  | 'paidCash'
  | 'refunded'
  | 'partiallyRefunded'
  | 'awaiting'
  | 'failed'
  | 'unpaid';

/** What the order's payments add up to, from the server's records only. */
export function paymentStateOf(data: OrderPayments | undefined): PaymentState {
  if (!data) return 'unpaid';
  const settling = data.payments.find((payment) => payment.id === data.paidPaymentId);
  if (settling) {
    if (settling.status === 'REFUNDED') return 'refunded';
    if (settling.status === 'PARTIALLY_REFUNDED') return 'partiallyRefunded';
    return settling.method === 'SWIFTPAY' ? 'paid' : 'paidCash';
  }
  if (isAwaitingConfirmation(data)) return 'awaiting';
  const latest = data.payments.find((payment) => payment.method === 'SWIFTPAY');
  if (latest?.status === 'FAILED') return 'failed';
  return 'unpaid';
}

const STATE_TONE: Record<PaymentState, 'live' | 'upcoming' | 'warning' | 'neutral'> = {
  paid: 'live',
  paidCash: 'live',
  refunded: 'neutral',
  partiallyRefunded: 'neutral',
  awaiting: 'warning',
  failed: 'warning',
  unpaid: 'upcoming',
};

/**
 * The order's payment: the buyer picks cash on delivery (the default, nothing to do) or
 * electronic payment through SwiftPayIQ's hosted page, then sees it confirmed, failed or
 * refunded. The seller sees whether to collect cash. Nothing here marks an order paid: only
 * mazad-api does, after SwiftPayIQ's signed webhook.
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
  const isTestMode = swiftpay?.mode === 'test';

  if (mode === 'seller') {
    const line =
      state === 'paid'
        ? t('payment.seller.paid')
        : state === 'refunded' || state === 'partiallyRefunded'
          ? t('payment.seller.refunded')
          : state === 'paidCash'
            ? t('payment.state.paidCash')
            : t('payment.seller.cod');
    return (
      <section>
        <SectionHeader title={t('payment.title')} />
        <Card isInset className="flex items-start gap-3" data-testid="order-payment">
          <Icon name="credit-card" size={20} className="mt-0.5 shrink-0 text-foreground-soft" />
          <p className="text-subhead text-foreground">{line}</p>
        </Card>
      </section>
    );
  }

  const canPayOnline =
    Boolean(swiftpay?.enabled) && !payments.data.paidAt && PAYABLE.includes(order.status);
  const error = getErrorCode(start.error);

  const openCheckout = () =>
    guard((release) =>
      start.mutate(undefined, {
        onSuccess: () => setOpened(true),
        onSettled: release,
      }),
    );

  return (
    <section>
      <SectionHeader title={t('payment.title')} />
      <Card data-testid="order-payment">
        <CardContent className="flex flex-col gap-3 text-subhead">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{t('payment.amountDue')}</span>
            <span className="font-bold text-foreground tabular-nums">{money(order.total)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{t('payment.methodLabel')}</span>
            <Badge tone={STATE_TONE[state]} hasDot={state === 'awaiting'}>
              {t(`payment.state.${state}`)}
            </Badge>
          </div>

          {state === 'paid' ? (
            <p className="text-footnote text-foreground-soft">{t('payment.state.paidHint')}</p>
          ) : null}

          {state === 'awaiting' ? (
            <>
              <p className="text-footnote text-foreground-soft" role="status">
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

          {state === 'failed' ? (
            <p className="text-footnote text-foreground-soft">{t('payment.state.failedHint')}</p>
          ) : null}

          {canPayOnline && state !== 'awaiting' ? (
            <fieldset className="flex flex-col gap-2" data-testid="payment-choice">
              <legend className="sr-only">{t('payment.methodLabel')}</legend>
              <MethodOption
                checked={choice === 'cod'}
                onSelect={() => setChoice('cod')}
                title={t('payment.cod')}
                hint={t('payment.codHint')}
              />
              <MethodOption
                checked={choice === 'swiftpay'}
                onSelect={() => setChoice('swiftpay')}
                title={t('payment.swiftpay')}
                hint={t('payment.swiftpayHint')}
              />
              {choice === 'swiftpay' ? (
                <>
                  {isTestMode ? (
                    <p className="text-footnote font-semibold text-warning">{t('payment.testMode')}</p>
                  ) : null}
                  <Button
                    size="lg"
                    isFullWidth
                    hasShadow
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
            <p role="alert" className="text-footnote text-destructive">
              {t(`payment.errors.${error ?? 'generic'}`, {
                defaultValue: t('payment.errors.generic'),
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function MethodOption({
  checked,
  onSelect,
  title,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border p-3',
        checked ? 'border-primary bg-primary-tint' : 'border-border',
      )}
    >
      <input
        type="radio"
        name="payment-method"
        className="mt-1 accent-primary"
        checked={checked}
        onChange={onSelect}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-footnote text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
