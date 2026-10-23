'use client';

import { Icon, Price } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { cn, formatDateTime, formatTime } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { BidHistoryItem } from '../../types/catalog.types';

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/**
 * Bids as mazad-api orders them (highest, then newest, first), design `.hist`: the viewer's own
 * bids read "You" in gold with the crown; everyone else by full name, and automatic bids carry a
 * small "Auto" tag.
 */
export function BidHistoryRows({ bids }: { bids: BidHistoryItem[] }) {
  const { t } = useCatalogTranslation();
  const { locale } = useLocale();

  return (
    <ul className="grid" data-testid="bid-history">
      {bids.map((bid) => {
        const name = bid.isMine
          ? t('detail.bidYou')
          : (bid.bidder.fullName ?? bid.bidder.maskedName);
        const time = isToday(bid.createdAt)
          ? formatTime(bid.createdAt, locale)
          : formatDateTime(bid.createdAt, locale);
        return (
          <li
            key={bid.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-3 first:border-t-0"
          >
            <span className="flex min-w-0 items-center gap-3">
              <BidderMark isMine={Boolean(bid.isMine)} name={name} />
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    bid.isMine ? 'text-gold light:text-gold-lo' : 'text-foreground',
                  )}
                >
                  {name}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-tabular [unicode-bidi:isolate]">{time}</span>
                  {bid.isAutoBid ? (
                    <span className="rounded-md bg-surface-high px-1.5 text-[11px] font-medium text-foreground-soft">
                      {t('detail.bidAuto')}
                    </span>
                  ) : null}
                </span>
              </span>
            </span>
            <Price value={bid.amount} size="sm" tone={bid.isMine ? 'gold' : 'plain'} />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The round mark before a row: the crown for you, the bidder's first letter otherwise. The letter
 * is drawn by CSS so it isn't read out (or counted as text) before the name it repeats.
 */
function BidderMark({ isMine, name }: { isMine: boolean; name: string }) {
  return (
    <span
      aria-hidden
      data-initial={Array.from(name)[0]?.toUpperCase() ?? ''}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium',
        isMine
          ? 'bg-grad text-gold-ink'
          : 'bg-surface-raised text-foreground-soft before:content-[attr(data-initial)]',
      )}
    >
      {isMine ? <Icon name="crown" isFilled size={16} /> : null}
    </span>
  );
}
