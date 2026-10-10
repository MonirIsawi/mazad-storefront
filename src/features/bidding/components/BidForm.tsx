'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon } from '@shared/components/ui';
import { BottomActionBar, Stepper } from '@shared/components/ios';
import { getErrorCode, newIdempotencyKey, parseMoney, roundMoney } from '@shared/lib';
import { useMoney } from '@shared/hooks';
import { ROUTES } from '@shared/constants';
import { computeMinimumBid } from '../lib/computeMinimumBid';
import { usePlaceBid } from '../hooks/usePlaceBid';
import { useMyStanding } from '../hooks/useMyStanding';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { AuctionPricing } from '../types/bidding.types';

export interface BidFormProps {
  auction: AuctionPricing;
}

/**
 * The bid card plus the screen's pinned CTA. The amount is a Stepper rather than a free-text
 * field: bids move in the auction's own `minIncrement`, so stepping is both faster and
 * impossible to get wrong — the value can never fall below the server's minimum.
 */
export function BidForm({ auction }: BidFormProps) {
  const { t } = useBiddingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { money } = useMoney();
  const placeBid = usePlaceBid(auction.id);
  const standing = useMyStanding(auction.id);

  const minimumBid = computeMinimumBid(auction) ?? 0;
  // The raise at this price level (the server's ladder), else the auction's fixed increment.
  const increment = parseMoney(auction.bidIncrement ?? auction.minIncrement) ?? 1;
  const [chosenAmount, setChosenAmount] = useState(minimumBid);

  // Another bidder raising the price moves the floor under us. Clamping during render rather
  // than syncing in an effect means the displayed amount is never briefly below what the server
  // would accept, and a deliberately higher bid is still preserved.
  const amount = Math.max(chosenAmount, minimumBid);
  // The floor rose above what the user picked: the next tap only adopts the new amount, so a bid
  // is never sent for more than the user had in front of them when they decided.
  const priceMoved = chosenAmount < minimumBid;
  const buyNowPrice = parseMoney(auction.buyNowPrice);
  const reachesBuyNow = buyNowPrice != null && amount >= buyNowPrice;

  // One Idempotency-Key per bid intent (auction + amount): retrying the same bid after a timeout
  // reuses it, so a bid the server already committed is never placed twice.
  const intent = useRef<{ amount: number; key: string } | null>(null);
  function submit() {
    if (priceMoved) {
      setChosenAmount(minimumBid);
      return;
    }
    if (intent.current?.amount !== amount) {
      intent.current = { amount, key: newIdempotencyKey() };
    }
    placeBid.mutate(
      { amount, idempotencyKey: intent.current.key },
      {
        onSuccess: () => {
          intent.current = null;
        },
      },
    );
  }

  const errorCode = getErrorCode(placeBid.error);

  return (
    <>
      <Card isInset className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-subhead font-semibold text-foreground">{t('form.amount')}</span>
          <Stepper
            value={amount}
            min={minimumBid}
            step={increment}
            // Stepper adds in floating point; snap every step to exact 2-decimal money.
            onChange={(next) => setChosenAmount(roundMoney(next))}
            displayValue={money(String(amount))}
            decrementLabel={t('form.decrease')}
            incrementLabel={t('form.increase')}
          />
        </div>
        <p className="text-caption text-muted-foreground">
          {t('form.minimumHint', { amount: money(String(minimumBid)) })}
        </p>
        {standing?.leading ? (
          <p
            role="status"
            className="text-footnote font-semibold text-success"
            data-testid="bid-leading"
          >
            {t('form.leading')}
          </p>
        ) : standing?.myHighestBid ? (
          <p
            role="status"
            className="text-footnote font-semibold text-warning"
            data-testid="bid-outbid"
          >
            {t('form.outbid')}
          </p>
        ) : null}
        {priceMoved ? (
          <p role="status" className="text-footnote font-semibold text-warning">
            {t('form.priceMoved', { amount: money(String(minimumBid)) })}
          </p>
        ) : null}
        {reachesBuyNow ? (
          <p role="status" className="text-footnote font-semibold text-foreground">
            {t('form.bidBuysNow')}
          </p>
        ) : null}

        {errorCode ? (
          <p role="alert" className="flex items-start gap-1.5 text-footnote text-destructive">
            <Icon name="x" size={14} className="mt-0.5" />
            <span>
              {errorCode === 'ADDRESS_REQUIRED' ? (
                <>
                  {t('errors.ADDRESS_REQUIRED')}{' '}
                  <Link href={ROUTES.addressesList} className="font-semibold underline">
                    {t('errors.addAddressLink')}
                  </Link>
                </>
              ) : (
                t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })
              )}
            </span>
          </p>
        ) : null}
      </Card>

      <BottomActionBar>
        <div className="flex min-w-0 flex-col">
          <span className="text-caption text-muted-foreground">{t('form.amount')}</span>
          <span className="truncate text-title-3 font-extrabold text-foreground tabular-nums">
            {money(String(amount))}
          </span>
        </div>
        <Button
          size="lg"
          hasShadow
          className="flex-[1.3]"
          isLoading={placeBid.isPending}
          onClick={submit}
        >
          {priceMoved
            ? t('form.confirmNewAmount', { amount: money(String(minimumBid)) })
            : t('form.placeBid')}
        </Button>
      </BottomActionBar>
    </>
  );
}
