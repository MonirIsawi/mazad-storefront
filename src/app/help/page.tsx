import type { Metadata } from 'next';
import { HelpIndexRoute } from './help-routes';

// Public, like /account-deletion: help and policies must be readable before signing in.
export const metadata: Metadata = { title: 'المساعدة — Help' };

export default function Page() {
  return <HelpIndexRoute />;
}
