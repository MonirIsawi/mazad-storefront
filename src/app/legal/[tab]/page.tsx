import { notFound, permanentRedirect } from 'next/navigation';
import { ROUTES } from '@shared/constants';

const TABS = ['terms', 'privacy'];

/** /legal/terms and /legal/privacy (the design's addresses) → the canonical /help pages. */
export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!TABS.includes(tab)) notFound();
  permanentRedirect(ROUTES.helpTopic(tab));
}
