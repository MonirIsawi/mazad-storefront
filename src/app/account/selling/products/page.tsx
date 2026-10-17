'use client';

import { AuthGuard } from '@features/auth';
import { SellerProductsPage } from '@features/selling';

export default function Page() {
  return (
    <AuthGuard>
      <SellerProductsPage />
    </AuthGuard>
  );
}
