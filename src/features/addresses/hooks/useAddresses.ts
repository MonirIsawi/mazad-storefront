'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { addressesApi } from '../api/addresses.api';

/** `isEnabled` false skips the request (a signed-out visitor would only get a 401). */
export function useAddresses(isEnabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.addresses.list,
    queryFn: addressesApi.list,
    enabled: isEnabled,
  });
}
