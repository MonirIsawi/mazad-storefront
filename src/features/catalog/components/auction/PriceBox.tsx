'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  CountdownText,
  Icon,
  Price,
  TimerBoxes,
  type IconName,
} from '@shared/components/ui';
import { useCountdown, useLocale, useMoney } from '@shared/hooks';
import { formatDateTime, getAuctionStatusLabelKey, getAuctionStatusTone } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { auctionPrices } from '../../lib/auction-prices';
import type { Auction } from '../../types/catalog.types';

const TONE_BADGE = {
  live: 'live',
  warning: 'ending',
  upcoming: 'upcoming',
  neutral: 'done',
} as const;

/**
 * Price and time first (design `.pricebox`): the status with the countdown, the price that matters
 * now (top bid, opening price or sold for) in gold, how far it is under the new retail price, then
 * bids, bidders and the bid step. `isUrgent` turns the clock amber when the viewer was outbid.
 */
export function PriceBox({ auction, isUrgent = false }: { auction: Auction; isUrgent?: boolean }) {
  const { t } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const { money, number } = useMoney();
  const endsInMs = useCountdown(auction.endsAt);
  const prices = auctionPrices(auction);
  const tone = getAuctionStatusTone(auction.status, endsInMs);
  const isLive = auction.status === 'LIVE';
  const isUpcoming = auction.status === 'SCHEDULED';
  const isSold = auction.status === 'SOLD';
  const extendedMinutes = Math.round(
    (new Date(auction.endsAt).getTime() - new Date(auction.originalEndsAt).getTime()) / 60_000,
  );
  const label = isSold
    ? t('detail.soldFor')
    : prices.main.kind === 'opening'
      ? t('price.opening')
      : t('price.current');

  return (
    <section
      aria-label={t('detail.auctionInfo')}
      className="grid gap-3.5 rounded-xl border border-border-strong bg-surface bg-[linear-gradient(180deg,rgb(226_180_103/5%),transparent_40%)] p-[18px]"
      data-testid="detail-prices"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge
          tone={isSold ? 'gold' : TONE_BADGE[tone]}
          hasDot={tone === 'live'}
          icon={
            isSold ? 'check' : tone === 'warning' ? 'timer' : isUpcoming ? 'calendar' : undefined
          }
        >
          {tCommon(getAuctionStatusLabelKey(auction.status, endsInMs))}
        </Badge>
        {isLive && endsInMs > 0 ? <TimerBoxes endsAt={auction.endsAt} isUrgent={isUrgent} /> : null}
        {isUpcoming ? (
          <span className="text-xs text-foreground-soft" data-testid="detail-starts-in">
            {t('detail.startsIn')}{' '}
            <CountdownText endsAt={auction.startsAt} className="text-foreground" />
          </span>
        ) : null}
        {!isLive && !isUpcoming ? (
          <span className="text-xs text-foreground-soft" data-testid="detail-ended-at">
            {t('detail.endedAt', { time: formatDateTime(auction.endsAt, locale) })}
          </span>
        ) : null}
      </div>

      <div className="grid gap-0.5">
        <span className="text-[13px] text-foreground-soft">{label}</span>
        <span data-testid="detail-main-price">
          <Price
            value={prices.main.amount}
            tone={isLive || isUpcoming || isSold ? 'gold' : 'plain'}
            size="xl"
            // The xxl size's custom font-size class is read as a colour by tailwind-merge and
            // would drop the gold: the same 40px, set as a length.
            className="text-[40px]"
          />
        </span>
        {prices.saving ? (
          <span className="text-xs text-foreground-soft" data-testid="price-saving">
            {t('price.savingRetail', { amount: money(prices.saving) })}
          </span>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2" data-testid="detail-activity">
        <Spec icon="gavel">
          {t('detail.bids', { count: auction.bidCount, formattedCount: number(auction.bidCount) })}
        </Spec>
        {auction.bidCount > 0 && auction.bidderCount ? (
          <Spec icon="users">{t('detail.bidders', { count: auction.bidderCount })}</Spec>
        ) : null}
        {prices.nextRaise ? (
          <Spec icon="plus">{t('price.step', { amount: money(prices.nextRaise) })}</Spec>
        ) : null}
      </ul>
      {extendedMinutes > 0 ? (
        <p
          className="flex items-center gap-2 text-xs text-foreground-soft"
          data-testid="detail-extended"
        >
          <Icon name="clock" size={14} />
          {t('detail.extended', { count: extendedMinutes })}
        </p>
      ) : null}
    </section>
  );
}

function Spec({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong px-3.5 text-[13px] text-foreground-soft">
      <Icon name={icon} size={16} className="text-gold" />
      {children}
    </li>
  );
}
