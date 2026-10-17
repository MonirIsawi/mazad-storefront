'use client';

import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { useOrder } from '../hooks/useOrders';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import { OrderPaymentSection } from '../components/OrderPaymentSection';
import { OrderTimelineCard } from '../components/detail/OrderTimelineCard';
import { OrderItemsCard } from '../components/detail/OrderItemsCard';
import { DeliveryCard } from '../components/detail/DeliveryCard';
import { OrderSummaryCard } from '../components/detail/OrderSummaryCard';
import { SellerNextStepCard } from '../components/detail/SellerNextStepCard';
import { OrderHelpCard } from '../components/detail/OrderHelpCard';
import { CancelOrderBlock, CancelledNote } from '../components/detail/CancelOrderBlock';
import { RatingCard } from '../components/rating/RatingCard';
import type { OrdersMode } from './OrdersPage';

/** Seller route (Sales): the same order, with the seller's actions instead of the buyer's. */
export function SaleDetailPage({ id }: { id: string }) {
  return <OrderDetailPage id={id} mode="seller" />;
}

/**
 * One order. Buyer: the rating card leads a delivered order, then the timeline, the items and
 * where it goes; the payment block (the one thing that needs them) sits beside it with the gold
 * action. Seller: the next step leads, the buyer's phone is one tap, cash is recorded at delivery.
 */
export function OrderDetailPage({ id, mode = 'buyer' }: { id: string; mode?: OrdersMode }) {
  const { t, isReady } = useOrdersTranslation();
  const order = useOrder(id);

  if (!isReady || order.isPending) return <PageLoader />;
  if (order.isError || !order.data) {
    return <ErrorState message={t('detail.notFound')} onRetry={() => void order.refetch()} />;
  }

  const data = order.data;
  const isSeller = mode === 'seller';
  const hasOpenReturnChoice =
    !isSeller && data.status === 'DELIVERED' && data.items.some((item) => !item.returnRequest);

  return (
    <>
      <ScreenHeader
        title={`${t('detail.title')} ${data.orderNumber}`}
        backHref={isSeller ? ROUTES.sellingSales : ROUTES.orders}
        crumbs={[
          isSeller
            ? { label: t('sales.title'), href: ROUTES.sellingSales }
            : { label: t('page.title'), href: ROUTES.orders },
        ]}
      />
      <PageContainer className="pb-12">
        <TwoColumns
          main={
            <>
              {isSeller ? <SellerNextStepCard order={data} /> : <RatingCard order={data} />}
              {isSeller ? null : <OrderTimelineCard order={data} isSeller={false} />}
              <OrderItemsCard order={data} isSeller={isSeller} />
              {isSeller ? <OrderTimelineCard order={data} isSeller /> : null}
              {isSeller ? null : <DeliveryCard order={data} isSeller={false} />}
              <CancelledNote order={data} />
            </>
          }
          aside={
            <>
              {isSeller ? <DeliveryCard order={data} isSeller /> : null}
              <OrderSummaryCard order={data} isSeller={isSeller} />
              <OrderPaymentSection order={data} mode={mode} />
              {hasOpenReturnChoice ? <OrderHelpCard orderId={data.id} /> : null}
              {isSeller ? null : <CancelOrderBlock order={data} />}
            </>
          }
        />
      </PageContainer>
    </>
  );
}

function TwoColumns({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
      <div className="grid gap-4">{main}</div>
      <div className="grid gap-4 lg:sticky lg:top-[100px]">{aside}</div>
    </div>
  );
}
