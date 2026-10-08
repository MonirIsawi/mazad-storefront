'use client';

import { useCallback, useRef } from 'react';

/**
 * One submission at a time for an action button. A disabled/loading button only takes effect
 * after React re-renders, so two clicks in quick succession both reach `onClick` and the second
 * request fails (409: the status already moved). `guard(start)` runs `start` only when nothing is
 * in flight; `start` gets `release`, called when its request settles (or when it gives up, e.g. a
 * confirmation the user declined).
 */
export function useSubmitGuard() {
  const isBusy = useRef(false);
  return useCallback((start: (release: () => void) => void) => {
    if (isBusy.current) return;
    isBusy.current = true;
    start(() => {
      isBusy.current = false;
    });
  }, []);
}
