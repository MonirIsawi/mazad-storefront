'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { Button, Icon, buttonVariants } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { useToggleWatch } from '../hooks/useToggleWatch';
import { useWatchlist } from '../hooks/useWatchlist';
import { useWatchlistTranslation } from '../hooks/useWatchlistTranslation';

/**
 * "Remind me when it starts" on an upcoming auction (design `auction-upcoming`): it adds the auction
 * to the watchlist, which is what sends the WATCHED_AUCTION_STARTING notification. Pressed again,
 * it turns the reminder off. A guest is offered sign-in first.
 */
export function RemindMeButton({ auctionId }: { auctionId: string }) {
  const { t, isReady } = useWatchlistTranslation();
  const isAuthenticated = useIsAuthenticated();
  const watchlist = useWatchlist();
  const toggle = useToggleWatch(auctionId);
  const [override, setOverride] = useState<boolean | null>(null);
  const isWatching =
    override ?? watchlist.data?.data.some((item) => item.auctionId === auctionId) ?? false;

  if (!isReady) return null;
  if (!isAuthenticated) {
    return (
      <Link href={ROUTES.login} className={buttonVariants({ isFullWidth: true })}>
        <Icon name="bell-ring" size={20} />
        {t('remind.signIn')}
      </Link>
    );
  }

  return (
    <Button
      variant={isWatching ? 'soft' : 'gold'}
      isFullWidth
      aria-pressed={isWatching}
      isLoading={toggle.isPending}
      onClick={() => {
        const next = !isWatching;
        setOverride(next);
        toggle.mutate(next, { onError: () => setOverride(!next) });
      }}
    >
      <Icon name={isWatching ? 'check' : 'bell-ring'} size={20} />
      {isWatching ? t('remind.on') : t('remind.set')}
    </Button>
  );
}
