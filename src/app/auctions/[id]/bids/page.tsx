'use client';

import { useParams } from 'next/navigation';
import { BidHistoryPage } from '@features/catalog';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <BidHistoryPage id={params.id} />;
}
