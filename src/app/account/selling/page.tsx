'use client';

import { AuthGuard } from '@features/auth';
import { isOpenSale, useSales } from '@features/orders';
import { SellerHubPage } from '@features/selling';

/** The hub, with the count of received orders that still need the seller (orders feature). */
function SellingHub() {
  const sales = useSales();
  return <SellerHubPage openSalesCount={sales.data?.filter(isOpenSale).length} />;
}

export default function Page() {
  return (
    <AuthGuard>
      <SellingHub />
    </AuthGuard>
  );
}
