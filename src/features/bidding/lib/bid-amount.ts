import { fromMinorUnits, toMinorUnits } from '@shared/lib';

/** A bid this many times the top bid asks to be confirmed first (a typo guard, not a limit). */
export const LARGE_BID_FACTOR = 3;

export interface RoundedBid {
  amount: number;
  /** Why the typed amount changed: raised to the minimum, or rounded up to the next step. */
  adjustment: 'none' | 'minimum' | 'step';
}

/**
 * A typed amount made valid by construction: anything under the minimum becomes the minimum, and
 * anything between steps is rounded up to the next one (minimum + k × step). In minor units, so
 * Decimal amounts never pick up floating-point error.
 */
export function roundUpToStep(typed: number, minimum: number, step: number): RoundedBid {
  const min = toMinorUnits(String(minimum)) ?? 0;
  const inc = Math.max(1, toMinorUnits(String(step)) ?? 1);
  const value = toMinorUnits(String(typed));
  if (value == null || value <= min) {
    return { amount: fromMinorUnits(min), adjustment: value === min ? 'none' : 'minimum' };
  }
  const steps = Math.ceil((value - min) / inc);
  const rounded = min + steps * inc;
  return { amount: fromMinorUnits(rounded), adjustment: rounded === value ? 'none' : 'step' };
}

/** The quick amounts (design `.qamts`): the minimum, then 1, 3 and 9 steps above it. */
export function quickAmounts(minimum: number, step: number): number[] {
  const min = toMinorUnits(String(minimum)) ?? 0;
  const inc = toMinorUnits(String(step)) ?? 0;
  return [0, 1, 3, 9].map((k) => fromMinorUnits(min + k * inc));
}

/** Suggested auto-bid maximums: well above the minimum, in whole steps. */
export function quickMaximums(minimum: number, step: number): number[] {
  const min = toMinorUnits(String(minimum)) ?? 0;
  const inc = toMinorUnits(String(step)) ?? 0;
  return [4, 6, 10, 16].map((k) => fromMinorUnits(min + k * inc));
}

/** True when the bid is over three times the top bid (or the opening price before any bid). */
export function isLargeBid(amount: number, topBid: string | null, startingPrice: string): boolean {
  const top = toMinorUnits(topBid ?? startingPrice);
  const value = toMinorUnits(String(amount));
  if (top == null || value == null || top <= 0) return false;
  return value > top * LARGE_BID_FACTOR;
}
