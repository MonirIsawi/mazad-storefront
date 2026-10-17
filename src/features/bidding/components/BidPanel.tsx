'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { ErrorState } from '@shared/components/feedback';
import { Icon, Skeleton, buttonVariants } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { useAuctionPricing } from '../hooks/useAuctionPricing';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import { useMyStanding } from '../hooks/useMyStanding';
import { computeMinimumBid } from '../lib/computeMinimumBid';
import { userStateOf } from '../lib/user-state';
import { HammerStrike } from './hammer/HammerStrike';
import { LiveActions } from './LiveActions';
import { PanelBar } from './PanelBar';
import { StandingBanner } from './StandingBanner';

export interface BidPanelProps {
  auctionId: string;
  /** The viewer is this auction's seller: nothing to bid (mazad-api OWN_AUCTION_BID). */
  isOwnAuction?: boolean;
  /**
   * The viewer won this auction (from GET /me/wins, composed by the route): its order, or null
   * while auto-fulfilment is still creating it. Absent for everyone else.
   */
  winner?: { orderId: string | null } | null;
  /** The wins are still loading for a closed auction: wait rather than say "sold to another". */
  isCheckingWin?: boolean;
  /** Before it opens: the reminder (the watchlist feature: WATCHED_AUCTION_STARTING). */
  reminder?: ReactNode;
  /** "Delivers to: …" in the bid sheet (the addresses feature). */
  deliveryLine?: ReactNode;
  /** Open the bid sheet at once (arrived from "Bid" on My bids). */
  isSheetOpenOnLoad?: boolean;
}

/**
 * The viewer's standing on the auction (one banner, see userStateOf) and what they can do about
 * it: bid, buy now and auto-bid for a buyer on a live auction, the way to the order for the winner,
 * a reminder before it opens, sign-in for a guest. The seller's own auction gets the state only.
 */
export function BidPanel({
  auctionId,
  isOwnAuction = false,
  winner = null,
  isCheckingWin = false,
  reminder,
  deliveryLine,
  isSheetOpenOnLoad = false,
}: BidPanelProps) {
  const { t, isReady } = useBiddingTranslation();
  const isAuthenticated = useIsAuthenticated();
  const pricing = useAuctionPricing(auctionId);
  const standing = useMyStanding(auctionId);

  // A skeleton the size of the real panel, so nothing jumps into place under the thumb.
  if (!isReady || pricing.isPending || isCheckingWin) {
    return <Skeleton radius="lg" className="h-28 w-full" />;
  }
  if (pricing.isError || !pricing.data) {
    return <ErrorState message={t('panel.loadError')} onRetry={() => void pricing.refetch()} />;
  }

  const state = userStateOf({
    status: pricing.data.status,
    isOwnAuction,
    isWinner: Boolean(winner),
    isAuthenticated,
    standing,
  });

  // Signed out on a live auction: the sign-in button is the state.
  if (state.kind === 'signIn') {
    return (
      <PanelBar>
        <Link href={ROUTES.login} className={buttonVariants({ isFullWidth: true })}>
          {t('panel.signInToBid')}
        </Link>
      </PanelBar>
    );
  }

  const canBid = pricing.data.status === 'LIVE' && state.kind !== 'own' && state.kind !== 'won';

  return (
    <div className="grid gap-3">
      <StandingBanner state={state} minimumBid={computeMinimumBid(pricing.data) ?? undefined} />

      {/* A win is final: the order already exists, so the only action is to open it. */}
      {state.kind === 'won' && winner ? (
        <>
          <HammerStrike auctionId={auctionId} />
          <PanelBar>
            <Link
              href={winner.orderId ? ROUTES.orderDetail(winner.orderId) : ROUTES.wins}
              className={buttonVariants({ isFullWidth: true })}
              data-testid="won-view-order"
            >
              <Icon name="package" size={20} />
              {t(winner.orderId ? 'panel.wonViewOrder' : 'panel.wonViewWins')}
            </Link>
          </PanelBar>
        </>
      ) : null}

      {state.kind === 'notStarted' && reminder ? <PanelBar>{reminder}</PanelBar> : null}

      {canBid ? (
        <LiveActions
          pricing={pricing.data}
          deliveryLine={deliveryLine}
          isSheetOpenOnLoad={isSheetOpenOnLoad}
        />
      ) : null}
    </div>
  );
}
