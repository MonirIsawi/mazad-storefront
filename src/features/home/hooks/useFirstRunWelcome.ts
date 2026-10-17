'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionTokens } from '@shared/api';
import { ROUTES, STORAGE_KEYS } from '@shared/constants';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.welcomeSeen) != null;
  } catch {
    // Storage blocked (private mode): never trap the visitor in a loop, so count it as seen.
    return true;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.welcomeSeen, '1');
  } catch {
    // Nothing to remember it in; readSeen() already treats that as seen.
  }
}

/**
 * The first-run welcome, decided on the client and only from the home page: deep links (an
 * auction, a store) always open what was linked, the server render that crawlers read is the
 * home page itself, and a signed-in visitor is never sent there. It is shown once: the flag is
 * stored before navigating, so leaving the welcome any way at all never brings it back.
 */
export function useFirstRunWelcome() {
  const router = useRouter();

  useEffect(() => {
    if (readSeen()) return;
    markSeen();
    if (getSessionTokens()) return;
    router.replace(ROUTES.welcome);
  }, [router]);
}

/** For the welcome page itself: opened directly, it still counts as seen. */
export function markWelcomeSeen() {
  markSeen();
}
