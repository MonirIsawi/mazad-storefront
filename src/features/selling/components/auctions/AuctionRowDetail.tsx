'use client';

import { CountdownText, Icon, Price } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDateTime } from '@shared/lib';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { SellerAuction } from '../../types/selling.types';

/** The one line a seller needs for each status: the price and clock, the reason, the date. */
export function AuctionRowDetail({ auction }: { auction: SellerAuction }) {
  const { t } = useSellingTranslation();
  const { locale } = useLocale();
  const line = 'flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground';

  switch (auction.status) {
    case 'LIVE':
      return (
        <span className={line}>
          <Price value={auction.currentPrice ?? auction.startingPrice} tone="gold" size="xs" />
          <span aria-hidden>·</span>
          {t('auctions.bids', { count: auction.bidCount })}
          <span className="ms-1.5 inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5">
            <Icon name="clock" size={13} />
            <span className="sr-only">{t('auctions.timeLeft')}</span>
            <CountdownText endsAt={auction.endsAt} />
          </span>
        </span>
      );
    case 'REJECTED':
      return auction.rejectionReason ? (
        <span className="text-xs text-destructive">
          {t('auctions.rejectedReason', { reason: auction.rejectionReason })}
        </span>
      ) : null;
    case 'SCHEDULED':
      return (
        <span className={line}>
          {t('auctions.startsAt', { date: formatDateTime(auction.startsAt, locale) })}
        </span>
      );
    case 'SOLD':
      return (
        <span className={line}>
          {t('auctions.soldFor')}
          <Price value={auction.currentPrice ?? auction.buyNowPrice} size="xs" />
          {auction.saleCancelled ? <span>· {t('auctions.saleCancelled')}</span> : null}
        </span>
      );
    case 'ENDED':
    case 'UNSOLD':
      return (
        <span className={line}>
          {t('auctions.endedAt', { date: formatDateTime(auction.endsAt, locale) })}
          <span aria-hidden>·</span>
          {t('auctions.bids', { count: auction.bidCount })}
        </span>
      );
    case 'CANCELLED':
      return auction.cancelReason ? (
        <span className={line}>
          {t('auctions.cancelledReason', { reason: auction.cancelReason })}
        </span>
      ) : null;
    default:
      return (
        <span className={line}>
          {t('auctions.opensAt')}
          <Price value={auction.startingPrice} size="xs" />
        </span>
      );
  }
}
