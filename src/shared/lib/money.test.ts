import { describe, it, expect } from 'vitest';
import { formatMoney, formatNumber, formatQuantity, parseMoney, toArabicDigits } from './money';

describe('parseMoney', () => {
  it('parses a decimal string', () => {
    expect(parseMoney('1250.00')).toBe(1250);
  });

  it('returns null for null or undefined', () => {
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
  });

  it('returns null for a non-numeric string', () => {
    expect(parseMoney('not-a-number')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('formats English with Western digits and the IQD suffix', () => {
    expect(formatMoney('1250000', 'en')).toBe('1,250,000 IQD');
  });

  it('formats Arabic with Arabic-Indic digits and the د.ع suffix', () => {
    expect(formatMoney('125000', 'ar')).toBe('١٢٥,٠٠٠ د.ع');
  });

  it('drops the fractional part — the dinar has no minor unit', () => {
    expect(formatMoney('1250.75', 'en')).toBe('1,251 IQD');
  });

  it('renders an em dash when there is no price', () => {
    expect(formatMoney(null, 'ar')).toBe('—');
  });
});

describe('toArabicDigits', () => {
  it('maps digits and leaves the grouping separator alone', () => {
    expect(toArabicDigits('125,000')).toBe('١٢٥,٠٠٠');
  });
});

describe('formatNumber', () => {
  it('localizes a bare count with no currency suffix', () => {
    expect(formatNumber(12, 'ar')).toBe('١٢');
    expect(formatNumber(12, 'en')).toBe('12');
  });
});

describe('formatQuantity', () => {
  it('matches formatNumber digits and keeps decimals', () => {
    expect(formatQuantity(1250, 'ar')).toBe('١,٢٥٠');
    expect(formatQuantity(4.25, 'en')).toBe('4.25');
    expect(formatQuantity('7', 'ar')).toBe('٧');
    expect(formatQuantity(undefined, 'ar')).toBe('');
  });
});
