'use client';

import { useState } from 'react';
import { ConfirmDialog, SlideToConfirm } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import type { BidDraft } from '../hooks/useBidDraft';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { isLargeBid } from '../lib/bid-amount';
import type { AuctionPricing } from '../types/bidding.types';

/**
 * Slide to bid: money never moves on a single tap (a tap, Enter or a screen reader opens a
 * confirmation instead). A bid over three times the top bid asks once more before it goes, to
 * catch a slipped digit. Disabled while the floor moved under the chosen amount.
 */
export function PlaceBidSlide({
  draft,
  auction,
  onPlaced,
}: {
  draft: BidDraft;
  auction: AuctionPricing;
  /** After the server took the bid (the sheet closes). */
  onPlaced?: () => void;
}) {
  const { t } = useBiddingTranslation();
  const { money, number } = useMoney();
  const [isAskingLarge, setIsAskingLarge] = useState(false);
  const amount = money(String(draft.amount));
  const place = async () => {
    const isPlaced = await draft.place();
    if (isPlaced) onPlaced?.();
    return isPlaced;
  };

  return (
    <>
      <SlideToConfirm
        // The number alone fits the track (as in the design); the confirmation names the currency.
        label={t('form.slideToBid', { amount: number(draft.amount) })}
        doneLabel={t('form.bidPlaced')}
        icon="gavel"
        isDisabled={draft.priceMoved}
        isPending={draft.isPending}
        confirmTitle={t('form.confirmTitle', { amount })}
        confirmBody={t('form.binding')}
        confirmLabel={t('form.placeBid')}
        onConfirm={() => {
          if (isLargeBid(draft.amount, auction.currentPrice, auction.startingPrice)) {
            setIsAskingLarge(true);
            return false;
          }
          return place();
        }}
      />
      <ConfirmDialog
        isOpen={isAskingLarge}
        title={t('form.largeTitle')}
        body={t('form.largeBody', {
          amount,
          top: money(auction.currentPrice ?? auction.startingPrice),
        })}
        confirmLabel={t('form.largeConfirm', { amount })}
        onCancel={() => setIsAskingLarge(false)}
        onConfirm={() => {
          setIsAskingLarge(false);
          void place();
        }}
      />
    </>
  );
}
