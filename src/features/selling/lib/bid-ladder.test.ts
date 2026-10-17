import { describe, expect, it } from 'vitest';
import { ladderStep } from './bid-ladder';

describe('ladderStep (mirrors the API ladder)', () => {
  it.each([
    [1_000, 1_000],
    [99_999, 1_000],
    [100_000, 5_000],
    [400_000, 5_000],
    [1_000_000, 25_000],
    [9_999_999, 25_000],
    [10_000_000, 100_000],
  ])('%i → %i', (price, step) => {
    expect(ladderStep(price)).toBe(step);
  });
});
