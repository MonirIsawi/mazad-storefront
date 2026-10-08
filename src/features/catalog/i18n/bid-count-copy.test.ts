import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import sellingAr from '../../selling/i18n/ar.json';
import sellingEn from '../../selling/i18n/en.json';
import catalogAr from './ar.json';
import catalogEn from './en.json';

/** Bid counts in sentences: "No bids yet" for zero, normal plural rules above it. */
describe('bid count copy', () => {
  const cases = {
    en: ['No bids yet', '1 bid', '2 bids', '3 bids', '11 bids'],
    ar: ['لا مزايدات بعد', 'مزايدة واحدة', 'مزايدتان', '٣ مزايدات', '١١ مزايدة'],
  } as const;
  const counts = [0, 1, 2, 3, 11];

  it.each(Object.entries(cases))(
    '%s: auction detail and seller cards agree',
    async (lng, expected) => {
      const i18n = createInstance();
      await i18n.init({
        lng,
        resources: {
          en: { catalog: catalogEn, selling: sellingEn },
          ar: { catalog: catalogAr, selling: sellingAr },
        },
        interpolation: { escapeValue: false },
      });
      i18n.services.formatter?.add('num', (value: number) =>
        lng === 'ar' ? value.toLocaleString('ar-EG') : String(value),
      );
      const number = (n: number) => (lng === 'ar' ? n.toLocaleString('ar-EG') : String(n));
      expect(
        counts.map((count) =>
          i18n.t('catalog:detail.bids', { count, formattedCount: number(count) }),
        ),
      ).toEqual(expected);
      expect(counts.map((count) => i18n.t('selling:auctions.bids', { count }))).toEqual(expected);
    },
  );
});
