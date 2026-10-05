'use client';

import { useParams } from 'next/navigation';
import { StorePage } from '@features/catalog';
import { FollowSellerButton } from '@features/sellers';

export function StorePageClient() {
  const params = useParams<{ id: string }>();
  return (
    <StorePage
      id={params.id}
      renderSellerFollowToggle={(sellerId) => <FollowSellerButton sellerId={sellerId} />}
    />
  );
}
