import type { MyStanding } from '../types/bidding.types';

/** The one line telling the viewer where they stand on an auction, highest priority first. */
export type UserState =
  | { kind: 'own' }
  | { kind: 'won' }
  | { kind: 'soldToOther' }
  | { kind: 'ended' }
  | { kind: 'notStarted' }
  | { kind: 'signIn' }
  | { kind: 'paused' }
  | { kind: 'autoBid'; maxAmount: string }
  | { kind: 'leading' }
  | { kind: 'outbid' }
  | { kind: 'canBid' };

export interface UserStateInput {
  status: string;
  isOwnAuction: boolean;
  /** The viewer won it (GET /me/wins). */
  isWinner: boolean;
  isAuthenticated: boolean;
  /** Two violations paused this account's bidding (GET /me biddingPaused). */
  isBiddingPaused?: boolean;
  standing: MyStanding | null;
}

/**
 * Exactly one state, in a fixed priority so the page never shows two that disagree: the seller's
 * own auction, a win, a sale to someone else, closed, not started, signed out, bidding paused
 * after violations, then the signed-in bidder's standing (an active auto-bid, leading, outbid, or
 * free to bid).
 */
export function userStateOf({
  status,
  isOwnAuction,
  isWinner,
  isAuthenticated,
  isBiddingPaused = false,
  standing,
}: UserStateInput): UserState {
  if (isOwnAuction) return { kind: 'own' };
  if (isWinner) return { kind: 'won' };
  if (status === 'SOLD') return { kind: 'soldToOther' };
  if (status === 'SCHEDULED') return { kind: 'notStarted' };
  if (status !== 'LIVE') return { kind: 'ended' };
  if (!isAuthenticated) return { kind: 'signIn' };
  if (isBiddingPaused) return { kind: 'paused' };
  if (standing?.autoBid && !standing.autoBid.exhausted) {
    return { kind: 'autoBid', maxAmount: standing.autoBid.maxAmount };
  }
  if (standing?.leading) return { kind: 'leading' };
  if (standing?.myHighestBid) return { kind: 'outbid' };
  return { kind: 'canBid' };
}
