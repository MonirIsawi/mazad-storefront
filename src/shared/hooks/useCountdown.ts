'use client';

import { useSyncExternalStore } from 'react';
import { useServerClock } from './useServerClock';

/*
 * One interval for the whole app rather than one per countdown. An auction grid mounts a dozen
 * cards at once, and staggered timers would let neighbouring cards show digits a second apart.
 * Same external-store shape as useServerClock, so the two stay easy to read together.
 */
let tick = 0;
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);

  interval ??= setInterval(() => {
    tick += 1;
    listeners.forEach((notify) => notify());
  }, 1000);

  return () => {
    listeners.delete(listener);
    // Nothing is counting any more; don't keep a timer alive behind an idle screen.
    if (listeners.size === 0 && interval !== undefined) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

function getSnapshot() {
  return tick;
}

// The server renders one frozen frame; the count starts on the client.
function getServerSnapshot() {
  return 0;
}

/**
 * Milliseconds left until `endsAt`, recomputed every second. Negative once the auction is past
 * its end — callers decide what that means, since "ended" is the API's word, not the clock's.
 *
 * Always derived from useServerClock's offset rather than a locally accumulated count, so a
 * drifting or wrong device clock can't make an auction look open after it closed (ADR-013).
 */
export function useCountdown(endsAt: string | null | undefined): number {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { now } = useServerClock();

  // No deadline yet (data still loading): nothing to count down.
  if (!endsAt) return 0;
  return new Date(endsAt).getTime() - now();
}
