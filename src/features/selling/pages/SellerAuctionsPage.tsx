'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { Chip, Icon, Skeleton, buttonVariants } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { relistableProductIds } from '../lib/auction-permissions';
import { SELLING_PATHS } from '../lib/selling-paths';
import { SELLER_AUCTION_STATUSES } from '../schemas/selling.schema';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { SellerAuctionCard } from '../components/SellerAuctionCard';
import { SELLING_COLUMN, SellingHeader } from '../components/SellingHeader';
import type { SellerAuctionStatus } from '../types/selling.types';

/** The order the status chips read in: what is running first, what is over last. */
const CHIP_ORDER: SellerAuctionStatus[] = [
  'LIVE',
  'PENDING_APPROVAL',
  'SCHEDULED',
  'DRAFT',
  'REJECTED',
  'SOLD',
  'UNSOLD',
  'ENDED',
  'CANCELLED',
];

/** Every seller auction in one list (Bidoom design `my-auctions`), filtered by status. */
export function SellerAuctionsPage() {
  const { t, isReady } = useSellingTranslation();
  const { number } = useMoney();
  const auctions = useSellerAuctions();
  const products = useProducts();
  const [filter, setFilter] = useState<SellerAuctionStatus | 'ALL'>('ALL');

  if (!isReady) return <PageLoader />;

  // Until the products are known, "List again" stays hidden rather than risk a dead-end form.
  const relistable =
    products.data && auctions.data
      ? relistableProductIds(products.data, auctions.data)
      : new Set<string>();
  const list = auctions.data ?? [];
  const counts = new Map(
    SELLER_AUCTION_STATUSES.map((status) => [
      status,
      list.filter((auction) => auction.status === status).length,
    ]),
  );
  const shown = filter === 'ALL' ? list : list.filter((auction) => auction.status === filter);

  const createLink = (
    <Link href={SELLING_PATHS.auctionNew()} className={buttonVariants({ variant: 'gold' })}>
      <Icon name="gavel" size={20} />
      {t('auctions.add')}
    </Link>
  );

  return (
    <>
      <SellingHeader
        width="wide"
        title={t('auctions.title')}
        backHref={ROUTES.selling}
        crumbs={[{ label: t('auctions.hub'), href: ROUTES.selling }]}
        actions={[
          {
            name: 'plus',
            label: t('auctions.add'),
            tone: 'gold',
            href: SELLING_PATHS.auctionNew(),
          },
        ]}
        desktopTrailing={createLink}
      />

      <PageContainer className={`grid gap-3.5 pb-8 ${SELLING_COLUMN.wide}`}>
        {auctions.isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-28 w-full" />
          ))
        ) : auctions.isError ? (
          <ErrorState onRetry={() => void auctions.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="gavel"
            title={t('auctions.empty')}
            message={t('auctions.emptyHint')}
            action={createLink}
          />
        ) : (
          <>
            <div
              role="group"
              aria-label={t('auctions.filter')}
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0"
            >
              {/* Counts sit in the label at full strength: Chip's dimmed count misses AA on the
                  light theme's active chip. */}
              <Chip isActive={filter === 'ALL'} onClick={() => setFilter('ALL')}>
                {t('auctions.all')}
                <span className="font-tabular text-xs font-semibold">{number(list.length)}</span>
              </Chip>
              {CHIP_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map((status) => (
                <Chip key={status} isActive={filter === status} onClick={() => setFilter(status)}>
                  {t(`status.${status}`)}
                  <span className="font-tabular text-xs font-semibold">
                    {number(counts.get(status) ?? 0)}
                  </span>
                </Chip>
              ))}
            </div>
            <ul className="grid gap-3">
              {shown.map((auction) => (
                <li key={auction.id}>
                  <SellerAuctionCard auction={auction} relistable={relistable} />
                </li>
              ))}
            </ul>
          </>
        )}
      </PageContainer>
    </>
  );
}
