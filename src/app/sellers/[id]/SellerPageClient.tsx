'use client';

import { useParams } from 'next/navigation';
import { SellerAuctionsRail, StoreRatingLink } from '@features/catalog';
import { SellerProfilePage } from '@features/sellers';
import { SellerFollowToggle } from '@app/sellers/SellerFollowToggle';

/** The seller page, with the catalog's parts composed in: their live auctions, and a rating that
 *  opens their store's ratings tab while the API has store ratings. */
export function SellerPageClient() {
  const params = useParams<{ id: string }>();
  return (
    <SellerProfilePage
      id={params.id}
      renderFollowToggle={(sellerId) => <SellerFollowToggle sellerId={sellerId} size="md" />}
      renderRating={(storeId, rating) => (
        <StoreRatingLink storeId={storeId}>{rating}</StoreRatingLink>
      )}
      renderAuctions={(title) => <SellerAuctionsRail sellerId={params.id} title={title} />}
    />
  );
}
