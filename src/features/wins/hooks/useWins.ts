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
    // A win turns into an order the moment its auction ends: keep the list short-lived so a
    // fresh win (and its order link) shows up soon after.
    staleTime: 15_000,
  });
}
