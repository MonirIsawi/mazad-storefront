import { fromMinorUnits, toMinorUnits } from '@shared/lib';

export interface MinimumBidInput {
  currentPrice: string | null;
  startingPrice: string;
  minIncrement: string;
  /** The server's own answer (mazad-api follows a price ladder): used whenever present. */
  minNextBid?: string;
}

/**
 * Mirrors mazad-api's computeMinimumBid exactly (auto-bid.util.ts):
 * `(currentPrice ?? startingPrice - minIncrement) + minIncrement`, i.e. the starting price itself
 * while there are no bids, and current price + increment after that. Computed in integer minor
 * units so Decimal strings like "1250.50" never pick up binary floating-point error.
 */
export function computeMinimumBid({
  currentPrice,
  startingPrice,
  minIncrement,
  minNextBid,
}: MinimumBidInput): number | null {
  // The server's minimum (its increment ladder) wins; the fixed-increment rule is the fallback.
  const fromServer = minNextBid != null ? toMinorUnits(minNextBid) : null;
  if (fromServer != null) return fromMinorUnits(fromServer);
  if (currentPrice == null) {
    const starting = toMinorUnits(startingPrice);
    return starting == null ? null : fromMinorUnits(starting);
  }
  const current = toMinorUnits(currentPrice);
  const increment = toMinorUnits(minIncrement);
  if (current == null || increment == null) return null;
  return fromMinorUnits(current + increment);
}
