'use client';

import { AuthGuard } from '@features/auth';
import { SalesPage } from '@features/orders';

export default function Page() {
  return (
    <AuthGuard>
      <SalesPage />
    </AuthGuard>
  );
}
