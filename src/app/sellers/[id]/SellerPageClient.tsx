'use client';

import { useParams } from 'next/navigation';
import { SellerProfilePage } from '@features/sellers';

export function SellerPageClient() {
  const params = useParams<{ id: string }>();
  return <SellerProfilePage id={params.id} />;
}
