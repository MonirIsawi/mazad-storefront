'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { supportApi } from '../api/support.api';

/** My reports, newest first, a cursor page at a time. */
export function useMyReports() {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.support.reports,
    queryFn: ({ pageParam }) => supportApi.myReports(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  return { ...query, reports: query.data?.pages.flatMap((page) => page.items) ?? [] };
}
