'use client';

import { HomePage } from '@features/home';
import { CategoryRail } from '@features/catalog';
import { useCurrentUser } from '@features/auth';
import { useUnreadNotificationCount } from '@features/notifications';
import { WatchlistToggle } from '@features/watchlist';
import { useIsAuthenticated } from '@shared/hooks';

// The one place home, catalog, auth, notifications and watchlist meet: the feature slices never
// import each other, so the route composes catalog's category rail, the signed-in name, the
// unread badge and the heart into home's layout (AGENTS.md rule 1).
export default function Page() {
  const isAuthenticated = useIsAuthenticated();
  const me = useCurrentUser();
  const unread = useUnreadNotificationCount();

  return (
    <HomePage
      categoryRail={<CategoryRail />}
      unreadNotificationCount={unread.data ?? 0}
      userName={isAuthenticated ? (me.data?.fullName ?? '') : undefined}
      renderWatchToggle={(auctionId) => <WatchlistToggle auctionId={auctionId} />}
    />
  );
}
