import type { HomeAuction, HomeFeed } from '../types/home.types';

const byEndingFirst = (a: HomeAuction, b: HomeAuction) =>
  new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();

/**
 * The featured lot: one real live auction, the next to close. A lot with a photo is preferred,
 * since the card is the photo; without any photo, the next to close anyway.
 */
export function pickFeatured(feed: HomeFeed | undefined): HomeAuction | null {
  if (!feed) return null;
  const live = [...feed.endingSoon, ...feed.live].sort(byEndingFirst);
  return live.find((auction) => auction.product.coverImage) ?? live[0] ?? null;
}

export interface EndingBoard {
  /** `finalHour` when the API's ending-within-an-hour list has lots, else the soonest to end. */
  kind: 'finalHour' | 'endingSoonest';
  auctions: HomeAuction[];
}

/**
 * The desktop board beside the featured lot. It shows the lots ending within the hour when there
 * are any, and otherwise the live lots that end soonest, titled as such: never an empty board.
 */
export function endingBoard(feed: HomeFeed | undefined, featuredId?: string): EndingBoard {
  const others = (list: HomeAuction[]) => list.filter((auction) => auction.id !== featuredId);
  const finalHour = others(feed?.endingSoon ?? []);
  if (finalHour.length > 0) return { kind: 'finalHour', auctions: finalHour.slice(0, 6) };
  const soonest = others([...(feed?.live ?? [])].sort(byEndingFirst));
  return { kind: 'endingSoonest', auctions: soonest.slice(0, 6) };
}
