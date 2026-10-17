import { describe, expect, it } from 'vitest';
import {
  countSheetFilters,
  parseAmount,
  parseBrowseFilters,
  toListParams,
  writeBrowseFilters,
} from './browse-filters';

describe('browse filters in the URL', () => {
  it('reads every existing param and ignores unknown values', () => {
    const filters = parseBrowseFilters(
      new URLSearchParams(
        'q=iphone&categoryId=c1&status=live&sort=priceLow&minPrice=1000&maxPrice=5000&condition=USED&endingSoon=true&status2=x',
      ),
    );
    expect(filters).toEqual({
      q: 'iphone',
      categoryId: 'c1',
      status: 'live',
      sort: 'priceLow',
      minPrice: 1000,
      maxPrice: 5000,
      condition: 'USED',
      endingSoon: true,
    });
    expect(parseBrowseFilters(new URLSearchParams('status=soon&condition=BROKEN'))).toEqual({});
  });

  it('writes filters over the current params, keeping the rest, and never writes the default sort', () => {
    const current = new URLSearchParams('q=watch&sheet=filters&status=live');
    expect(
      writeBrowseFilters(current, {
        q: 'watch',
        status: undefined,
        minPrice: 500,
        sort: 'endingSoon',
      }),
    ).toBe('q=watch&sheet=filters&minPrice=500');
  });

  it('asks the API with the default sort left out', () => {
    expect(toListParams({ q: 'a', sort: 'endingSoon' }, 24)).toEqual({ q: 'a', limit: 24 });
    expect(toListParams({ sort: 'newest' }, 1)).toEqual({ sort: 'newest', limit: 1 });
  });

  it('reads typed amounts in either digit set, whole dinars only', () => {
    expect(parseAmount('١٢٠٠٠٠')).toBe(120000);
    expect(parseAmount('250,000')).toBe(250000);
    expect(parseAmount('')).toBeUndefined();
  });

  it('counts a price range as one filter', () => {
    expect(countSheetFilters({ minPrice: 1, maxPrice: 2, categoryId: 'c', q: 'x' })).toBe(2);
  });
});
