'use client';

import { SlideToConfirm } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { autoBidFormSchema } from '../../schemas/bidding.schema';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import { useSetAutoBid } from '../../hooks/useSetAutoBid';
import { BidError } from '../BidError';

/**
 * Slide to start (or change) an auto-bid: a money action like a bid, since it can bid at once.
 * The maximum must be a valid amount at or above the lowest next bid before the slide wakes up.
 */
export function AutoBidSlide({
  auctionId,
  maximum,
  minimumBid,
  isUpdate,
  onDone,
}: {
  auctionId: string;
  maximum: number | null;
  minimumBid: number;
  isUpdate: boolean;
  onDone: () => void;
}) {
  const { t } = useBiddingTranslation();
  const { money } = useMoney();
  const setAutoBid = useSetAutoBid(auctionId);
  const parsed = autoBidFormSchema.safeParse({ maxAmount: maximum ?? Number.NaN });
  const isTooLow = maximum != null && maximum < minimumBid;
  const isValid = parsed.success && !isTooLow;
  const amount = maximum != null ? money(String(maximum)) : '';

  return (
    <div className="grid gap-2.5">
      {isTooLow ? (
        <p role="status" className="text-[13px] font-medium text-warning">
          {t('autoBid.belowMinimum', { amount: money(String(minimumBid)) })}
        </p>
      ) : null}
      <BidError error={setAutoBid.error} />
      <SlideToConfirm
        label={isUpdate ? t('autoBid.slideUpdate', { amount }) : t('autoBid.slide', { amount })}
        doneLabel={t('toast.autoBidSet')}
        icon="lightning"
        isDisabled={!isValid}
        isPending={setAutoBid.isPending}
        confirmTitle={t('autoBid.confirmTitle', { amount })}
        confirmBody={t('autoBid.confirmBody')}
        confirmLabel={t('autoBid.submit')}
        onConfirm={async () => {
          if (!isValid || maximum == null) return false;
          try {
            await setAutoBid.mutateAsync(maximum);
            onDone();
            return true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}
