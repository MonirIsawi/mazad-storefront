'use client';

import { useState, type ReactNode } from 'react';
import { Button, Card, Icon, Price } from '@shared/components/ui';
import { BottomActionBar } from '@shared/components/ios';
import { toMinorUnits } from '@shared/lib';
import { computeMinimumBid } from '../lib/computeMinimumBid';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { useMyStanding } from '../hooks/useMyStanding';
import type { AuctionPricing } from '../types/bidding.types';
import { AutoBidSummary } from './AutoBidSummary';
import { BidForm } from './BidForm';
import { AddressFirstNotice, AddressFirstSheet } from './sheet/AddressFirstSheet';
import { BidSheet } from './sheet/BidSheet';
import { BuyNowSheet } from './sheet/BuyNowSheet';

type OpenSheet = 'bid' | 'auto' | 'buy' | 'address' | null;

/** Buy now only while the bidding hasn't reached it (the server refuses it after that). */
function buyNowPriceOf(pricing: AuctionPricing): string | null {
  const buyNow = toMinorUnits(pricing.buyNowPrice);
  const current = toMinorUnits(pricing.currentPrice);
  return buyNow != null && (current == null || current < buyNow) ? pricing.buyNowPrice : null;
}

/**
 * What a buyer can do on a live auction. Desktop: the bid right in the panel, with Buy now and
 * Auto-bid beside each other. Phones: Buy now and automatic bidding as rows, and the bid bar
 * pinned to the foot (the lowest next bid and "Bid", which opens the bid sheet). Without a saved
 * address every one of them asks for an address first (a win becomes an order at once).
 */
export function LiveActions({
  pricing,
  deliveryLine,
  isSheetOpenOnLoad = false,
  needsAddress = false,
}: {
  pricing: AuctionPricing;
  deliveryLine?: ReactNode;
  /** Signed in with no saved address: prompt for one instead of opening a sheet. */
  needsAddress?: boolean;
  /** Arrived from "Bid" on My bids: the sheet opens at once. */
  isSheetOpenOnLoad?: boolean;
}) {
  const { t } = useBiddingTranslation();
  const [requested, setSheet] = useState<OpenSheet>(isSheetOpenOnLoad ? 'bid' : null);
  const sheet = needsAddress && requested ? 'address' : requested;
  const standing = useMyStanding(pricing.id);
  const buyNowPrice = buyNowPriceOf(pricing);
  const minimumBid = computeMinimumBid(pricing) ?? 0;
  const hasAutoBid = Boolean(standing?.autoBid);

  return (
    <>
      <div className="hidden gap-3 lg:grid">
        {needsAddress ? <AddressFirstNotice /> : <BidForm auction={pricing} />}
        <div className="grid grid-cols-2 gap-2.5">
          {buyNowPrice ? (
            <Button variant="soft" onClick={() => setSheet('buy')}>
              {t('form.buyNowShort')} <Price value={buyNowPrice} size="xs" />
            </Button>
          ) : null}
          <Button
            variant="soft"
            className={buyNowPrice ? undefined : 'col-span-2'}
            onClick={() => setSheet('auto')}
          >
            <Icon name="lightning" size={18} />
            {t('autoBid.short')}
          </Button>
        </div>
      </div>

      <AutoBidSummary auctionId={pricing.id} onChange={() => setSheet('auto')} />

      {buyNowPrice ? (
        <Card className="flex items-center gap-3 p-[18px] lg:hidden">
          <span className="grid min-w-0 flex-1">
            <span className="text-[13px] text-foreground-soft">{t('buyNow.cardKicker')}</span>
            <b className="font-medium text-foreground">
              {t('buyNow.cardTitle')} <Price value={buyNowPrice} size="sm" />
            </b>
          </span>
          <Button variant="line" size="sm" onClick={() => setSheet('buy')}>
            {t('form.buyNowShort')}
          </Button>
        </Card>
      ) : null}
      {hasAutoBid ? null : (
        <button
          type="button"
          onClick={() => setSheet('auto')}
          className="grid min-h-[62px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[22px] border border-border bg-surface px-3.5 py-2 text-start lg:hidden"
        >
          <span
            aria-hidden
            className="grid size-11 place-items-center rounded-[14px] border bg-tile"
          >
            <Icon name="lightning" tone="gold" size={24} isFilled />
          </span>
          <span className="grid leading-[1.35]">
            <b className="text-[15px] font-medium">{t('autoBid.title')}</b>
            <small className="text-[12.5px] text-foreground-soft">{t('autoBid.rowHint')}</small>
          </span>
          <span
            aria-hidden
            className="h-[30px] w-[50px] rounded-full border border-border-strong bg-surface-high p-[3px]"
          >
            <span className="block size-[22px] rounded-full bg-muted-foreground" />
          </span>
        </button>
      )}

      <BottomActionBar>
        <span className="grid min-w-0 flex-1 ps-3">
          <small className="text-xs text-muted-foreground">{t('bar.lowestNext')}</small>
          <Price value={String(minimumBid)} size="lg" />
        </span>
        <Button className="px-7" onClick={() => setSheet('bid')}>
          <Icon name="paddle" size={20} />
          {t('bar.bid')}
        </Button>
      </BottomActionBar>

      {sheet === 'bid' || sheet === 'auto' ? (
        <BidSheet
          auction={pricing}
          startWithAutoBid={sheet === 'auto'}
          deliveryLine={deliveryLine}
          onBuyNow={buyNowPrice ? () => setSheet('buy') : undefined}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === 'address' ? <AddressFirstSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'buy' && buyNowPrice ? (
        <BuyNowSheet auction={pricing} buyNowPrice={buyNowPrice} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}
