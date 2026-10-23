import type { SellerAuction } from '../types/selling.types';
import { EXTENSION_MINUTES, MAX_EXTENSIONS, type AuctionFormState } from './auction-payload';
import { toDateTimeInputValue } from './datetime-input';

const DAY_MS = 24 * 60 * 60_000;

/** The form's starting values: an existing auction's, a relisted one's, or start now for 3 days. */
export function initialAuctionState(
  auction: SellerAuction | undefined,
  initialProductId: string | undefined,
  relistFrom: SellerAuction | undefined,
): AuctionFormState {
  const now = Date.now();
  const whole = (value: string | null | undefined) =>
    value ? String(Math.round(Number(value))) : '';
  // The step and extension an auction carries; a new one starts from the defaults.
  const source = auction ?? relistFrom;
  const rules = {
    minIncrement: whole(source?.minIncrement),
    antiSnipingMinutes: String(
      source?.extensionMinutes ?? source?.antiSnipingMinutes ?? EXTENSION_MINUTES.default,
    ),
    maxExtensions: String(source?.maxExtensions ?? MAX_EXTENSIONS.default),
  };
  if (auction) {
    // A draft whose start already passed is published as "start now".
    const startsLater = Date.parse(auction.startsAt) > now;
    return {
      productId: auction.product?.id ?? '',
      startingPrice: whole(auction.startingPrice),
      startMode: startsLater ? 'later' : 'now',
      startsAt: toDateTimeInputValue(startsLater ? auction.startsAt : new Date(now).toISOString()),
      endsAt: toDateTimeInputValue(
        Date.parse(auction.endsAt) > now + DAY_MS
          ? auction.endsAt
          : new Date(now + 3 * DAY_MS).toISOString(),
      ),
      buyNowPrice: whole(auction.buyNowPrice),
      ...rules,
    };
  }
  // Start now, for 3 days: the common case needs no date picking at all.
  return {
    productId: relistFrom?.product?.id ?? initialProductId ?? '',
    startingPrice: whole(relistFrom?.startingPrice),
    startMode: 'now',
    startsAt: toDateTimeInputValue(new Date(now + 60 * 60_000).toISOString()),
    endsAt: toDateTimeInputValue(new Date(now + 3 * DAY_MS).toISOString()),
    buyNowPrice: whole(relistFrom?.buyNowPrice),
    ...rules,
  };
}
