'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { useCountdown, useLocale, useMoney } from '@shared/hooks';
import {
  cn,
  formatDuration,
  getAuctionStatusLabelKey,
  getAuctionStatusTone,
  getImageTintStyle,
  pickLocalizedName,
  resolveAssetUrl,
} from '@shared/lib';
import { Badge, Card, Icon } from '@shared/components/ui';
import type { AuctionSummary } from '@shared/types';
import { useAuctionCardAction } from './AuctionCardActionSlot';

export interface AuctionCardProps {
  auction: AuctionSummary;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation('common');
  const { locale } = useLocale();
  const { money, number } = useMoney();
  const renderAction = useAuctionCardAction();

  // Re-renders the whole card once a second, not just the digits: the badge tone and label are
  // derived from the same remaining time, so ticking only the clock would leave a card reading
  // "ending soon" against a timer that had already run out.
  const endsInMs = useCountdown(auction.endsAt);

  const name = pickLocalizedName(auction.product, locale);
  const coverImage = resolveAssetUrl(auction.product.coverImage);
  const isCountingDown = auction.status === 'LIVE' && endsInMs > 0;
  const price = auction.currentPrice ?? auction.startingPrice;
  const tone = getAuctionStatusTone(auction.status, endsInMs);
  const label = t(getAuctionStatusLabelKey(auction.status, endsInMs));

  return (
    <div className="relative h-full">
      <Link href={ROUTES.auctionDetail(auction.id)} className="block h-full">
        <Card className="flex h-full flex-col overflow-hidden transition-transform duration-fast ease-ios active:scale-[0.985]">
          <div
            className="relative aspect-square w-full"
            style={coverImage ? undefined : getImageTintStyle(auction.product.id)}
          >
            {coverImage ? (
              <Image
                src={coverImage}
                alt={name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-foreground/22">
                <Icon name="package" size={64} />
              </span>
            )}

            <Badge tone={tone} hasDot={tone === 'live'} className="absolute start-2 top-2">
              {label}
            </Badge>

            {isCountingDown ? (
              <span
                className={cn(
                  'absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-[5px]',
                  'rounded-sm bg-foreground/72 px-2 py-[5px] backdrop-blur-chrome',
                  // Western digits with tabular figures — Arabic-Indic here would jitter width
                  // on every tick (design system, "Money and time").
                  'text-caption-2 font-semibold text-surface tabular-nums',
                )}
              >
                <Icon name="clock" size={12} />
                {formatDuration(endsInMs, locale)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-1 px-3 pt-2.5 pb-3">
            <p className="line-clamp-2 text-footnote leading-[1.35] font-medium text-foreground">
              {name}
            </p>
            <div className="mt-auto flex flex-wrap items-baseline gap-1.5">
              {/* Never the brand blue — the accent always means "tap me". */}
              <span className="text-callout font-bold text-foreground tabular-nums">
                {money(price)}
              </span>
            </div>
            {auction.bidCount > 0 ? (
              <div className="flex items-center gap-2 text-caption-2 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Icon name="gavel" size={12} />
                  {number(auction.bidCount)}
                </span>
              </div>
            ) : null}
          </div>
        </Card>
      </Link>

      {/* 32pt glass control inside a 44pt hit area — the visual size and the touch target are
          deliberately decoupled so the card art isn't crowded. */}
      {renderAction ? (
        <div className="absolute end-0.5 top-0.5 z-10">{renderAction(auction.id)}</div>
      ) : null}
    </div>
  );
}
