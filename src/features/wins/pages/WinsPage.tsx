'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Skeleton, buttonVariants } from '@shared/components/ui';
import { useWins } from '../hooks/useWins';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import { WinCard } from '../components/WinCard';
import { PendingWins } from '../components/PendingWins';
import { HowWinningWorks } from '../components/HowWinningWorks';
import type { WinAddressOption, WinOrderSummary } from '../types/win-order';

export type { WinAddressOption, WinOrderSummary } from '../types/win-order';

export interface WinsPageProps {
  addresses?: WinAddressOption[];
  isAddressesPending?: boolean;
  /** The orders the wins created, by order id (from the orders feature, via the route). */
  orders?: Record<string, WinOrderSummary>;
}

/**
 * My wins (design `wins`): every win became an order the moment the auction ended, at the default
 * address, so the page lists wins with the order each one created and says plainly what can
 * still change. A win still waiting for the buyer (rare) keeps its confirmation above.
 */
export function WinsPage({ addresses = [], isAddressesPending = false, orders }: WinsPageProps) {
  const { t, isReady } = useWinsTranslation();
  const wins = useWins();

  if (!isReady) return <PageLoader />;

  const pending = (wins.data ?? []).filter((win) => win.status === 'PENDING_CONFIRMATION');
  // Newest win first (by when its auction ended); the API lists by status and deadline.
  const settled = (wins.data ?? [])
    .filter((win) => win.status !== 'PENDING_CONFIRMATION')
    .sort((a, b) => b.auction.endsAt.localeCompare(a.auction.endsAt));

  return (
    <>
      <ScreenHeader
        title={t('page.title')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('page.account'), href: ROUTES.account }]}
      />
      <PageContainer className="pb-28 lg:pb-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          <div className="grid gap-3">
            {wins.isPending ? (
              Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} radius="lg" className="h-36 w-full" />
              ))
            ) : wins.isError ? (
              <ErrorState onRetry={() => void wins.refetch()} />
            ) : pending.length === 0 && settled.length === 0 ? (
              <EmptyState
                icon="trophy"
                title={t('page.emptyTitle')}
                message={t('page.empty')}
                action={
                  <Link href={ROUTES.auctions} className={buttonVariants({ variant: 'gold' })}>
                    {t('page.browse')}
                  </Link>
                }
              />
            ) : (
              <>
                {pending.length > 0 ? (
                  <PendingWins
                    wins={pending}
                    addresses={addresses}
                    isAddressesPending={isAddressesPending}
                  />
                ) : null}
                {settled.map((win) => (
                  <WinCard
                    key={win.id}
                    win={win}
                    order={win.orderItem ? orders?.[win.orderItem.orderId] : undefined}
                  />
                ))}
              </>
            )}
          </div>
          <div className="lg:sticky lg:top-[100px]">
            <HowWinningWorks addresses={addresses} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
