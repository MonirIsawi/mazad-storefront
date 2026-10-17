import type { IconName } from '@shared/components/ui';

/**
 * Categories come from mazad-api's /categories; their `iconUrl` is not used because every icon on
 * screen comes from the one Bidoom sheet. The slug picks a glyph (whole word or a known prefix),
 * and an unknown slug falls back to the generic package rather than rendering nothing.
 */
const SLUG_ICONS: [RegExp, IconName][] = [
  [/^(cars?|vehicles?|motors?|auto(-parts)?|car-parts|motorcycles?)$/, 'car'],
  [/^(plates?|number-plates?|license-plates?)$/, 'plate'],
  [/^(real-?estate|property|properties|houses?|land)$/, 'house'],
  [/^(jewel(le)?ry|gold|diamonds?)$/, 'diamond'],
  [/^(watches?|clocks?|wearables?)$/, 'watch'],
  [/^(phones?|mobiles?|smartphones?|tablets?)$/, 'mobile'],
  [/^(cameras?|photography)$/, 'camera'],
  [/^(electronics?|audio|headphones?|computers?|laptops?)$/, 'headphones'],
  [/^(bags?|handbags?|luggage)$/, 'bag'],
  [/^(art|arts|antiques?|collectibles?|rugs?|carpets?)$/, 'frame'],
  [/^(games?|gaming|consoles?|video-games?)$/, 'gamepad'],
  [/^(fashion|clothing|clothes|apparel)$/, 'shirt'],
  [/^(shoes?|sneakers?|footwear)$/, 'sneaker'],
  [/^(home|furniture|home-appliances|appliances|decor)$/, 'couch'],
  [/^(perfumes?|fragrances?|beauty|cosmetics)$/, 'perfume'],
];

export function getCategoryIcon(slug: string): IconName {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ICONS.find(([pattern]) => pattern.test(normalized))?.[1] ?? 'package';
}
