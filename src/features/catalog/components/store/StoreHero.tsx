'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@shared/components/layout';
import { Icon, IconButton, InitialTile, RatingSummary } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { cn, shareLink } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { StoreFront } from '../../types/store.types';

export interface StoreHeroProps {
  store: StoreFront;
  name: string;
  /** The score under the name; null before the first rating. */
  rating: { average: number; count: number } | null;
  /** Opens the ratings tab; absent while the API has no store ratings (the score is then text). */
  onOpenRatings?: () => void;
  /** The Follow control (the page's one gold action), composed in by the route. */
  followSlot?: ReactNode;
  onBack: () => void;
}

/**
 * The shopfront's head (design `.cover` + `.store-head`): the cover photo, or without one the dark
 * ground; the gold initial tile, the name with its verified mark, where it is and how it is rated,
 * then Follow and Share.
 */
export function StoreHero({
  store,
  name,
  rating,
  onOpenRatings,
  followSlot,
  onBack,
}: StoreHeroProps) {
  const { t } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const hasCover = Boolean(store.coverUrl);
  // The seller's mark: sent on the store by newer APIs, always on its seller.
  const isVerified = store.isVerified ?? store.seller.isVerified;

  return (
    <section aria-labelledby="store-name">
      <div
        className={cn(
          'relative overflow-hidden bg-background-deep',
          hasCover ? 'h-[260px] lg:h-[300px]' : 'h-[188px] lg:h-[220px]',
        )}
      >
        {store.coverUrl ? (
          <>
            <Image
              src={store.coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-hero-shade" />
          </>
        ) : (
          <>
            <span aria-hidden className="absolute inset-x-0 -top-1/2 h-[200%] bg-glow opacity-60" />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--color-background))]"
            />
          </>
        )}
        <div className="absolute start-4 top-[max(12px,env(safe-area-inset-top))] lg:hidden">
          <IconButton
            name="caret-right"
            tone={hasCover ? 'glass' : 'surface'}
            label={tCommon('nav.back')}
            className="ltr:[&>svg]:-scale-x-100"
            onClick={onBack}
          />
        </div>
      </div>

      <PageContainer className="relative -mt-14 flex flex-wrap items-end gap-4 lg:flex-nowrap">
        <InitialTile name={name} size={96} tone="gold" className="rounded-[28px]!" />
        <div className="grid min-w-0 flex-1 gap-1.5">
          <h1
            id="store-name"
            className="flex items-center gap-2.5 font-display text-h1 font-normal text-foreground en:text-2xl lg:text-h1-lg lg:en:text-h1-lg"
          >
            <span className="min-w-0 break-words">{name}</span>
            {isVerified ? (
              <span data-testid="store-verified" className="inline-flex text-gold">
                <Icon name="seal-check" isFilled size={24} label={t('detail.verifiedSeller')} />
              </span>
            ) : null}
          </h1>
          <StoreMeta store={store} rating={rating} onOpenRatings={onOpenRatings} />
        </div>
        <div className="flex w-full items-center gap-2.5 lg:w-auto lg:shrink-0">
          {followSlot ? <div className="flex-1 lg:flex-none">{followSlot}</div> : null}
          <StoreShareButton />
        </div>
      </PageContainer>
    </section>
  );
}

function StoreMeta({
  store,
  rating,
  onOpenRatings,
}: Pick<StoreHeroProps, 'store' | 'rating' | 'onOpenRatings'>) {
  const { t } = useCatalogTranslation();
  const summary = rating ? <RatingSummary average={rating.average} count={rating.count} /> : null;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-foreground-soft">
      <span className="inline-flex items-center gap-1">
        <Icon name="map-pin" size={16} />
        {store.city}
      </span>
      {summary && onOpenRatings ? (
        <button
          type="button"
          onClick={onOpenRatings}
          title={t('store.ratings.openTab')}
          data-testid="store-rating"
          className="relative rounded-lg after:absolute after:-inset-x-2 after:-inset-y-[11px] hover:[&_.text-muted-foreground]:text-gold"
        >
          {summary}
        </button>
      ) : summary ? (
        <span data-testid="store-rating">{summary}</span>
      ) : null}
      <Link
        href={ROUTES.sellerProfile(store.seller.id)}
        className="relative inline-flex items-center gap-1 hover:text-gold after:absolute after:-inset-x-2 after:-inset-y-[11px]"
      >
        <Icon name="user" size={16} />
        <span className="sr-only">{t('detail.seller')}: </span>
        {store.seller.fullName}
      </Link>
    </p>
  );
}

function StoreShareButton() {
  const { t } = useCatalogTranslation();
  const toast = useToast();
  const handleShare = async () => {
    const outcome = await shareLink(window.location.href);
    if (outcome === 'copied') toast.success(t('detail.linkCopied'));
    if (outcome === 'unavailable') toast.error(t('detail.shareUnavailable'));
  };
  return (
    <IconButton
      name="share-network"
      label={t('detail.share')}
      size={52}
      onClick={() => void handleShare()}
    />
  );
}
