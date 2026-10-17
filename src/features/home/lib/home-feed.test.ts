import { describe, expect, it } from 'vitest';
import { endingBoard, pickFeatured } from './home-feed';
import type { HomeAuction, HomeFeed } from '../types/home.types';

const lot = (id: string, endsAt: string, coverImage: string | null = 'https://x/p.jpg') =>
  ({
    id,
    status: 'LIVE',
    startingPrice: '1000',
    currentPrice: null,
    bidCount: 0,
    startsAt: '2026-10-01T00:00:00.000Z',
    endsAt,
    product: { id: `p-${id}`, nameEn: id, nameAr: id, coverImage },
    seller: { id: 's', fullName: 'S', isVerified: true },
    store: { id: 'st', nameEn: 'St', nameAr: 'St', city: 'Basra' },
  }) as HomeAuction;

const feed = (live: HomeAuction[], endingSoon: HomeAuction[] = []): HomeFeed => ({
  live,
  endingSoon,
  upcoming: [],
  serverTime: '2026-10-17T10:00:00.000Z',
});

describe('pickFeatured', () => {
  it('is the next live lot to close that has a photo', () => {
    const featured = pickFeatured(
      feed([
        lot('later', '2026-10-17T15:00:00.000Z'),
        lot('no-photo', '2026-10-17T11:00:00.000Z', null),
        lot('sooner', '2026-10-17T12:00:00.000Z'),
      ]),
    );
    expect(featured?.id).toBe('sooner');
  });

  it('falls back to the next to close without a photo, and to nothing without live lots', () => {
    expect(pickFeatured(feed([lot('a', '2026-10-17T11:00:00.000Z', null)]))?.id).toBe('a');
    expect(pickFeatured(feed([]))).toBeNull();
  });
});

describe('endingBoard', () => {
  it('shows the final hour when the API has lots ending within it', () => {
    const soon = lot('soon', '2026-10-17T10:30:00.000Z');
    const board = endingBoard(feed([soon, lot('x', '2026-10-18T10:00:00.000Z')], [soon]));
    expect(board).toEqual({ kind: 'finalHour', auctions: [soon] });
  });

  it('otherwise the live lots ending soonest, without the featured one', () => {
    const board = endingBoard(
      feed([lot('b', '2026-10-18T10:00:00.000Z'), lot('a', '2026-10-17T12:00:00.000Z')]),
      'a',
    );
    expect(board.kind).toBe('endingSoonest');
    expect(board.auctions.map((auction) => auction.id)).toEqual(['b']);
  });
});
