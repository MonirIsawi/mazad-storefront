'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { useStoreReviews } from '../../hooks/useStoreReviews';

/**
 * A rating that opens the ratings tab of a store (the seller page's score). While the API has no
 * store ratings (404) it stays plain text: there is no tab to open.
 */
export function StoreRatingLink({ storeId, children }: { storeId: string; children: ReactNode }) {
  const { t } = useCatalogTranslation();
  const reviews = useStoreReviews(storeId);
  if (!reviews.isAvailable) return <span>{children}</span>;
  return (
    <Link
      href={`${ROUTES.store(storeId)}?tab=ratings`}
      title={t('store.ratings.openTab')}
      className="relative rounded-lg after:absolute after:-inset-x-2 after:-inset-y-[11px] hover:[&_.text-muted-foreground]:text-gold"
    >
      {children}
    </Link>
  );
}
