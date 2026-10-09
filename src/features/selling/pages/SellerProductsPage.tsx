'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Button, Card, CardContent, Icon, Skeleton } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName, resolveAssetUrl } from '@shared/lib';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { productAuctionState } from '../lib/auction-permissions';
import { useStores } from '../hooks/useStores';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { ProductForm } from '../components/ProductForm';
import { ProductImageManager } from '../components/ProductImageManager';
import type { SellerProduct, SellingCategoryOption } from '../types/selling.types';

export interface SellerProductsPageProps {
  /** Passed in by the route — selling never imports the catalog slice (AGENTS.md rule 1). */
  categories?: SellingCategoryOption[];
}

export function SellerProductsPage({ categories = [] }: SellerProductsPageProps) {
  const { t, isReady } = useSellingTranslation();
  const { locale } = useLocale();
  const products = useProducts();
  const stores = useStores();
  const deleteProduct = useDeleteProduct();
  // What each product may offer depends on its auctions (frozen while one runs, sold).
  const auctions = useSellerAuctions();

  // 'new', a product id being edited, or nothing.
  const [editing, setEditing] = useState<string | null>(null);

  if (!isReady) return <PageLoader />;

  const renderProduct = (product: SellerProduct) => {
    if (editing === product.id) {
      return (
        <Card key={product.id}>
          <CardContent className="flex flex-col gap-4">
            <ProductForm
              product={product}
              stores={stores.data ?? []}
              categories={categories}
              onDone={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
            <ProductImageManager product={product} />
          </CardContent>
        </Card>
      );
    }

    const state = productAuctionState(product.id, auctions.data ?? []);
    const cover = product.images.find((image) => image.isCover) ?? product.images[0];
    const coverUrl = resolveAssetUrl(cover?.url);

    return (
      <Card key={product.id} isInset className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-fill">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Icon name="package" size={24} />
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-headline font-semibold text-foreground">
              {pickLocalizedName(product, locale)}
            </p>
            <p className="truncate text-footnote text-muted-foreground">
              {product.category.name} · {t(`condition.${product.condition}`)}
            </p>
            <p className="text-caption text-muted-foreground">
              {product.images.length === 0
                ? t('products.noImages')
                : t('products.imageCount', { count: product.images.length })}
            </p>
          </div>

          {product.isBlocked ? (
            <Badge tone="neutral" className="shrink-0">
              {t('products.blocked')}
            </Badge>
          ) : state.status ? (
            <Badge tone={state.status === 'LIVE' ? 'live' : 'neutral'} className="shrink-0">
              {t(`status.${state.status}`)}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {state.canEdit ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(product.id)}>
              {t('products.edit')}
            </Button>
          ) : null}
          {/* A blocked product can't be auctioned — mazad-api rejects it at auction creation. */}
          {!product.isBlocked && state.canAuction ? (
            <Link
              href={ROUTES.sellingAuctionNew(product.id)}
              className="inline-flex h-9 items-center rounded-sm bg-primary-tint px-3.5 text-footnote font-semibold text-primary-text"
            >
              {t('products.createAuction')}
            </Link>
          ) : null}
          {state.canDelete ? (
            <Button
              size="sm"
              variant="destructive"
              isLoading={deleteProduct.isPending && deleteProduct.variables === product.id}
              onClick={() => {
                if (window.confirm(t('products.deleteConfirm'))) deleteProduct.mutate(product.id);
              }}
            >
              {t('products.delete')}
            </Button>
          ) : null}
        </div>
        {state.status && !state.canEdit && state.status !== 'SOLD' ? (
          <p className="text-footnote text-muted-foreground">{t('products.lockedInAuction')}</p>
        ) : null}
      </Card>
    );
  };

  return (
    <>
      <ScreenHeader title={t('products.title')} backHref={ROUTES.selling} />

      <div className="flex flex-col gap-3 px-gutter pb-6">
        {products.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} radius="lg" className="h-28 w-full" />
            ))}
          </div>
        ) : products.isError ? (
          <ErrorState onRetry={() => void products.refetch()} />
        ) : (
          <>
            {products.data.length === 0 && editing !== 'new' ? (
              <EmptyState
                icon="package"
                title={t('products.empty')}
                message={t('products.emptyHint')}
              />
            ) : (
              products.data.map(renderProduct)
            )}

            {editing === 'new' ? (
              <Card>
                <CardContent>
                  <ProductForm
                    stores={stores.data ?? []}
                    categories={categories}
                    // Straight into the photo step: a product with no cover renders as a blank
                    // tile everywhere it appears.
                    onDone={(created) => setEditing(created.id)}
                    onCancel={() => setEditing(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" isFullWidth onClick={() => setEditing('new')}>
                <Icon name="plus" size={18} />
                {t('products.add')}
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
