'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import {
  Badge,
  GoldTile,
  Icon,
  IconButton,
  Price,
  TimerBoxes,
  buttonVariants,
} from '@shared/components/ui';
import { useLocale, useToast } from '@shared/hooks';
import { cn, pickLocalizedName, shareLink } from '@shared/lib';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import type { HomeAuction } from '../types/home.types';

export interface FeaturedLotProps {
  auction: HomeAuction;
  /** The heart, composed in by the route from the watchlist feature. */
  watchToggle?: ReactNode;
  className?: string;
}

/**
 * The featured lot (design `.feat`): one real live auction, the next to close, as a photo card
 * with its price, its countdown and the one gold action. It stays dark in the light theme too:
 * its text sits on the photo's dark fade.
 */
export function FeaturedLot({ auction, watchToggle, className }: FeaturedLotProps) {
  const { t } = useHomeTranslation();
  const { locale } = useLocale();
  const name = pickLocalizedName(auction.product, locale);
  const href = ROUTES.auctionDetail(auction.id);
  const hasBids = auction.currentPrice != null;

  return (
    <article
      data-surface="dark"
      aria-labelledby={`featured-${auction.id}`}
      className={cn(
        'relative isolate grid min-h-[330px] content-end overflow-hidden rounded-3xl border border-border',
        'bg-surface-raised shadow-[inset_0_0_0_1px_var(--color-gold-line),0_40px_80px_-40px_rgb(0_0_0/80%)] lg:min-h-[470px]',
        className,
      )}
    >
      {auction.product.coverImage ? (
        <Image
          src={auction.product.coverImage}
          alt=""
          fill
          priority
          sizes="(min-width: 960px) 600px, 100vw"
          className="-z-20 object-cover"
        />
      ) : (
        <span className="absolute inset-0 -z-20 grid place-items-center bg-tile pb-32">
          <GoldTile icon="package" size="xl" />
        </span>
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-feature-shade" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between">
        <Badge tone="photo" hasDot>
          {t('featured.badge')}
        </Badge>
        {watchToggle ? <div className="-me-1.5 -mt-1.5">{watchToggle}</div> : null}
      </div>

      <div className="grid gap-2.5 p-5 text-on-photo lg:gap-3.5 lg:p-7">
        <h2
          id={`featured-${auction.id}`}
          className="line-clamp-3 text-[28px] leading-[1.25] font-medium text-on-photo lg:text-[34px]"
        >
          <Link href={href} className="focus-visible:outline-offset-4">
            {name}
          </Link>
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs text-on-photo/70">
              {hasBids ? t('featured.topBid') : t('featured.opening')}
            </span>
            <Price
              value={auction.currentPrice ?? auction.startingPrice}
              tone="photo"
              size="xl"
              className="lg:text-[44px]"
            />
          </div>
          <TimerBoxes endsAt={auction.endsAt} tone="photo" />
        </div>
        <div className="flex items-center gap-2.5">
          <Link href={href} className={cn(buttonVariants({ variant: 'gold' }), 'flex-1')}>
            <Icon name="paddle" size={20} />
            {t('featured.bidNow')}
          </Link>
          <ShareButton href={href} />
        </div>
      </div>
    </article>
  );
}

function ShareButton({ href }: { href: string }) {
  const { t } = useHomeTranslation();
  const toast = useToast();
  const handleShare = async () => {
    const outcome = await shareLink(new URL(href, window.location.origin).toString());
    if (outcome === 'copied') toast.success(t('featured.linkCopied'));
    if (outcome === 'unavailable') toast.error(t('featured.shareUnavailable'));
  };
  return (
    <IconButton
      name="share"
      tone="glass"
      size={52}
      label={t('featured.share')}
      onClick={() => void handleShare()}
    />
  );
}
