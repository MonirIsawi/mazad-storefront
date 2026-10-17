'use client';

import type { ReactNode } from 'react';
import { Card, CardTitle } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { auctionPrices } from '../../lib/auction-prices';
import type { Auction } from '../../types/catalog.types';

/** mazad-api's default return window, for builds that don't send returnWindowDays. */
const DEFAULT_RETURN_DAYS = 7;

/**
 * Delivery and payment (design `.kv` card): the delivery fee from the store's city, buy now with
 * its total including delivery while it can still be used, the seller's new retail price, the
 * ways to pay (cash on delivery always, card when mazad-api offers it) and the return window.
 * Paying is chosen after winning, on the order.
 */
export function DeliveryPaymentCard({ auction }: { auction: Auction }) {
  const { t } = useCatalogTranslation();
  const { money } = useMoney();
  const prices = auctionPrices(auction);
  const acceptsCard = auction.paymentMethods?.includes('CARD') ?? false;
  const returnDays = auction.returnWindowDays ?? DEFAULT_RETURN_DAYS;

  return (
    <Card data-testid="detail-delivery-payment">
      <CardTitle>{t('detail.deliveryPayment')}</CardTitle>
      <div className="grid px-[18px] pt-1.5 pb-2">
        <Row label={t('price.deliveryFrom', { city: auction.store.city })} testId="price-delivery">
          {prices.isDeliveryFree ? t('price.noDeliveryFee') : money(prices.deliveryFee)}
        </Row>
        {prices.buyNow ? (
          <>
            <Row label={t('price.buyNow')} testId="price-buy-now">
              {money(prices.buyNow.amount)}
            </Row>
            <Row label={t('price.buyNowTotal')} testId="price-buy-now-total" isStrong>
              {money(prices.buyNow.totalWithDelivery)}
            </Row>
            {prices.buyNow.saving ? (
              <p className="-mt-1.5 pb-2 text-xs text-muted-foreground" data-testid="price-saving">
                {t('price.saving', { amount: money(prices.buyNow.saving) })}
              </p>
            ) : null}
          </>
        ) : null}
        {prices.marketPrice ? (
          <Row label={t('price.marketPrice')} testId="price-market">
            {money(prices.marketPrice)}
          </Row>
        ) : null}
        <Row label={t('detail.payment')}>
          <ul className="flex flex-wrap justify-end gap-x-1" data-testid="detail-payment-methods">
            <li className="not-last:after:content-[','] ar:not-last:after:content-['،']">
              {t('detail.paymentCod')}
            </li>
            {acceptsCard ? <li>{t('detail.paymentCard')}</li> : null}
          </ul>
        </Row>
        <Row label={t('detail.returns')}>
          <span data-testid="detail-returns">
            {t('detail.returnsWithin', { count: returnDays })}
          </span>
        </Row>
        <p className="border-t border-border py-3 text-xs leading-[1.6] text-muted-foreground">
          {t('detail.paymentHint')}
        </p>
      </div>
    </Card>
  );
}

function Row({
  label,
  children,
  testId,
  isStrong = false,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
  isStrong?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-t border-border py-3 text-sm first:border-t-0"
      data-testid={testId}
    >
      <span className="text-foreground-soft">{label}</span>
      <span className={cn('text-end font-num text-foreground', isStrong && 'font-semibold')}>
        {children}
      </span>
    </div>
  );
}
