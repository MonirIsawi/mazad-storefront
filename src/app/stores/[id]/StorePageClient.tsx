'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { StorePage } from '@features/catalog';
import { SellerFollowToggle } from '@app/sellers/SellerFollowToggle';

const TABS = ['live', 'upcoming', 'ended', 'ratings'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return (TABS as readonly (string | null)[]).includes(value);
}

export function StorePageClient() {
  const params = useParams<{ id: string }>();
  const tab = useSearchParams().get('tab');
  return (
    <StorePage
      id={params.id}
      initialTab={isTab(tab) ? tab : undefined}
      renderSellerFollowToggle={(sellerId) => (
        <SellerFollowToggle sellerId={sellerId} size="md" isFullWidth />
      )}
    />
  );
}
