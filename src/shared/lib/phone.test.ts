import { describe, expect, it } from 'vitest';
import { telHref } from './phone';

describe('telHref', () => {
  it('dials the number as shown, without separators', () => {
    expect(telHref('+9647701234567')).toBe('tel:+9647701234567');
    expect(telHref(' +964 770 123-4567 ')).toBe('tel:+9647701234567');
    expect(telHref('07701234567')).toBe('tel:07701234567');
  });

  it('gives no link for a missing or undialable number', () => {
    expect(telHref(null)).toBeNull();
    expect(telHref(undefined)).toBeNull();
    expect(telHref('')).toBeNull();
    expect(telHref('call me')).toBeNull();
    expect(telHref('12345')).toBeNull();
    expect(telHref('+1234567890123456')).toBeNull();
  });
});
