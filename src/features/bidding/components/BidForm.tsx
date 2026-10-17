'use client';

import { Button, Icon, IconButton, Price } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useBidDraft, type BidDraft } from '../hooks/useBidDraft';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { AuctionPricing } from '../types/bidding.types';
import { BidError } from './BidError';
import { PlaceBidSlide } from './PlaceBidSlide';

export interface BidFormProps {
  auction: AuctionPricing;
}

/**
 * The bid inside the panel (design desktop `.stepper2` + slide): minus, your bid, plus, in whole
 * steps of the auction's increment, never under the server's minimum, then slide to bid.
 */
export function BidForm({ auction }: BidFormProps) {
  const draft = useBidDraft(auction);

  return (
    <div className="grid gap-3">
      <BidStepper draft={draft} />
      <BidNotes draft={draft} />
      <PlaceBidSlide draft={draft} auction={auction} />
      <BidError error={draft.error} />
    </div>
  );
}

/** Minus, the amount under "Your bid", plus (design `.stepper2`). */
export function BidStepper({ draft }: { draft: BidDraft }) {
  const { t } = useBiddingTranslation();
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-full border border-border-strong bg-surface p-2">
      <IconButton
        name="minus"
        tone="surface"
        label={t('form.decrease')}
        disabled={draft.amount <= draft.minimumBid}
        onClick={() => draft.setAmount(draft.amount - draft.increment)}
      />
      <div className="grid text-center">
        <small className="text-xs text-muted-foreground">{t('form.amount')}</small>
        <Price value={String(draft.amount)} size="lg" className="text-[22px]" />
      </div>
      <IconButton
        name="plus"
        tone="surface"
        label={t('form.increase')}
        onClick={() => draft.setAmount(draft.amount + draft.increment)}
      />
    </div>
  );
}

/** The minimum, and what changed under the user: a risen floor, or a bid that reaches buy now. */
export function BidNotes({ draft, hasMinimum = true }: { draft: BidDraft; hasMinimum?: boolean }) {
  const { t } = useBiddingTranslation();
  const { money } = useMoney();
  const minimum = money(String(draft.minimumBid));
  return (
    <>
      {hasMinimum ? (
        <p className="text-xs text-muted-foreground">
          {t('form.minimumHint', { amount: minimum })}
        </p>
      ) : null}
      {draft.priceMoved ? (
        <div className="grid gap-2 rounded-lg bg-warning-soft p-3.5">
          <p role="status" className="flex gap-2 text-[13px] font-medium text-warning">
            <Icon name="rising" size={16} className="mt-0.5 shrink-0" />
            {t('form.priceMoved', { amount: minimum })}
          </p>
          <Button
            variant="soft"
            size="sm"
            className="justify-self-start"
            onClick={draft.adoptMinimum}
          >
            {t('form.confirmNewAmount', { amount: minimum })}
          </Button>
        </div>
      ) : null}
      {draft.reachesBuyNow ? (
        <p role="status" className="text-[13px] font-medium text-foreground">
          {t('form.bidBuysNow')}
        </p>
      ) : null}
    </>
  );
}
