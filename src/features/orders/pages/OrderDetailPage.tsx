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
import { useLocale, useMoney } from '@shared/hooks';
import { formatDateTime, getErrorCode, pickLocalizedName } from '@shared/lib';
import { useOrder } from '../hooks/useOrders';
import { useCancelOrder, useOpenReturn } from '../hooks/useOrderMutations';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import type { Order, OrderStatus } from '../types/orders.types';

const STATUS_TONE: Record<OrderStatus, 'live' | 'upcoming' | 'warning' | 'neutral'> = {
  CREATED: 'upcoming',
  CONFIRMED: 'upcoming',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'live',
  CANCELLED: 'neutral',
};

export function OrderDetailPage({ id }: { id: string }) {
  const { t, isReady } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const order = useOrder(id);
  const cancelOrder = useCancelOrder(id);

  if (!isReady || order.isPending) return <PageLoader />;
  if (order.isError || !order.data) {
    return <ErrorState message={t('detail.notFound')} onRetry={() => void order.refetch()} />;
  }

  const data = order.data;
  const cancelError = getErrorCode(cancelOrder.error);

  return (
    <>
      <ScreenHeader title={`${t('detail.title')} ${data.orderNumber}`} backHref={ROUTES.orders} />

      <div className="flex flex-col gap-5 px-gutter pb-6">
        <Card isInset className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-title-3 font-bold text-foreground">
              {pickLocalizedName(data.store, locale)}
            </span>
            <span className="text-footnote text-muted-foreground">
              {t('detail.placedAt')} · {formatDateTime(data.createdAt, locale)}
            </span>
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
                isLast={index === data.items.length - 1}
                canReturn={data.status === 'DELIVERED'}
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

        <section>
          <SectionHeader title={t('detail.delivery')} />
          <Card>
            <CardContent className="flex flex-col gap-1.5 text-subhead">
              <p className="text-foreground">
                {[data.shipCity, data.shipArea, data.shipStreet].filter(Boolean).join('، ')}
              </p>
              {data.shipDetails ? (
                <p className="text-muted-foreground">{data.shipDetails}</p>
              ) : null}
              {data.shipPhone ? (
                <p className="text-muted-foreground tabular-nums">{data.shipPhone}</p>
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
              if (window.confirm(t('actions.cancelConfirm'))) cancelOrder.mutate(undefined);
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
  isLast,
  canReturn,
}: {
  orderId: string;
  item: Order['items'][number];
  isLast: boolean;
  canReturn: boolean;
}) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const openReturn = useOpenReturn(orderId);
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
        <p className="mt-2 inline-flex items-center gap-1.5 text-footnote text-muted-foreground">
          <Icon name="package" size={14} />
          {t(`returnStatus.${item.returnRequest.status}`)}
        </p>
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
                  openReturn.mutate(
                    { orderItemId: item.id, reason: reason.trim() },
                    { onSuccess: () => setIsOpeningReturn(false) },
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
