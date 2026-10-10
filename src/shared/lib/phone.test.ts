import { describe, expect, it } from 'vitest';
import { isolatePhone, normalizePhone, parsePhone, telHref } from './phone';

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

describe('isolatePhone', () => {
  it('wraps the number in a left-to-right isolate so the plus stays in front in Arabic', () => {
    expect(isolatePhone('+9647701234567')).toBe('⁦+9647701234567⁩');
  });
});

describe('normalizePhone / parsePhone (mazad-api phone.util)', () => {
  it('sends Iraqi phones as +9647XXXXXXXXX however they were typed, never +07…', () => {
    for (const typed of [
      '07701234567',
      '0770 123 4567',
      '(0770) 123-4567',
      '7701234567',
      '+964 770 123 4567',
      '009647701234567',
      '٠٧٧٠١٢٣٤٥٦٧',
    ]) {
      expect({ typed, sent: normalizePhone(typed) }).toEqual({ typed, sent: '+9647701234567' });
    }
  });

  it('refuses what is not a phone', () => {
    expect(parsePhone('not-a-phone')).toBeNull();
    expect(parsePhone('0720123456')).toBeNull();
    expect(parsePhone('+44 20 7946 0958')).toBe('+442079460958');
  });
});
