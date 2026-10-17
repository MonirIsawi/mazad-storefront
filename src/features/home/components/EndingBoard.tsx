'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import {
  CountdownText,
  GoldTile,
  Icon,
  Price,
  SectionHeader,
  SeeAllLink,
} from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName } from '@shared/lib';
import { useTranslation } from 'react-i18next';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import type { EndingBoard as Board } from '../lib/home-feed';
import type { HomeAuction } from '../types/home.types';

/** Desktop: the lots about to close, as rows beside each other (design `.card.framed` board). */
export function EndingBoard({ board }: { board: Board }) {
  const { t } = useHomeTranslation();
  if (board.auctions.length === 0) return null;
  const isFinalHour = board.kind === 'finalHour';

  return (
    <section className="hidden gap-x-[18px] gap-y-3 rounded-xl border border-border-strong bg-surface bg-[linear-gradient(180deg,rgb(226_180_103/5%),transparent_40%)] p-6 lg:grid lg:grid-cols-2">
      <SectionHeader
        className="col-span-2"
        icon="hourglass"
        title={isFinalHour ? t('sections.finalHour') : t('sections.endingSoonest')}
        action={
          <SeeAllLink
            href={`${ROUTES.auctions}?status=live${isFinalHour ? '&endingSoon=true' : ''}`}
          >
            {t('viewAll')}
          </SeeAllLink>
        }
      />
      {board.auctions.map((auction) => (
        <BoardRow key={auction.id} auction={auction} />
      ))}
    </section>
  );
}

function BoardRow({ auction }: { auction: HomeAuction }) {
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const name = pickLocalizedName(auction.product, locale);

  return (
    <Link
      href={ROUTES.auctionDetail(auction.id)}
      className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg py-1"
    >
      <span className="relative size-14 overflow-hidden rounded-[16px] border border-border bg-surface-raised">
        {auction.product.coverImage ? (
          <Image
            src={auction.product.coverImage}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center bg-tile">
            <GoldTile icon="package" size="sm" />
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <b className="line-clamp-1 text-sm font-medium text-foreground">{name}</b>
        <Price value={auction.currentPrice ?? auction.startingPrice} size="sm" />
        <span className="text-xs text-muted-foreground">
          {tCommon('card.bids', { count: auction.bidCount })}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <CountdownText endsAt={auction.endsAt} className="text-sm text-gold light:text-gold-lo" />
        <span className="grid size-9 place-items-center rounded-full border border-gold-line text-gold transition-colors group-hover:bg-gold-soft light:text-gold-lo">
          <Icon name="arrow-up-right" size={16} className="rtl:-scale-x-100" />
        </span>
      </span>
    </Link>
  );
}
