'use client';

import { useRef } from 'react';
import { Button, Notice, Sheet, SlideToConfirm } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { fromMinorUnits, newIdempotencyKey, pickLocalizedName, toMinorUnits } from '@shared/lib';
import { useBuyNow } from '../../hooks/useBuyNow';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import type { AuctionPricing } from '../../types/bidding.types';
import { BidError } from '../BidError';

/**
 * Buy now (design `buy-now`): it ends the auction for everyone, so the sheet spells out the price,
 * the delivery and the total, says payment is chosen on the order afterwards, and asks for the
 * slide. One Idempotency-Key per purchase intent, reused if the confirmation is retried.
 */
export function BuyNowSheet({
  auction,
  buyNowPrice,
  onClose,
}: {
  auction: AuctionPricing;
  buyNowPrice: string;
  onClose: () => void;
}) {
  const { t } = useBiddingTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const buyNow = useBuyNow(auction.id);
  const intentKey = useRef<string | null>(null);
  const fee = auction.deliveryFee ?? auction.store?.deliveryFee ?? null;
  const total =
    fee != null
      ? String(fromMinorUnits((toMinorUnits(buyNowPrice) ?? 0) + (toMinorUnits(fee) ?? 0)))
      : null;
  const name = auction.product ? pickLocalizedName(auction.product, locale) : t('buyNow.title');

  const confirm = async () => {
    intentKey.current ??= newIdempotencyKey();
    try {
      await buyNow.mutateAsync(intentKey.current);
      intentKey.current = null;
      onClose();
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Sheet
      isOpen
      onClose={onClose}
      title={name}
      description={t('buyNow.endsNow')}
      footer={
        <div className="grid gap-2.5">
          <SlideToConfirm
            label={t('buyNow.slide')}
            doneLabel={t('buyNow.done')}
            icon="bag"
            isPending={buyNow.isPending}
            confirmTitle={t('form.confirmBuyNow', { amount: money(buyNowPrice) })}
            confirmBody={t('form.buyNowConfirmHint', { amount: money(buyNowPrice) })}
            confirmLabel={t('buyNow.confirm')}
            onConfirm={confirm}
          />
          <Button variant="soft" isFullWidth onClick={onClose}>
            {t('buyNow.back')}
          </Button>
        </div>
      }
    >
      <dl className="grid" data-testid="buy-now-summary">
        <Row label={t('buyNow.price')} value={money(buyNowPrice)} />
        {fee != null ? <Row label={t('buyNow.delivery')} value={money(fee)} /> : null}
        {total != null ? <Row label={t('buyNow.total')} value={money(total)} isTotal /> : null}
      </dl>
      <Notice>{t('buyNow.payLater')}</Notice>
      <BidError error={buyNow.error} />
    </Sheet>
  );
}

function Row({
  label,
  value,
  isTotal = false,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border py-3.5 first:border-t-0">
      <dt className={isTotal ? 'font-semibold text-foreground' : 'text-sm text-foreground-soft'}>
        {label}
      </dt>
      <dd
        className={
          isTotal
            ? 'font-num text-xl text-gold light:text-gold-lo'
            : 'font-num text-sm text-foreground'
        }
      >
        {value}
      </dd>
    </div>
  );
}
