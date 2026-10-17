'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@features/auth';
import { AuctionEditorPage } from '@features/selling';

function EditAuction() {
  const params = useParams<{ id: string }>();
  return <AuctionEditorPage auctionId={params.id} />;
}

export default function Page() {
  return (
    <AuthGuard>
      <EditAuction />
    </AuthGuard>
  );
}
