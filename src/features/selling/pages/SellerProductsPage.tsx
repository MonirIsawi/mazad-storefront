'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { Icon, Skeleton, buttonVariants } from '@shared/components/ui';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { productAuctionState } from '../lib/auction-permissions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { ProductRow } from '../components/products/ProductRow';
import { SELLING_PATHS } from '../lib/selling-paths';
import { SELLING_COLUMN, SellingHeader } from '../components/SellingHeader';

/** The stock a seller can auction (Bidoom design `products`); adding and editing are own pages. */
export function SellerProductsPage() {
  const { t, isReady } = useSellingTranslation();
  const products = useProducts();
  // What each product may offer depends on its auctions (frozen while one runs, sold).
  const auctions = useSellerAuctions();

  if (!isReady) return <PageLoader />;

  const addLink = (
    <Link href={SELLING_PATHS.productNew} className={buttonVariants({ variant: 'gold' })}>
      <Icon name="plus" size={20} />
      {t('products.add')}
    </Link>
  );

  return (
    <>
      <SellingHeader
        width="wide"
        title={t('products.title')}
        backHref={ROUTES.selling}
        crumbs={[{ label: t('products.hub'), href: ROUTES.selling }]}
        actions={[
          { name: 'plus', label: t('products.add'), tone: 'gold', href: SELLING_PATHS.productNew },
        ]}
        desktopTrailing={addLink}
      />

      <PageContainer className={`grid gap-3 pb-8 ${SELLING_COLUMN.wide}`}>
        {products.isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-24 w-full" />
          ))
        ) : products.isError ? (
          <ErrorState onRetry={() => void products.refetch()} />
        ) : products.data.length === 0 ? (
          <EmptyState
            icon="tag"
            title={t('products.empty')}
            message={t('products.emptyHint')}
            action={addLink}
          />
        ) : (
          <ul className="grid gap-3">
            {products.data.map((product) => (
              <li key={product.id}>
                <ProductRow
                  product={product}
                  state={productAuctionState(product.id, auctions.data ?? [])}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
