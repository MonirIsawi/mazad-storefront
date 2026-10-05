import { describe, expect, it } from 'vitest';
import { fromMinorUnits, MAX_MONEY_AMOUNT, roundMoney, toMinorUnits } from '@shared/lib';
import { computeMinimumBid } from './computeMinimumBid';

describe('exact money arithmetic', () => {
  it.each([
    ['1250.00', 125_000],
    ['1250.5', 125_050],
    ['1250.05', 125_005],
    ['0', 0],
    ['9999999999.99', 999_999_999_999],
  ])('parses the Decimal string %s into %d minor units', (text, minor) => {
    expect(toMinorUnits(text)).toBe(minor);
  });

  it.each(['1.234', 'abc', '', '1e3', '12,50'])('refuses the malformed amount %j', (text) => {
    expect(toMinorUnits(text)).toBeNull();
  });

  it('does not inherit binary floating-point error', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(fromMinorUnits(toMinorUnits('0.10')! + toMinorUnits('0.20')!)).toBe(0.3);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(JSON.stringify({ amount: fromMinorUnits(125_005) })).toBe('{"amount":1250.05}');
  });

  it("keeps mazad-api's Decimal(12,2) maximum exact", () => {
    expect(fromMinorUnits(toMinorUnits(MAX_MONEY_AMOUNT)!)).toBe(MAX_MONEY_AMOUNT);
  });
});

describe('computeMinimumBid (mirrors mazad-api)', () => {
  it('is the starting price itself while there are no bids', () => {
    expect(
      computeMinimumBid({
        currentPrice: null,
        startingPrice: '100000.00',
        minIncrement: '5000.00',
      }),
    ).toBe(100_000);
  });

  it('is current price + increment once there are bids', () => {
    expect(
      computeMinimumBid({
        currentPrice: '125000.00',
        startingPrice: '100000.00',
        minIncrement: '5000.00',
      }),
    ).toBe(130_000);
  });

  it('adds fractional Decimal strings exactly', () => {
    expect(
      computeMinimumBid({
        currentPrice: '1250.10',
        startingPrice: '1000.00',
        minIncrement: '0.20',
      }),
    ).toBe(1250.3);
  });

  it('is exact at the largest amounts', () => {
    expect(
      computeMinimumBid({
        currentPrice: '9999999989.99',
        startingPrice: '1.00',
        minIncrement: '10.00',
      }),
    ).toBe(MAX_MONEY_AMOUNT);
  });

  it('gives up on malformed input instead of guessing', () => {
    expect(
      computeMinimumBid({ currentPrice: 'oops', startingPrice: '100', minIncrement: '10' }),
    ).toBeNull();
    expect(
      computeMinimumBid({ currentPrice: null, startingPrice: 'n/a', minIncrement: '10' }),
    ).toBeNull();
  });
});
