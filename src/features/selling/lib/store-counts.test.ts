import { describe, expect, it } from 'vitest';
import { liveCountsByStore } from './store-counts';

describe('liveCountsByStore', () => {
  it('counts only live auctions, by the store of their product', () => {
    const products = [
      { id: 'p1', store: { id: 's1', name: 'A', city: 'Baghdad' } },
      { id: 'p2', store: { id: 's1', name: 'A', city: 'Baghdad' } },
      { id: 'p3', store: { id: 's2', name: 'B', city: 'Erbil' } },
    ];
    const auction = (status: 'LIVE' | 'SOLD', productId: string) => ({
      status,
      product: { id: productId, nameEn: '', nameAr: '' },
    });
    const counts = liveCountsByStore(products, [
      auction('LIVE', 'p1'),
      auction('LIVE', 'p2'),
      auction('SOLD', 'p3'),
      auction('LIVE', 'gone'),
    ]);
    expect(counts.get('s1')).toBe(2);
    expect(counts.get('s2')).toBeUndefined();
  });
});
