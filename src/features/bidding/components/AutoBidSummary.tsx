'use client';

import { Button, Icon } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { cn } from '@shared/lib';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { useCancelAutoBid } from '../hooks/useCancelAutoBid';
import { useMyStanding } from '../hooks/useMyStanding';
import { BidError } from './BidError';

/**
 * An auto-bid set earlier (the server's, GET /auctions/:id/me, so it survives a reload): its limit
 * is the banner's; this row says when the price passed it, and offers Change and Turn off.
 */
export function AutoBidSummary({
  auctionId,
  onChange,
}: {
  auctionId: string;
  onChange: () => void;
}) {
  const { t } = useBiddingTranslation();
  const { money } = useMoney();
  const active = useMyStanding(auctionId)?.autoBid ?? null;
  const cancelAutoBid = useCancelAutoBid(auctionId);
  if (!active) return null;

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-2 text-sm',
            active.exhausted ? 'text-destructive' : 'text-foreground-soft',
          )}
          data-testid="auto-bid-active"
        >
          <Icon name="lightning" size={16} isFilled className="shrink-0" />
          {active.exhausted
            ? t('autoBid.exhausted', { amount: money(active.maxAmount) })
            : t('autoBid.label')}
        </span>
        <span className="flex gap-1">
          <Button variant="plain" size="sm" onClick={onChange}>
            {t('autoBid.change')}
          </Button>
          <Button
            variant="plain"
            size="sm"
            isLoading={cancelAutoBid.isPending}
            onClick={() => cancelAutoBid.mutate(undefined)}
          >
            {t('autoBid.cancel')}
          </Button>
        </span>
      </div>
      <BidError error={cancelAutoBid.error} />
    </div>
  );
}
