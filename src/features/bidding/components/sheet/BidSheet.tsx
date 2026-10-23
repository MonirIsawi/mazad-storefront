'use client';

import { useState, type ReactNode } from 'react';
import { Button, Icon, Sheet } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { parseMoney } from '@shared/lib';
import { useBidDraft } from '../../hooks/useBidDraft';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import { useCancelAutoBid } from '../../hooks/useCancelAutoBid';
import { useMyStanding } from '../../hooks/useMyStanding';
import type { AuctionPricing } from '../../types/bidding.types';
import { BidError } from '../BidError';
import { BidNotes } from '../BidForm';
import { PlaceBidSlide } from '../PlaceBidSlide';
import { AutoBidSection } from './AutoBidSection';
import { AutoBidSlide } from './AutoBidSlide';
import { BidAmountField } from './BidAmountField';

export interface BidSheetProps {
  auction: AuctionPricing;
  /** Opened from "Auto-bid": the switch starts on. */
  startWithAutoBid?: boolean;
  /** "Delivers to: …" with a way to change it (composed in from the addresses feature). */
  deliveryLine?: ReactNode;
  onBuyNow?: () => void;
  onClose: () => void;
}

/**
 * Place a bid (design `bid-sheet`): every amount is valid by construction. The stepper and the
 * quick amounts move in whole steps, a typed amount is rounded up to the next one, and auto-bid
 * takes a private maximum. The binding line sits right above the slide. Mounted only while open.
 */
export function BidSheet({
  auction,
  startWithAutoBid = false,
  deliveryLine,
  onBuyNow,
  onClose,
}: BidSheetProps) {
  const { t } = useBiddingTranslation();
  const { money } = useMoney();
  const draft = useBidDraft(auction);
  const standing = useMyStanding(auction.id);
  const active = standing?.autoBid ?? null;
  const cancelAutoBid = useCancelAutoBid(auction.id);
  const [isAuto, setIsAuto] = useState(startWithAutoBid || Boolean(active && !active.exhausted));
  const [maximum, setMaximum] = useState<number | null>(parseMoney(active?.maxAmount) ?? null);
  const topBid = parseMoney(auction.currentPrice ?? auction.startingPrice) ?? 0;

  return (
    <Sheet
      isOpen
      onClose={onClose}
      width="lg"
      title={t('sheet.title')}
      description={
        auction.currentPrice
          ? t('sheet.topBidNow', { amount: money(auction.currentPrice) })
          : t('sheet.openingPrice', { amount: money(auction.startingPrice) })
      }
      footer={
        isAuto ? (
          <AutoBidSlide
            auctionId={auction.id}
            maximum={maximum}
            minimumBid={draft.minimumBid}
            isUpdate={Boolean(active)}
            onDone={onClose}
          />
        ) : (
          <PlaceBidSlide draft={draft} auction={auction} onPlaced={onClose} />
        )
      }
    >
      {isAuto ? null : (
        <>
          <BidAmountField draft={draft} topBid={topBid} />
          <p className="flex gap-2 text-[13px] leading-[1.6] text-foreground-soft">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-gold" />
            <span>
              {t(auction.incrementLadder ? 'sheet.ruleLadder' : 'sheet.rule', {
                step: money(String(draft.increment)),
                minimum: money(String(draft.minimumBid)),
              })}
            </span>
          </p>
          <BidNotes draft={draft} hasMinimum={false} />
        </>
      )}
      <AutoBidSection
        isOn={isAuto}
        onToggle={setIsAuto}
        maximum={maximum}
        onMaximum={setMaximum}
        minimumBid={draft.minimumBid}
        increment={draft.increment}
        isLeading={Boolean(standing?.leading)}
        buyNowPrice={parseMoney(auction.buyNowPrice)}
        onBuyNow={onBuyNow}
        turnOff={
          active ? (
            <Button
              variant="dangerLine"
              size="sm"
              className="justify-self-start"
              isLoading={cancelAutoBid.isPending}
              onClick={() => cancelAutoBid.mutate(undefined, { onSuccess: onClose })}
            >
              {t('autoBid.cancel')}
            </Button>
          ) : undefined
        }
      />
      <BidError error={draft.error ?? cancelAutoBid.error} />
      {deliveryLine}
      <p className="flex gap-2 text-[13px] leading-[1.6] text-foreground-soft">
        <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-gold" />
        <span>{t('form.bindingLong')}</span>
      </p>
    </Sheet>
  );
}
