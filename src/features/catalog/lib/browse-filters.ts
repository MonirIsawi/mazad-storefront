import { toAsciiDigits } from '@shared/lib';
import type {
  AuctionListParams,
  AuctionStatusFilter,
  CatalogSort,
  ProductCondition,
} from '../types/catalog.types';

export const STATUS_VALUES: AuctionStatusFilter[] = ['live', 'upcoming', 'ended'];
export const SORT_VALUES: CatalogSort[] = ['endingSoon', 'newest', 'priceLow'];
export const CONDITION_VALUES: ProductCondition[] = ['NEW', 'LIKE_NEW', 'OPEN_BOX', 'USED'];

/** Everything Browse filters by, exactly as it sits in the URL (the URL owns the filters). */
export interface BrowseFilters {
  q?: string;
  categoryId?: string;
  status?: AuctionStatusFilter;
  sort?: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  /** From the home feed's "Final hour": live lots ending within the hour. */
  endingSoon?: boolean;
}

/** The filters the sheet edits (search and sort stay where they are). */
export type SheetFilters = Pick<
  BrowseFilters,
  'categoryId' | 'status' | 'minPrice' | 'maxPrice' | 'condition'
>;

const pick = <T extends string>(values: T[], raw: string | null): T | undefined =>
  values.find((value) => value === raw);

/** A whole, non-negative dinar amount from the URL or a field (Arabic digits too), else none. */
export function parseAmount(raw: string | null | undefined): number | undefined {
  if (raw == null) return undefined;
  const digits = toAsciiDigits(raw).replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : undefined;
}

export function parseBrowseFilters(params: URLSearchParams): BrowseFilters {
  const filters: BrowseFilters = {
    q: params.get('q')?.trim() || undefined,
    categoryId: params.get('categoryId') ?? undefined,
    status: pick(STATUS_VALUES, params.get('status')),
    // Absent = the server's default (live ending soonest, then upcoming, finished last).
    sort: pick(SORT_VALUES, params.get('sort')),
    minPrice: parseAmount(params.get('minPrice')),
    maxPrice: parseAmount(params.get('maxPrice')),
    condition: pick(CONDITION_VALUES, params.get('condition')),
    endingSoon: params.get('endingSoon') === 'true' || undefined,
  };
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  ) as BrowseFilters;
}

const URL_KEYS = [
  'q',
  'categoryId',
  'status',
  'sort',
  'minPrice',
  'maxPrice',
  'condition',
  'endingSoon',
] as const;

/**
 * The next URL query: the browse filters written over the current params, so anything else in the
 * URL survives. A filter set to undefined is removed.
 */
export function writeBrowseFilters(current: URLSearchParams, filters: BrowseFilters): string {
  const next = new URLSearchParams(current);
  for (const key of URL_KEYS) {
    const value = filters[key];
    if (value === undefined || value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
  }
  // "ending soonest" is the server's default order: never written out.
  if (filters.sort === 'endingSoon') next.delete('sort');
  return next.toString();
}

/** The /auctions request for these filters. */
export function toListParams(filters: BrowseFilters, limit: number): AuctionListParams {
  const { sort, ...rest } = filters;
  return { ...rest, ...(sort && sort !== 'endingSoon' ? { sort } : {}), limit };
}

/**
 * How many filters the sheet holds beyond the status (which has its own control on the page), for
 * the badge on the filter button. A price range counts once.
 */
export function countSheetFilters(filters: BrowseFilters): number {
  const hasPrice = filters.minPrice !== undefined || filters.maxPrice !== undefined;
  return [filters.categoryId, filters.condition, hasPrice || undefined].filter(
    (value) => value !== undefined,
  ).length;
}
