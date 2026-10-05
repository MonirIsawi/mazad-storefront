import { z } from 'zod';

/*
 * Server-side reads of mazad-api's PUBLIC endpoints, for metadata only (title, description,
 * Open Graph image). No credentials are ever sent, so nothing private can end up in a page head.
 * The page itself still renders client-side as before whatever happens here.
 *
 * Results: the data; NOT_FOUND when the API answered 404 (the page may be kept out of search
 * indexes); null for anything else — API down, slow, unexpected shape — so a transient outage only
 * degrades the preview to generic metadata and never de-indexes a real page.
 */

export const NOT_FOUND = 'not-found' as const;
export type PublicResult<T> = T | typeof NOT_FOUND | null;

/** Server-only override when the API is reachable on a private network (e.g. Railway internal). */
function apiBaseUrl(): string | null {
  const raw = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return raw ? raw.replace(/\/$/, '') : null;
}

/** Metadata is not worth holding a crawler's request open for. */
const FETCH_TIMEOUT_MS = 2500;
/** Seconds Next.js may reuse a response; titles and prices in previews may lag by this much. */
const REVALIDATE_SECONDS = 60;

async function fetchPublic<T>(path: string, schema: z.ZodType<T>): Promise<PublicResult<T>> {
  const base = apiBaseUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.status === 404) return NOT_FOUND;
    if (!response.ok) return null;
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Route ids are API ids (cuid); anything else is not worth a request. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const imageSchema = z.object({
  url: z.string(),
  isCover: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const publicAuctionSchema = z.object({
  id: z.string(),
  status: z.string(),
  startingPrice: z.string(),
  currentPrice: z.string().nullable(),
  bidCount: z.number(),
  endsAt: z.string(),
  product: z.object({
    nameEn: z.string(),
    nameAr: z.string(),
    descriptionEn: z.string().nullish(),
    descriptionAr: z.string().nullish(),
    images: z.array(imageSchema),
  }),
  store: z.object({ nameEn: z.string(), nameAr: z.string(), city: z.string() }).optional(),
});

const publicStoreSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  city: z.string(),
  seller: z.object({ fullName: z.string() }),
});

const publicSellerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  isVerified: z.boolean(),
  followerCount: z.number(),
  rating: z.object({ average: z.number().nullable(), count: z.number() }),
});

export type PublicAuction = z.infer<typeof publicAuctionSchema>;
export type PublicStore = z.infer<typeof publicStoreSchema>;
export type PublicSeller = z.infer<typeof publicSellerSchema>;

export function fetchPublicAuction(id: string): Promise<PublicResult<PublicAuction>> {
  return ID_PATTERN.test(id)
    ? fetchPublic(`/auctions/${id}`, publicAuctionSchema)
    : Promise.resolve(NOT_FOUND);
}

export function fetchPublicStore(id: string): Promise<PublicResult<PublicStore>> {
  return ID_PATTERN.test(id)
    ? fetchPublic(`/stores/${id}`, publicStoreSchema)
    : Promise.resolve(NOT_FOUND);
}

export function fetchPublicSeller(id: string): Promise<PublicResult<PublicSeller>> {
  return ID_PATTERN.test(id)
    ? fetchPublic(`/sellers/${id}`, publicSellerSchema)
    : Promise.resolve(NOT_FOUND);
}
