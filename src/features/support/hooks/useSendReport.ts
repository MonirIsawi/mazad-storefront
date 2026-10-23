'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { supportApi } from '../api/support.api';

/** Sends a report; the history refetches so the new one shows with its status. */
export function useSendReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof supportApi.send>[0]) => supportApi.send(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.support.reports }),
  });
}
