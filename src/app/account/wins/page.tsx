'use client';

import { AuthGuard } from '@features/auth';
import { WinsPage } from '@features/wins';
import { useAddresses } from '@features/addresses';
import { useOrderSummaries } from '@features/orders';

// My wins shows the delivery address and the order each win created; those belong to the
// addresses and orders slices, so the route composes them rather than letting wins import
// either (AGENTS.md rule 1).
function WinsRoute() {
  const addresses = useAddresses();
  const orders = useOrderSummaries();
  return <WinsPage addresses={addresses.data ?? []} orders={orders} />;
}

export default function Page() {
  return (
    <AuthGuard>
      <WinsRoute />
    </AuthGuard>
  );
}
