interface LocalizedEntity {
  nameEn: string;
  nameAr: string;
}

/**
 * mazad-api's /categories, /products, and /stores pick the right name server-side from
 * Accept-Language. /auctions and /homepage don't — they return raw nameEn/nameAr on the nested
 * product — so callers rendering an auction's product name localize it here instead.
 */
export function pickLocalizedName(entity: LocalizedEntity, locale: 'en' | 'ar'): string {
  if (locale === 'en' && entity.nameEn) return entity.nameEn;
  return entity.nameAr || entity.nameEn || '';
}

/**
 * Joins the non-empty parts of an address or order summary with the list separator of the UI
 * language: the Arabic comma "،" in Arabic, ", " in English.
 */
export function joinList(parts: (string | null | undefined)[], locale: 'en' | 'ar'): string {
  return parts.filter((part): part is string => Boolean(part)).join(locale === 'ar' ? '، ' : ', ');
}
