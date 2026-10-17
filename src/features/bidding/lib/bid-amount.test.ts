import { describe, expect, it } from 'vitest';
import { isLargeBid, quickAmounts, roundUpToStep } from './bid-amount';

describe('roundUpToStep', () => {
  it('rounds a typed amount between steps up to the next valid one, with a note', () => {
    // The design's example: 1,360,000 becomes 1,375,000 when the minimum is 1,350,000 in 25,000s.
    expect(roundUpToStep(1_360_000, 1_350_000, 25_000)).toEqual({
      amount: 1_375_000,
      adjustment: 'step',
    });
  });

  it('keeps an amount that is already on a step', () => {
    expect(roundUpToStep(1_400_000, 1_350_000, 25_000)).toEqual({
      amount: 1_400_000,
      adjustment: 'none',
    });
    expect(roundUpToStep(1_350_000, 1_350_000, 25_000).adjustment).toBe('none');
  });

  it('raises anything under the minimum to the minimum', () => {
    expect(roundUpToStep(1_000, 1_350_000, 25_000)).toEqual({
      amount: 1_350_000,
      adjustment: 'minimum',
    });
  });

  it('stays exact with decimal steps', () => {
    expect(roundUpToStep(1000.25, 1000.2, 0.1).amount).toBe(1000.3);
  });
});

describe('quickAmounts', () => {
  it('is the minimum, then one, three and nine steps above it', () => {
    expect(quickAmounts(1_350_000, 25_000)).toEqual([1_350_000, 1_375_000, 1_425_000, 1_575_000]);
  });
});

describe('isLargeBid', () => {
  it('asks to confirm only over three times the top bid', () => {
    expect(isLargeBid(300_000, '100000', '50000')).toBe(false);
    expect(isLargeBid(300_001, '100000', '50000')).toBe(true);
    expect(isLargeBid(160_000, null, '50000')).toBe(true);
  });
});
