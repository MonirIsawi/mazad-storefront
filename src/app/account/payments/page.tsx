'use client';

import { AuthGuard } from '@features/auth';
import { PaymentsPage } from '@features/orders';

export default function Page() {
  return (
    <AuthGuard>
      <PaymentsPage />
    </AuthGuard>
  );
}
