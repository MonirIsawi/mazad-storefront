'use client';

import Link from 'next/link';
import { Avatar, Button, Icon } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useToggleFollow } from '../hooks/useToggleFollow';
import { useSellersTranslation } from '../hooks/useSellersTranslation';
import type { FollowingItem } from '../types/sellers.types';

export interface FollowingListRowProps {
  item: FollowingItem;
  isFollowing: boolean;
  onUnfollowed: () => void;
}

/**
 * A followed seller (design `.seller`): the initial, the name with the verified mark, and a
 * Following / Follow toggle that changes in place. The API gives no new-auction count, so none is
 * shown.
 */
export function FollowingListRow({ item, isFollowing, onUnfollowed }: FollowingListRowProps) {
  const { t } = useSellersTranslation();
  const toggle = useToggleFollow(item.sellerId);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-border bg-surface p-3.5">
      <Link
        href={ROUTES.sellerProfile(item.sellerId)}
        className="flex min-w-0 items-center gap-3.5 hover:text-gold"
      >
        <Avatar name={item.seller.fullName} size="md" className="size-[52px]" />
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
          <span className="line-clamp-2 leading-[1.35]">{item.seller.fullName}</span>
          {item.seller.isVerified ? (
            <Icon
              name="seal-check"
              isFilled
              size={16}
              className="shrink-0 text-gold"
              label={t('followingList.verified')}
            />
          ) : null}
        </span>
      </Link>
      {isFollowing ? (
        <Button
          variant="soft"
          size="sm"
          aria-pressed
          isLoading={toggle.isPending}
          onClick={() => toggle.mutate(false, { onSuccess: onUnfollowed })}
        >
          {toggle.isPending ? null : <Icon name="check" size={16} />}
          {t('follow.following')}
        </Button>
      ) : (
        <Button
          size="sm"
          aria-pressed={false}
          isLoading={toggle.isPending}
          onClick={() => toggle.mutate(true)}
        >
          {toggle.isPending ? null : <Icon name="plus" size={16} />}
          {t('follow.follow')}
        </Button>
      )}
    </div>
  );
}
