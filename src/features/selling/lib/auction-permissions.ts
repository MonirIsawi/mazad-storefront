import type { SellerAuction, SellerAuctionStatus } from '../types/selling.types';

/**
 * What a seller may do to their own auction, mirrored from mazad-api's AuctionsService and
 * AuctionStateMachineService. Duplicated deliberately: the API is the authority and will reject
 * anything wrong, but a seller should not be offered a button that is going to 409.
 */

/** `PATCH /auctions/:id` → AUCTION_NOT_EDITABLE outside these two. */
export function canEditAuction(status: SellerAuctionStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

/** Submitting is how a draft — or a rejected auction, once fixed — re-enters the approval queue. */
export function canSubmitAuction(status: SellerAuctionStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

/**
 * `canSellerCancel`: free before anyone has committed money, and while live only if nobody has
 * bid yet. Pulling a lot out from under existing bidders is an admin-only force-cancel.
 */
export function canCancelAuction(auction: Pick<SellerAuction, 'status' | 'bidCount'>): boolean {
  if (
    auction.status === 'DRAFT' ||
    auction.status === 'SCHEDULED' ||
    auction.status === 'REJECTED'
  ) {
    return true;
  }
  if (auction.status === 'LIVE') return auction.bidCount === 0;
  return false;
}

/** Statuses where the auction is done and nothing further can be done to it. */
/** A sale that stands (a cancelled sale's product is free again). */
export function isSaleFinal(auction: Pick<SellerAuction, 'status' | 'saleCancelled'>): boolean {
  return auction.status === 'SOLD' && !auction.saleCancelled;
}

/** "List again": unsold, cancelled, or a sale that was cancelled (the API refuses a standing sale). */
export function canRelistAuction(
  auction: Pick<SellerAuction, 'status' | 'saleCancelled'>,
): boolean {
  return (
    auction.status === 'UNSOLD' ||
    auction.status === 'CANCELLED' ||
    (auction.status === 'SOLD' && auction.saleCancelled === true)
  );
}

export function isAuctionSettled(status: SellerAuctionStatus): boolean {
  return status === 'SOLD' || status === 'UNSOLD' || status === 'CANCELLED' || status === 'ENDED';
}

/** Maps an auction status onto the Badge tones the rest of the app already uses. */
export function getSellerAuctionTone(
  status: SellerAuctionStatus,
): 'live' | 'upcoming' | 'warning' | 'neutral' {
  switch (status) {
    case 'LIVE':
      return 'live';
    case 'SCHEDULED':
    case 'PENDING_APPROVAL':
      return 'upcoming';
    case 'REJECTED':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** mazad-api NON_TERMINAL_AUCTION_STATUSES: the product can't be edited or deleted (PRODUCT_FROZEN). */
const FREEZING_STATUSES: readonly SellerAuctionStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'SCHEDULED',
  'LIVE',
  'ENDED',
];

/** mazad-api AuctionsService.create: a new auction needs every earlier one to be terminal. */
const BLOCKS_NEW_AUCTION: readonly SellerAuctionStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'SCHEDULED',
  'LIVE',
];

export type ProductAuctionState = {
  /** The auction that decides what the product card offers (shown as its badge), if any. */
  status: SellerAuctionStatus | null;
  canEdit: boolean;
  canDelete: boolean;
  canAuction: boolean;
};

/**
 * What a product card may offer, given the seller's auctions: a product in a running auction is
 * frozen (edit/delete → PRODUCT_FROZEN), can't get a second auction (PRODUCT_ALREADY_AUCTIONED),
 * and a sold product is not put up again.
 */
export function productAuctionState(
  productId: string,
  auctions: readonly Pick<SellerAuction, 'status' | 'product' | 'saleCancelled'>[],
): ProductAuctionState {
  const own = auctions.filter((auction) => auction.product?.id === productId);
  const freezing = own.find((auction) => FREEZING_STATUSES.includes(auction.status));
  // A cancelled sale doesn't count: its product can be listed again.
  const isSold = own.some(isSaleFinal);
  const status = freezing?.status ?? (isSold ? 'SOLD' : null);
  return {
    status,
    canEdit: !freezing && !isSold,
    canDelete: !freezing,
    canAuction: !isSold && !own.some((auction) => BLOCKS_NEW_AUCTION.includes(auction.status)),
  };
}
