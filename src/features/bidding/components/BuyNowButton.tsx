'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import { getErrorCode, newIdempotencyKey } from '@shared/lib';
import { useMoney } from '@shared/hooks';
import { useBuyNow } from '../hooks/useBuyNow';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';

export interface BuyNowButtonProps {
  auctionId: string;
  buyNowPrice: string;
}

export function BuyNowButton({ auctionId, buyNowPrice }: BuyNowButtonProps) {
  const { t } = useBiddingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { money } = useMoney();
  const buyNow = useBuyNow(auctionId);
  const errorCode = getErrorCode(buyNow.error);
  // A purchase is never one tap: the first tap asks, the second buys.
  const [confirming, setConfirming] = useState(false);
  // One key per purchase intent, reused if the confirmation is retried after an error/timeout.
  const intentKey = useRef<string | null>(null);

  function confirm() {
    intentKey.current ??= newIdempotencyKey();
    buyNow.mutate(intentKey.current, {
      onSuccess: () => {
        intentKey.current = null;
        setConfirming(false);
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <>
          <p role="status" className="text-footnote text-muted-foreground">
            {t('form.buyNowConfirmHint', { amount: money(buyNowPrice) })}
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" isLoading={buyNow.isPending} onClick={confirm}>
              {t('form.confirmBuyNow', { amount: money(buyNowPrice) })}
            </Button>
            <Button
              variant="gray"
              disabled={buyNow.isPending}
              onClick={() => {
                intentKey.current = null;
                setConfirming(false);
              }}
            >
              {t('form.cancel')}
            </Button>
          </div>
        </>
      ) : (
        <Button variant="gray" onClick={() => setConfirming(true)}>
          {t('form.buyNow', { amount: money(buyNowPrice) })}
        </Button>
      )}
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
    </div>
  );
}
