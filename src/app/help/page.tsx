import type { Metadata } from 'next';
import { HelpIndexPage } from '@features/help';

// Public, like /account-deletion: help and policies must be readable before signing in.
export const metadata: Metadata = { title: 'المساعدة — Help' };

export default function Page() {
  return <HelpIndexPage />;
}
