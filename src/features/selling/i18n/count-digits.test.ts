import { afterAll, describe, expect, it } from 'vitest';
import i18next, { addNamespaceBundle } from '@shared/i18n/config';
import sellingAr from './ar.json';
import sellingEn from './en.json';

/**
 * Counts inside translated sentences ("3 صور", "12 متابع") used to keep Western digits while the
 * prices and bid counts around them were Arabic-Indic. `{{count, num}}` gives them the same digits
 * as formatNumber.
 */
describe('counts inside translations', () => {
  addNamespaceBundle('selling', 'ar', sellingAr);
  addNamespaceBundle('selling', 'en', sellingEn);
  afterAll(() => i18next.changeLanguage('ar'));

  it('uses Arabic-Indic digits in Arabic', async () => {
    await i18next.changeLanguage('ar');
    expect(i18next.t('selling:products.imageCount', { count: 3 })).toBe('٣ صور');
    expect(i18next.t('selling:auctions.bids', { count: 12 })).toBe('١٢ مزايدة');
  });

  it('keeps Western digits in English', async () => {
    await i18next.changeLanguage('en');
    expect(i18next.t('selling:products.imageCount', { count: 3 })).toBe('3 photos');
  });
});
