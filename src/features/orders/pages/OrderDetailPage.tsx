'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Icon,
  Input,
  SectionHeader,
} from '@shared/components/ui';
import { useLocale, useMoney, useSubmitGuard } from '@shared/hooks';
import { formatDateTime, getErrorCode, joinList, pickLocalizedName, telHref } from '@shared/lib';
import { useOrder } from '../hooks/useOrders';
import {
  useAdvanceOrder,
  useCancelOrder,
  useOpenReturn,
  useReturnAction,
} from '../hooks/useOrderMutations';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { OrderPaymentSection } from '../components/OrderPaymentSection';
import { nextSellerStatus, sellerReturnActions } from '../lib/seller-orders';
import type { Order, OrderStatus } from '../types/orders.types';
import type { OrdersMode } from './OrdersPage';

const STATUS_TONE: Record<OrderStatus, 'live' | 'upcoming' | 'warning' | 'neutral'> = {
  CREATED: 'upcoming',
  CONFIRMED: 'upcoming',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'live',
  CANCELLED: 'neutral',
};

/** Seller route (Sales): the same order, with the seller's actions instead of the buyer's. */
export function SaleDetailPage({ id }: { id: string }) {
  return <OrderDetailPage id={id} mode="seller" />;
}

export function OrderDetailPage({ id, mode = 'buyer' }: { id: string; mode?: OrdersMode }) {
  const { t, isReady } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const order = useOrder(id);
  const cancelOrder = useCancelOrder(id);
  const guard = useSubmitGuard();

  if (!isReady || order.isPending) return <PageLoader />;
  if (order.isError || !order.data) {
    return <ErrorState message={t('detail.notFound')} onRetry={() => void order.refetch()} />;
  }

  const data = order.data;
  const cancelError = getErrorCode(cancelOrder.error);
  const isSeller = mode === 'seller';

  return (
    <>
      <ScreenHeader
        title={`${t('detail.title')} ${data.orderNumber}`}
        backHref={isSeller ? ROUTES.sellingSales : ROUTES.orders}
      />

      <div className="flex flex-col gap-5 px-gutter pb-6">
        <Card isInset className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-title-3 font-bold text-foreground">
              {pickLocalizedName(data.store, locale)}
            </span>
            <span className="text-footnote text-muted-foreground">
              {t('detail.placedAt')} · {formatDateTime(data.createdAt, locale)}
            </span>
            {isSeller && data.customer ? (
              <span className="truncate text-footnote text-foreground-soft">
                {t('sales.buyer')}: {data.customer.fullName}
              </span>
            ) : null}
          </div>
          <Badge tone={STATUS_TONE[data.status]} hasDot={data.status === 'OUT_FOR_DELIVERY'}>
            {t(`status.${data.status}`)}
          </Badge>
        </Card>

        <section>
          <SectionHeader title={t('detail.items')} />
          <Card className="overflow-hidden">
            {data.items.map((item, index) => (
              <OrderItemRow
                key={item.id}
                orderId={data.id}
                item={item}
                mode={mode}
                isLast={index === data.items.length - 1}
                canReturn={!isSeller && data.status === 'DELIVERED'}
              />
            ))}
          </Card>
        </section>

        <section>
          <SectionHeader title={t('detail.summary')} />
          <Card>
            <CardContent className="flex flex-col gap-2 text-subhead">
              <SummaryRow label={t('detail.subtotal')} value={money(data.subtotal)} />
              <SummaryRow label={t('detail.deliveryFee')} value={money(data.deliveryFee)} />
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-separator pt-2">
                <span className="font-semibold text-foreground">{t('detail.total')}</span>
                <span className="text-title-3 font-extrabold text-foreground tabular-nums">
                  {money(data.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <OrderPaymentSection order={data} mode={mode} />

        <section>
          <SectionHeader title={t('detail.delivery')} />
          <Card>
            <CardContent className="flex flex-col gap-1.5 text-subhead">
              <p className="text-foreground">
                {joinList([data.shipCity, data.shipArea, data.shipStreet], locale)}
              </p>
              {data.shipDetails ? (
                <p className="text-muted-foreground">{data.shipDetails}</p>
              ) : null}
              {data.shipPhone ? (
                <DeliveryPhone phone={data.shipPhone} isCallable={isSeller} />
              ) : null}
              {data.note ? (
                <p className="text-muted-foreground">
                  {t('detail.note')}: {data.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>

        {data.status === 'CANCELLED' && data.cancelReason ? (
          <p className="text-footnote text-muted-foreground">
            {t('detail.cancelReason')}: {data.cancelReason}
          </p>
        ) : null}

        {isSeller ? <SellerNextStep order={data} /> : null}

        {cancelError ? (
          <p role="alert" className="text-footnote text-destructive">
            {t(`errors.${cancelError}`, { defaultValue: t('errors.ORDER_STATUS_INVALID') })}
          </p>
        ) : null}

        {/* mazad-api only allows a buyer cancellation while the order is still CREATED. */}
        {data.status === 'CREATED' ? (
          <Button
            variant="destructive"
            size="lg"
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
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function OrderItemRow({
  orderId,
  item,
  mode,
  isLast,
  canReturn,
}: {
  orderId: string;
  item: Order['items'][number];
  mode: OrdersMode;
  isLast: boolean;
  canReturn: boolean;
}) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const openReturn = useOpenReturn(orderId);
  const guard = useSubmitGuard();
  const [isOpeningReturn, setIsOpeningReturn] = useState(false);
  const [reason, setReason] = useState('');

  const returnError = getErrorCode(openReturn.error);

  return (
    <div className={isLast ? 'p-4' : 'border-b border-separator p-4'}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-subhead font-medium text-foreground">
          {pickLocalizedName(item.product, locale)}
        </span>
        <span className="shrink-0 text-callout font-bold text-foreground tabular-nums">
          {money(item.finalPrice)}
        </span>
      </div>

      {item.returnRequest ? (
        <>
          <p className="mt-2 inline-flex items-center gap-1.5 text-footnote text-muted-foreground">
            <Icon name="package" size={14} />
            {t(`returnStatus.${item.returnRequest.status}`)}
          </p>
          {mode === 'seller' ? (
            <SellerReturnPanel
              orderId={orderId}
              returnRequest={item.returnRequest}
              refundAmount={item.finalPrice}
            />
          ) : null}
        </>
      ) : canReturn ? (
        isOpeningReturn ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input
              label={t('actions.returnReason')}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            {returnError ? (
              <p role="alert" className="text-footnote text-destructive">
                {t(`errors.${returnError}`, { defaultValue: t('errors.RETURN_WINDOW_CLOSED') })}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!reason.trim()}
                isLoading={openReturn.isPending}
                onClick={() =>
                  guard((release) =>
                    openReturn.mutate(
                      { orderItemId: item.id, reason: reason.trim() },
                      { onSuccess: () => setIsOpeningReturn(false), onSettled: release },
                    ),
                  )
                }
              >
                {t('actions.returnSubmit')}
              </Button>
              <Button variant="plain" size="sm" onClick={() => setIsOpeningReturn(false)}>
                {t('actions.returnCancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="plain"
            size="sm"
            className="mt-1 -ms-3.5"
            onClick={() => setIsOpeningReturn(true)}
          >
            {t('actions.openReturn')}
          </Button>
        )
      ) : null}
    </div>
  );
}

/** The seller's one next step (confirm → out for delivery → delivered), with what it means. */
function SellerNextStep({ order }: { order: Order }) {
  const { t } = useOrdersTranslation();
  const advance = useAdvanceOrder(order.id);
  const guard = useSubmitGuard();
  const next = nextSellerStatus(order.status);
  if (!next) return null;
  const error = getErrorCode(advance.error);

  return (
    <Card isInset className="flex flex-col gap-3">
      <p className="text-subhead text-foreground-soft">{t(`sales.nextHint.${order.status}`)}</p>
      {error ? (
        <p role="alert" className="text-footnote text-destructive">
          {t(`errors.${error}`, { defaultValue: t('errors.INVALID_ORDER_TRANSITION') })}
        </p>
      ) : null}
      <Button
        size="lg"
        isFullWidth
        isLoading={advance.isPending}
        onClick={() => guard((release) => advance.mutate(next, { onSettled: release }))}
        data-testid="sale-next-step"
      >
        {t(`sales.next.${next}`)}
      </Button>
    </Card>
  );
}

/** Seller side of a return: the buyer's reason and the actions its status allows. */
function SellerReturnPanel({
  orderId,
  returnRequest,
  refundAmount,
}: {
  orderId: string;
  returnRequest: NonNullable<Order['items'][number]['returnRequest']>;
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

  return (
    <div className="mt-3 flex flex-col gap-2">
      {returnRequest.reason ? (
        <p className="text-footnote text-foreground-soft">
          {t('sales.returns.reason')}: {returnRequest.reason}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-footnote text-destructive">
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
              variant="destructive"
              disabled={!reason.trim()}
              isLoading={action.isPending}
              onClick={() =>
                guard((release) =>
                  action.mutate(
                    { returnId: returnRequest.id, action: 'reject', reason: reason.trim() },
                    { onSuccess: () => setIsRejecting(false), onSettled: release },
                  ),
                )
              }
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
                isLoading={action.isPending && action.variables?.action === name}
                data-testid={`sale-return-${name}`}
                onClick={() =>
                  guard((release) => {
                    // Recording a refund can't be undone: say how much before sending it.
                    if (
                      name === 'refund' &&
                      !window.confirm(
                        `${t('sales.returns.refundConfirm', { amount: money(refundAmount) })} ${t('sales.returns.refundConfirmBody')}`,
                      )
                    ) {
                      return release();
                    }
                    action.mutate(
                      { returnId: returnRequest.id, action: name },
                      { onSettled: release },
                    );
                  })
                }
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

/**
 * The delivery phone the buyer gave. The seller (who delivers, cash on delivery) can tap it to
 * call; the buyer sees their own number as plain text.
 */
function DeliveryPhone({ phone, isCallable }: { phone: string; isCallable: boolean }) {
  const { t } = useOrdersTranslation();
  const href = isCallable ? telHref(phone) : null;
  if (!href)
    return (
      <p className="text-muted-foreground tabular-nums" dir="ltr">
        {phone}
      </p>
    );
  return (
    <a
      href={href}
      dir="ltr"
      aria-label={`${t('sales.callBuyer')} ${phone}`}
      className="self-start font-semibold text-primary-text tabular-nums underline-offset-2 hover:underline"
    >
      {phone}
    </a>
  );
}
