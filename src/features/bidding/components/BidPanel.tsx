'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { ErrorState } from '@shared/components/feedback';
import { Card, Skeleton, buttonVariants } from '@shared/components/ui';
import { BottomActionBar } from '@shared/components/ios';
import { useIsAuthenticated } from '@shared/hooks';
import { useAuctionPricing } from '../hooks/useAuctionPricing';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { BidForm } from './BidForm';
import { BuyNowButton } from './BuyNowButton';
import { AutoBidControl } from './AutoBidControl';
import { closedMessageKey } from '../lib/closed-message';

export interface BidPanelProps {
  auctionId: string;
  /** The viewer is this auction's seller: nothing to bid (mazad-api OWN_AUCTION_BID). */
  isOwnAuction?: boolean;
}

export function BidPanel({ auctionId, isOwnAuction = false }: BidPanelProps) {
  const { t, isReady } = useBiddingTranslation();
  const isAuthenticated = useIsAuthenticated();
  const pricing = useAuctionPricing(auctionId);

  // A skeleton the size of the real bid card, so the CTA doesn't jump into place under the
  // user's thumb once pricing resolves.
  if (!isReady || pricing.isPending) return <Skeleton radius="lg" className="h-28 w-full" />;

  if (pricing.isError || !pricing.data) {
    return <ErrorState message={t('panel.loadError')} onRetry={() => void pricing.refetch()} />;
  }

  if (pricing.data.status !== 'LIVE') {
    return (
      <BottomActionBar>
        <span className="w-full py-3 text-center text-subhead text-muted-foreground">
          {t(closedMessageKey(pricing.data.status))}
        </span>
      </BottomActionBar>
    );
  }

  if (!isAuthenticated) {
    return (
      <BottomActionBar>
        <Link href={ROUTES.login} className={buttonVariants({ size: 'lg', isFullWidth: true })}>
          {t('panel.signInToBid')}
        </Link>
      </BottomActionBar>
    );
  }

  // The seller looking at their own live auction: say so instead of a bid they can't place.
  if (isOwnAuction) {
    return (
      <BottomActionBar>
        <span className="w-full py-3 text-center text-subhead text-muted-foreground">
          {t('panel.ownAuction')}
        </span>
      </BottomActionBar>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <BidForm auction={pricing.data} />
      {pricing.data.buyNowPrice ? (
        <Card isInset>
          <BuyNowButton auctionId={auctionId} buyNowPrice={pricing.data.buyNowPrice} />
        </Card>
      ) : null}
      <AutoBidControl auctionId={auctionId} />
    </div>
  );
}
