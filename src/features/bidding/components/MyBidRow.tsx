'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import {
  Badge,
  CountdownText,
  GoldTile,
  Icon,
  Price,
  buttonVariants,
  type BadgeTone,
  type IconName,
} from '@shared/components/ui';
import { useCountdown, useLocale } from '@shared/hooks';
import { cn, pickLocalizedName, resolveThumbUrl } from '@shared/lib';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { BidStanding, MyBidItem } from '../types/bidding.types';

const STANDING_LOOK: Record<BidStanding, { tone: BadgeTone; icon?: IconName; isFilled?: boolean }> =
  {
    WINNING: { tone: 'live', icon: 'crown', isFilled: true },
    OUTBID: { tone: 'bad', icon: 'warning' },
    AWAITING_CONFIRMATION: { tone: 'upcoming', icon: 'hourglass' },
    WON: { tone: 'gold', icon: 'crown', isFilled: true },
    LOST: { tone: 'done' },
  };

/**
 * One auction on My bids (design `.lot-row`): am I winning, and how long is left. An outbid row
 * carries its own way back: "Bid" opens the auction with the bid sheet already up.
 */
export function MyBidRow({ item }: { item: MyBidItem }) {
  const { t } = useBiddingTranslation();
  const { locale } = useLocale();
  const endsInMs = useCountdown(item.auction.endsAt);
  const name = pickLocalizedName(item.auction.product, locale);
  // A 72 px thumb: the 300 px thumbnail, not the full photo.
  const cover = resolveThumbUrl(item.auction.product.coverImage);
  const isLive = item.auction.status === 'LIVE' && endsInMs > 0;
  const look = STANDING_LOOK[item.standing];
  const isOutbid = item.standing === 'OUTBID' && isLive;
  const autoBid = item.autoBid?.isActive ? item.autoBid : null;

  return (
    <li className="relative grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2.5 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:grid-cols-[72px_minmax(0,1fr)_auto]">
      <span className="relative size-16 overflow-hidden rounded-[18px] bg-surface-raised sm:size-[72px] sm:rounded-[20px]">
        {cover ? (
          <Image src={cover} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-tile">
            <GoldTile icon="package" size="sm" />
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-1">
        <Link
          href={ROUTES.auctionDetail(item.auctionId)}
          className="line-clamp-2 text-[14.5px] leading-[1.35] font-medium text-foreground after:absolute after:inset-0 after:rounded-xl"
        >
          {name}
        </Link>
        <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-foreground-soft">
          {autoBid ? (
            <>
              <Icon name="lightning" size={14} isFilled className="text-gold" />
              {t('myBids.autoUpTo')} <Price value={autoBid.maxAmount} size="xs" />
            </>
          ) : (
            <>
              {item.standing === 'WON'
                ? t('myBids.wonAt')
                : item.standing === 'LOST'
                  ? t('myBids.yourBest')
                  : t('form.amount')}{' '}
              <Price value={item.myHighestBid} size="xs" />
            </>
          )}
          {isOutbid ? (
            <>
              <span aria-hidden>·</span>
              <CountdownText endsAt={item.auction.endsAt} className="text-warning" />
            </>
          ) : null}
        </span>
      </span>
      <span
        className={cn(
          'gap-2',
          isOutbid
            ? 'col-span-3 flex items-center justify-end gap-2.5 sm:col-span-1 sm:grid sm:justify-items-end'
            : 'grid justify-items-end',
        )}
      >
        <Badge tone={look.tone} icon={look.icon} isIconFilled={look.isFilled}>
          {t(`standing.${item.standing}`)}
        </Badge>
        {isOutbid ? (
          <Link
            href={`${ROUTES.auctionDetail(item.auctionId)}?bid=1`}
            className={cn(buttonVariants({ size: 'sm' }), 'relative z-10')}
          >
            {t('myBids.bidAgain')}
          </Link>
        ) : isLive ? (
          <CountdownText endsAt={item.auction.endsAt} className="text-[15px] text-foreground" />
        ) : null}
      </span>
    </li>
  );
}
