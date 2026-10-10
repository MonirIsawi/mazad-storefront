'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Card, Icon, Skeleton } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDateTime, pickLocalizedName } from '@shared/lib';
import { useMyPayments } from '../hooks/usePayments';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import type { PaymentStatus } from '../schemas/payments.schema';

const STATUS_TONE: Record<PaymentStatus, 'live' | 'upcoming' | 'warning' | 'neutral'> = {
  PENDING: 'warning',
  PAID: 'live',
  FAILED: 'warning',
  PARTIALLY_REFUNDED: 'neutral',
  REFUNDED: 'neutral',
  CANCELLED: 'neutral',
};

/** The buyer's payments across orders, newest first: electronic attempts and cash payments. */
export function PaymentsPage() {
  const { t, isReady } = useOrdersTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const payments = useMyPayments();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader title={t('payment.history.title')} backHref={ROUTES.account} />
      <div className="flex flex-col gap-3 px-gutter pb-6">
        {payments.isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-20 w-full" />
          ))
        ) : payments.isError ? (
          <ErrorState onRetry={() => void payments.refetch()} />
        ) : payments.data.data.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title={t('payment.history.emptyTitle')}
            message={t('payment.history.empty')}
          />
        ) : (
          payments.data.data.map((payment) => (
            <Link key={payment.id} href={ROUTES.orderDetail(payment.order.id)}>
              <Card
                isInset
                className="flex flex-col gap-2 transition-transform duration-fast ease-ios active:scale-[0.985]"
                data-testid="payment-row"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-subhead font-semibold text-foreground">
                    <Icon name="credit-card" size={16} />
                    {t(`payment.method.${payment.method}`)}
                  </span>
                  <Badge tone={STATUS_TONE[payment.status]}>
                    {t(`payment.status.${payment.status}`)}
                  </Badge>
                </div>
                <p className="truncate text-footnote text-muted-foreground">
                  {t('payment.history.order')} {payment.order.orderNumber}
                  {payment.order.store ? ` · ${pickLocalizedName(payment.order.store, locale)}` : ''}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-caption text-muted-foreground">
                    {formatDateTime(payment.paidAt ?? payment.createdAt, locale)}
                  </span>
                  <span className="text-callout font-bold text-foreground tabular-nums">
                    {money(payment.amount)}
                  </span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
