import { fromMinorUnits, toMinorUnits } from '@shared/lib';

export interface MinimumBidInput {
  currentPrice: string | null;
  startingPrice: string;
  minIncrement: string;
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
}: MinimumBidInput): number | null {
  if (currentPrice == null) {
    const starting = toMinorUnits(startingPrice);
    return starting == null ? null : fromMinorUnits(starting);
  }
  const current = toMinorUnits(currentPrice);
  const increment = toMinorUnits(minIncrement);
  if (current == null || increment == null) return null;
  return fromMinorUnits(current + increment);
}
