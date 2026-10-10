'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Button, Card, CardContent, Icon, Skeleton } from '@shared/components/ui';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { AuctionForm } from '../components/AuctionForm';
import { SellerAuctionCard } from '../components/SellerAuctionCard';

export interface SellerAuctionsPageProps {
  /** Set by /account/selling/auctions/new?productId=… so the form opens on that product. */
  initialProductId?: string;
}

export function SellerAuctionsPage({ initialProductId }: SellerAuctionsPageProps) {
  const { t, isReady } = useSellingTranslation();
  const auctions = useSellerAuctions();
  const products = useProducts();

  // Opens straight into the form when the seller arrived from a product.
  const [editing, setEditing] = useState<string | null>(initialProductId ? 'new' : null);

  if (!isReady) return <PageLoader />;

  // "relist:<id>": a new listing pre-filled from an ended one.
  const relistId = editing?.startsWith('relist:') ? editing.slice('relist:'.length) : null;
  const relistFrom = relistId
    ? auctions.data?.find((auction) => auction.id === relistId)
    : undefined;
  const editingAuction =
    editing && editing !== 'new' && !relistId
      ? auctions.data?.find((auction) => auction.id === editing)
      : undefined;

  return (
    <>
      <ScreenHeader title={t('auctions.title')} backHref={ROUTES.selling} />

      <div className="flex flex-col gap-3 px-gutter pb-6">
        {editing ? (
          <Card>
            <CardContent>
              <AuctionForm
                key={editing}
                auction={editingAuction}
                relistFrom={relistFrom}
                products={products.data ?? []}
                initialProductId={editing === 'new' ? initialProductId : undefined}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </CardContent>
          </Card>
        ) : null}

        {auctions.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} radius="lg" className="h-32 w-full" />
            ))}
          </div>
        ) : auctions.isError ? (
          <ErrorState onRetry={() => void auctions.refetch()} />
        ) : (
          <>
            {auctions.data.length === 0 && !editing ? (
              <EmptyState
                icon="gavel"
                title={t('auctions.empty')}
                message={t('auctions.emptyHint')}
              />
            ) : (
              auctions.data.map((auction) => (
                <SellerAuctionCard
                  key={auction.id}
                  auction={auction}
                  onEdit={(next) => setEditing(next.id)}
                  onRelist={(from) => setEditing(`relist:${from.id}`)}
                />
              ))
            )}

            {!editing ? (
              <Button variant="outline" isFullWidth onClick={() => setEditing('new')}>
                <Icon name="plus" size={18} />
                {t('auctions.add')}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
