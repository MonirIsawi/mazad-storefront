'use client';

import { useSyncExternalStore } from 'react';
import { getServerClockOffset, subscribeServerClock } from '@shared/lib/server-clock';

// The offset itself lives in shared/lib/server-clock.ts, fed by every API response
// (X-Server-Time) and by GET /homepage's serverTime. This hook only subscribes React to it.
export { recordServerTime } from '@shared/lib/server-clock';

function getServerSnapshot() {
  return 0;
}

export function useServerClock() {
  const offset = useSyncExternalStore(
    subscribeServerClock,
    getServerClockOffset,
    getServerSnapshot,
  );
  return { offset, now: () => Date.now() + offset };
}
