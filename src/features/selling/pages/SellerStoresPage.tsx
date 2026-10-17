'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { Button, Icon, Skeleton } from '@shared/components/ui';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useStores } from '../hooks/useStores';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { liveCountsByStore } from '../lib/store-counts';
import { StoreCard } from '../components/stores/StoreCard';
import { StoreSheet } from '../components/stores/StoreSheet';
import { SELLING_COLUMN, SellingHeader } from '../components/SellingHeader';

/** The seller's stores (Bidoom design `my-stores`); one is the default for new products. */
export function SellerStoresPage() {
  const { t, isReady } = useSellingTranslation();
  const stores = useStores();
  const products = useProducts();
  const auctions = useSellerAuctions();
  // 'new', a store id being edited, or nothing.
  const [editing, setEditing] = useState<string | null>(null);

  if (!isReady) return <PageLoader />;

  const liveCounts =
    products.data && auctions.data ? liveCountsByStore(products.data, auctions.data) : null;
  const editingStore = stores.data?.find((store) => store.id === editing);
  const addButton = (
    <Button onClick={() => setEditing('new')}>
      <Icon name="plus" size={20} />
      {t('stores.add')}
    </Button>
  );

  return (
    <>
      <SellingHeader
        width="narrow"
        title={t('stores.title')}
        backHref={ROUTES.selling}
        crumbs={[{ label: t('stores.hub'), href: ROUTES.selling }]}
        actions={[
          { name: 'plus', label: t('stores.add'), tone: 'gold', onClick: () => setEditing('new') },
        ]}
        desktopTrailing={addButton}
      />

      <PageContainer className={`grid gap-3 pb-8 ${SELLING_COLUMN.narrow}`}>
        {stores.isPending ? (
          Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-44 w-full" />
          ))
        ) : stores.isError ? (
          <ErrorState onRetry={() => void stores.refetch()} />
        ) : stores.data.length === 0 ? (
          <EmptyState
            icon="storefront"
            title={t('stores.empty')}
            message={t('stores.emptyHint')}
            action={addButton}
          />
        ) : (
          <ul className="grid gap-3">
            {stores.data.map((store) => (
              <li key={store.id}>
                <StoreCard
                  store={store}
                  liveCount={liveCounts ? (liveCounts.get(store.id) ?? 0) : undefined}
                  onEdit={() => setEditing(store.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      <StoreSheet store={editingStore} isOpen={editing !== null} onClose={() => setEditing(null)} />
    </>
  );
}
