'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useApiFeature } from '@shared/hooks';
import { homeApi } from '../api/home.api';

const RAIL_LIMIT = 12;

/**
 * The stores for the "Verified stores" rail: only once the API is known to have GET /stores
 * (useApiFeature), and only the stores whose seller is verified, as the rail's title promises.
 * Empty while the feature is absent, so the rail is simply not drawn.
 */
export function useVerifiedStores() {
  const hasStores = useApiFeature('stores') === true;
  const query = useQuery({
    queryKey: QUERY_KEYS.home.stores,
    queryFn: () => homeApi.listStores(RAIL_LIMIT),
    enabled: hasStores,
    staleTime: 5 * 60 * 1000,
  });
  return hasStores ? (query.data?.items.filter((store) => store.isVerified) ?? []) : [];
}
