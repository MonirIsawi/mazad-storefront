import { describe, expect, it } from 'vitest';
import { ladderStep, stepSuggestions } from './bid-ladder';

describe('ladderStep (mirrors the API suggested step)', () => {
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

describe('stepSuggestions (chips around the suggested step)', () => {
  it('a 400,000 opening: 1,000 / 5,000 / 10,000 / 25,000', () => {
    expect(stepSuggestions(400_000)).toEqual([1_000, 5_000, 10_000, 25_000]);
  });

  it('stays from 250 IQD up to the opening price', () => {
    expect(stepSuggestions(1_000)).toEqual([1_000]);
    expect(stepSuggestions(3_000)).toEqual([1_000, 2_000]);
    expect(stepSuggestions(50_000_000)).toEqual([20_000, 100_000, 200_000, 500_000]);
  });
});
