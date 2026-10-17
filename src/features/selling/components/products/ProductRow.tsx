'use client';

import Link from 'next/link';
import { Badge, buttonVariants } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName, resolveThumbUrl } from '@shared/lib';
import { useProductBlockReason } from '../../hooks/useProducts';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { ProductAuctionState } from '../../lib/auction-permissions';
import { SELLING_PATHS } from '../../lib/selling-paths';
import type { SellerProduct } from '../../types/selling.types';
import { LotRow } from '../LotRow';
import { SellerAuctionBadge } from '../auctions/SellerAuctionBadge';

/**
 * One product (design `products`): ready, in an auction, or blocked, and the next step. Ready
 * offers "List in auction" (or "Add photos" first: buyers don't bid on what they can't see); in
 * an auction it shows that auction's status; blocked explains itself.
 */
export function ProductRow({
  product,
  state,
}: {
  product: SellerProduct;
  state: ProductAuctionState;
}) {
  const { t } = useSellingTranslation();
  const { locale } = useLocale();
  const cover = product.images.find((image) => image.isCover) ?? product.images[0];
  const photos =
    product.images.length === 0
      ? t('products.noImages')
      : t('products.imageCount', { count: product.images.length });
  const canOpen = state.canEdit || state.canDelete;
  const isReady = !product.isBlocked && state.canAuction;

  return (
    <LotRow
      thumbUrl={resolveThumbUrl(cover?.thumbUrl ?? cover?.url)}
      title={pickLocalizedName(product, locale)}
      href={canOpen ? SELLING_PATHS.productEdit(product.id) : undefined}
      hasActions={isReady}
      end={
        product.isBlocked ? (
          <Badge tone="bad">{t('products.blocked')}</Badge>
        ) : state.status ? (
          <SellerAuctionBadge status={state.status} />
        ) : isReady ? (
          <Link
            href={
              product.images.length > 0
                ? SELLING_PATHS.auctionNew(product.id)
                : SELLING_PATHS.productEdit(product.id)
            }
            className={buttonVariants({ variant: 'line', size: 'sm' })}
          >
            {t(product.images.length > 0 ? 'products.createAuction' : 'products.addPhotos')}
          </Link>
        ) : null
      }
    >
      <span className="text-xs text-muted-foreground">
        {t('products.meta', {
          category: product.category.name,
          condition: t(`condition.${product.condition}`),
        })}{' '}
        · {photos}
      </span>
      {product.isBlocked ? <BlockReason productId={product.id} /> : null}
      {state.status && state.status !== 'SOLD' && !product.isBlocked ? (
        <Link
          href={ROUTES.sellingAuctions}
          className="relative z-10 w-fit text-xs text-foreground-soft underline decoration-border-strong underline-offset-2 hover:text-foreground"
        >
          {t('products.lockedInAuction')}
        </Link>
      ) : null}
    </LotRow>
  );
}

function BlockReason({ productId }: { productId: string }) {
  const { t } = useSellingTranslation();
  const reason = useProductBlockReason(productId, true);
  if (reason.isPending) return null;
  return (
    <span className="text-xs text-destructive">
      {reason.data
        ? t('products.blockedReason', { reason: reason.data })
        : t('products.blockedNoReason')}
    </span>
  );
}
