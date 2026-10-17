'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { isMissingEndpoint } from '@shared/api';
import { QUERY_KEYS } from '@shared/constants';
import { storeApi } from '../api/store.api';

/**
 * The store's ratings (summary and reviews, a page at a time). An API without store ratings
 * answers 404: that is not an error to show, the ratings tab and link just stay hidden, so no
 * retry either. `isAvailable` is undefined until the first page answers.
 */
export function useStoreReviews(storeId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.catalog.store(storeId ?? ''), 'reviews'],
    queryFn: ({ pageParam }) => storeApi.getStoreReviews(storeId ?? '', pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? null,
    enabled: !!storeId,
    retry: (failureCount, error) => !isMissingEndpoint(error) && failureCount < 1,
    staleTime: 60_000,
  });
  const firstPage = query.data?.pages[0];
  return {
    ...query,
    isAvailable: query.isPending ? undefined : Boolean(firstPage),
    summary: firstPage?.summary,
    reviews: query.data?.pages.flatMap((page) => page.items) ?? [],
  };
}
