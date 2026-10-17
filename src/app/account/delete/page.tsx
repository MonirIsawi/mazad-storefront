'use client';

import { AuthGuard, DeleteAccountPage } from '@features/auth';

export default function Page() {
  return (
    <AuthGuard>
      <DeleteAccountPage />
    </AuthGuard>
  );
}
