'use client';

import { useSyncExternalStore } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

function currentPart(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

const noSubscription = () => () => {};

/**
 * The visitor's part of the day for the greeting, on their own clock. Null in the server render
 * (the server's clock is not the visitor's), so the greeting appears once the page is hydrated
 * instead of flipping from one wording to another.
 */
export function useTimeOfDay(): TimeOfDay | null {
  return useSyncExternalStore(noSubscription, currentPart, () => null);
}
