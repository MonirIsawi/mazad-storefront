'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@features/auth';
import { PageLoader } from '@shared/components/feedback';
import { AuctionEditorPage } from '@features/selling';

function NewAuction() {
  const searchParams = useSearchParams();
  return (
    <AuctionEditorPage
      productId={searchParams.get('productId') ?? undefined}
      relistId={searchParams.get('relist') ?? undefined}
    />
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <NewAuction />
      </Suspense>
    </AuthGuard>
  );
}
