'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { cn, getErrorCode } from '@shared/lib';
import { useFollowing } from '../hooks/useFollowing';
import { useToggleFollow } from '../hooks/useToggleFollow';
import { useSellersTranslation } from '../hooks/useSellersTranslation';

export interface FollowSellerButtonProps {
  sellerId: string;
  /** `md`: the store and seller pages, where Follow is the one gold action. */
  size?: 'sm' | 'md';
  isFullWidth?: boolean;
  /**
   * `quiet`: a gold outline instead of the gold fill, where Follow is not the page's one primary
   * action (the seller card on an auction page, where bidding is).
   */
  emphasis?: 'primary' | 'quiet';
}

// Same optimistic-override shape as watchlist's WatchlistToggle — see that file's comment for
// why there's no useEffect syncing local state from the query result.
export function FollowSellerButton({
  sellerId,
  size = 'sm',
  isFullWidth = false,
  emphasis = 'primary',
}: FollowSellerButtonProps) {
  const { t } = useSellersTranslation();
  const { t: tCommon } = useTranslation('common');
  const isAuthenticated = useIsAuthenticated();
  const following = useFollowing();
  const toggle = useToggleFollow(sellerId);

  const isKnownFollowing = following.data?.data.some((item) => item.sellerId === sellerId) ?? false;
  const [optimisticOverride, setOptimisticOverride] = useState<boolean | null>(null);
  const isFollowing = optimisticOverride ?? isKnownFollowing;
  const errorCode = getErrorCode(toggle.error);

  if (!isAuthenticated) return null;

  const handleClick = () => {
    const next = !isFollowing;
    setOptimisticOverride(next);
    toggle.mutate(next, { onError: () => setOptimisticOverride(!next) });
  };

  return (
    <div className={cn('flex flex-col gap-1', isFullWidth && 'w-full')}>
      <Button
        type="button"
        variant={isFollowing ? 'soft' : emphasis === 'quiet' ? 'line' : 'gold'}
        size={size}
        isFullWidth={isFullWidth}
        isLoading={toggle.isPending}
        onClick={handleClick}
      >
        {toggle.isPending ? null : (
          <Icon name={isFollowing ? 'check' : 'plus'} size={size === 'md' ? 20 : 16} />
        )}
        {isFollowing ? t('follow.following') : t('follow.follow')}
      </Button>
      {errorCode ? (
        <p role="alert" className="text-xs text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
    </div>
  );
}
