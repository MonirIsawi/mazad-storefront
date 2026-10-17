'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { EmptyState, PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { Notice, buttonVariants } from '@shared/components/ui';
import { useToast } from '@shared/hooks';
import { useAddProductImage, useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useStores } from '../hooks/useStores';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { productAuctionState } from '../lib/auction-permissions';
import { SELLING_PATHS } from '../lib/selling-paths';
import { ProductForm } from '../components/ProductForm';
import { ProductImageManager } from '../components/ProductImageManager';
import { PendingPhotos } from '../components/products/PendingPhotos';
import { DeleteProductButton } from '../components/products/DeleteProductButton';
import { SELLING_COLUMN, SellingHeader } from '../components/SellingHeader';
import type { SellerProduct, SellingCategoryOption } from '../types/selling.types';

export interface ProductEditorPageProps {
  /** Absent for a new product. */
  productId?: string;
  /** Passed in by the route — selling never imports the catalog slice (AGENTS.md rule 1). */
  categories: SellingCategoryOption[];
}

/** Add or edit a product (Bidoom design `product-form`): photos first, then the details. */
export function ProductEditorPage({ productId, categories }: ProductEditorPageProps) {
  const { t, isReady } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const toast = useToast();
  const stores = useStores();
  const products = useProducts();
  const auctions = useSellerAuctions();
  const addImage = useAddProductImage();
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isReady) return <PageLoader />;

  const product = productId ? products.data?.find((item) => item.id === productId) : undefined;
  const state = product ? productAuctionState(product.id, auctions.data ?? []) : null;
  const isLoading = stores.isPending || (Boolean(productId) && products.isPending);

  // A new product: create it, upload the photos picked before Save (the first is the cover),
  // then carry on editing it, where its photos can be changed.
  const handleCreated = async (created: SellerProduct) => {
    if (pendingPhotos.length > 0) {
      setIsUploading(true);
      try {
        for (const [index, file] of pendingPhotos.entries()) {
          await addImage.mutateAsync({
            productId: created.id,
            file,
            isCover: index === 0,
            silent: true,
          });
        }
      } catch {
        toast.error(tCommon('errors.generic'));
      } finally {
        setIsUploading(false);
      }
    }
    router.replace(SELLING_PATHS.productEdit(created.id));
  };

  return (
    <>
      <SellingHeader
        width="narrow"
        title={t(productId ? 'products.edit' : 'products.newTitle')}
        backHref={ROUTES.sellingProducts}
        crumbs={[{ label: t('products.title'), href: ROUTES.sellingProducts }]}
      />
      <PageContainer className={`grid gap-6 pb-10 ${SELLING_COLUMN.narrow}`}>
        {isLoading ? (
          <PageLoader />
        ) : productId && !product ? (
          <EmptyState
            icon="tag"
            title={t('products.notFound')}
            message={t('products.emptyHint')}
            action={
              <Link href={ROUTES.sellingProducts} className={buttonVariants({ variant: 'soft' })}>
                {t('products.title')}
              </Link>
            }
          />
        ) : (
          <>
            {product && state && !state.canEdit ? (
              <Notice icon="lock">{t('products.lockedInAuction')}</Notice>
            ) : product ? (
              <ProductImageManager product={product} />
            ) : (
              <PendingPhotos
                files={pendingPhotos}
                onChange={setPendingPhotos}
                isBusy={isUploading}
              />
            )}
            {!state || state.canEdit ? (
              <ProductForm
                key={product?.id ?? 'new'}
                product={product}
                stores={stores.data ?? []}
                categories={categories}
                isFinishing={isUploading}
                onDone={(saved) =>
                  product ? router.push(ROUTES.sellingProducts) : void handleCreated(saved)
                }
              />
            ) : null}
            {product && state?.canDelete ? <DeleteProductButton productId={product.id} /> : null}
          </>
        )}
      </PageContainer>
    </>
  );
}
