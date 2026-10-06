import type { Metadata } from 'next';
import { AccountDeletionInfoPage } from '@features/auth';

// Public on purpose (no AuthGuard): app stores link here for "how do I delete my account". It sits
// outside /account/ so robots.ts keeps it indexable.
export const metadata: Metadata = {
  title: 'حذف الحساب — Delete your account',
};

export default function Page() {
  return <AccountDeletionInfoPage />;
}
