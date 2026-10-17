'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Badge, Icon, Price, Skeleton, type BadgeTone } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDate, pickLocalizedName } from '@shared/lib';
import { useMyPayments } from '../hooks/usePayments';
import { useOrdersTranslation } from '../hooks/useOrdersTranslation';
import type { MyPayments, PaymentStatus } from '../schemas/payments.schema';

const STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: 'ending',
  PAID: 'live',
  FAILED: 'bad',
  PARTIALLY_REFUNDED: 'done',
  REFUNDED: 'done',
  CANCELLED: 'done',
};

/** A plain ledger (design `payments`): method, order, date, amount and status, newest first. */
export function PaymentsPage() {
  const { t, isReady } = useOrdersTranslation();
  const payments = useMyPayments();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader
        title={t('payment.history.title')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('page.account'), href: ROUTES.account }]}
      />
      <PageContainer className="grid max-w-[820px] gap-2 pb-12 lg:gap-2.5">
        {payments.isPending ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-[72px] w-full" />
          ))
        ) : payments.isError ? (
          <ErrorState onRetry={() => void payments.refetch()} />
        ) : payments.data.data.length === 0 ? (
          <EmptyState
            icon="wallet"
            title={t('payment.history.emptyTitle')}
            message={t('payment.history.empty')}
          />
        ) : (
          payments.data.data.map((payment) => <LedgerRow key={payment.id} payment={payment} />)
        )}
      </PageContainer>
    </>
  );
}

function LedgerRow({ payment }: { payment: MyPayments['data'][number] }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const isCash = payment.method === 'CASH_ON_DELIVERY';
  return (
    <Link
      href={ROUTES.orderDetail(payment.order.id)}
      data-testid="payment-row"
      className="grid min-h-[62px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[22px] border border-border bg-surface px-3.5 py-2.5 transition-[border-color] duration-fast ease-ios hover:border-border-strong"
    >
      <span aria-hidden className="grid size-11 place-items-center rounded-[14px] border bg-tile">
        <Icon name={isCash ? 'cash' : 'card'} tone="gold" size={24} />
      </span>
      <span className="grid min-w-0 leading-[1.4]">
        <span className="truncate text-[15px] font-medium text-foreground">
          {t(`payment.method.${payment.method}`)} ·{' '}
          <span dir="ltr" className="font-tabular">
            {payment.order.orderNumber}
          </span>
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          {formatDate(payment.paidAt ?? payment.createdAt, locale)}
          {payment.order.store ? ` · ${pickLocalizedName(payment.order.store, locale)}` : ''}
          {payment.status === 'FAILED' ? ` · ${t('ledger.declined')}` : ''}
        </span>
      </span>
      <span className="grid justify-items-end gap-1">
        <Price value={payment.amount} size="sm" />
        <Badge tone={STATUS_TONE[payment.status]}>{t(`payment.status.${payment.status}`)}</Badge>
      </span>
    </Link>
  );
}
