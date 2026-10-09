'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useIsAuthenticated } from '@shared/hooks';
import { winsApi } from '../api/wins.api';

export function useWins(isEnabled = true) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: QUERY_KEYS.wins.list,
    queryFn: winsApi.list,
    enabled: isAuthenticated && isEnabled,
    // A confirmation window expires on a server deadline, so a stale list here costs the user a
    // strike. Refetch on focus and keep it short-lived.
    staleTime: 15_000,
  });
}
