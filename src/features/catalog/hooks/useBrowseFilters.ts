'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { parseBrowseFilters, writeBrowseFilters, type BrowseFilters } from '../lib/browse-filters';

/**
 * Browse's filters, owned by the URL rather than component state: the home feed's links arrive
 * pre-filtered, back and forward behave, and a filtered view is shareable. Every change replaces
 * the URL (no history entry per chip) and reads straight back out of it.
 */
export function useBrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseBrowseFilters(searchParams), [searchParams]);

  const replaceParams = useCallback(
    (query: string) => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    [router, pathname],
  );

  /** Writes the given filters over the current ones; undefined removes one. */
  const update = useCallback(
    (changes: BrowseFilters, { closeSheet = false }: { closeSheet?: boolean } = {}) => {
      const next = new URLSearchParams(
        writeBrowseFilters(searchParams, { ...filters, ...changes }),
      );
      if (closeSheet) next.delete('sheet');
      replaceParams(next.toString());
    },
    [replaceParams, searchParams, filters],
  );

  /** Every filter off, the search included (what "Clear filters" promises). */
  const clear = useCallback(() => {
    const next = new URLSearchParams(writeBrowseFilters(searchParams, {}));
    next.delete('sheet');
    replaceParams(next.toString());
  }, [replaceParams, searchParams]);

  const isSheetOpen = searchParams.get('sheet') === 'filters';
  const setSheetOpen = useCallback(
    (isOpen: boolean) => {
      const next = new URLSearchParams(searchParams);
      if (isOpen) next.set('sheet', 'filters');
      else next.delete('sheet');
      replaceParams(next.toString());
    },
    [replaceParams, searchParams],
  );

  return { filters, update, clear, isSheetOpen, setSheetOpen };
}
