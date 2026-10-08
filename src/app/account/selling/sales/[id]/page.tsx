'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@features/auth';
import { SaleDetailPage } from '@features/orders';

export default function Page() {
  const params = useParams<{ id: string }>();

  return (
    <AuthGuard>
      <SaleDetailPage id={params.id} />
    </AuthGuard>
  );
}
