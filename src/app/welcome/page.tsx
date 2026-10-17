import type { Metadata } from 'next';
import { WelcomePage } from '@features/home';

// The first-run page is reached from home on a first visit; it is not a page to index.
export const metadata: Metadata = {
  title: 'أهلاً — Welcome',
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WelcomePage />;
}
