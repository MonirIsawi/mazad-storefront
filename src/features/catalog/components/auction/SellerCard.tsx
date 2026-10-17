'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { Card, Icon, InitialTile } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { Auction } from '../../types/catalog.types';

/**
 * Who sells it (design `.seller`): the store's initial, its name with the verified mark only when
 * the seller is verified, the person behind it, the city and the rating once there are reviews.
 * Never a phone, street or location: the API doesn't send them.
 */
export function SellerCard({
  auction,
  followToggle,
}: {
  auction: Auction;
  followToggle?: ReactNode;
}) {
  const { t } = useCatalogTranslation();
  const { locale } = useLocale();
  const { seller, store, sellerRating } = auction;
  const storeName = pickLocalizedName(store, locale);
  const hasRating = sellerRating && sellerRating.count > 0 && sellerRating.average != null;

  return (
    <Card className="grid gap-3 p-[18px]" data-testid="detail-seller">
      <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5">
        <InitialTile name={storeName} />
        <div className="grid min-w-0 gap-1">
          <b className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{storeName}</span>
            {seller.isVerified ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 text-gold"
                data-testid="seller-verified"
              >
                <Icon name="seal-check" isFilled size={16} />
                <span className="sr-only">{t('detail.verifiedSeller')}</span>
              </span>
            ) : null}
          </b>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-foreground-soft">
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={13} />
              {store.city}
            </span>
            <span data-testid="seller-rating" className="inline-flex items-center gap-1">
              {hasRating ? (
                t('detail.ratingValue', {
                  average: sellerRating.average?.toLocaleString(
                    locale === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-US',
                  ),
                  count: sellerRating.count,
                })
              ) : (
                <span className="text-muted-foreground">{t('detail.noReviews')}</span>
              )}
            </span>
          </span>
        </div>
        <Link
          href={ROUTES.store(store.id)}
          aria-label={t('detail.viewStore')}
          className="grid size-11 place-items-center rounded-full border border-gold-line text-gold hover:bg-gold-soft light:text-gold-lo"
        >
          <Icon name="arrow-up-right" size={18} className="rtl:-scale-x-100" />
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="inline-flex min-w-0 items-center gap-2 text-foreground-soft">
          <Icon name="user" size={16} className="shrink-0" />
          <Link
            href={ROUTES.sellerProfile(seller.id)}
            className="truncate font-medium text-foreground hover:text-gold"
          >
            {seller.fullName}
          </Link>
        </span>
        {followToggle ? <div className="shrink-0">{followToggle}</div> : null}
      </div>
    </Card>
  );
}
