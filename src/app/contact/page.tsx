import type { Metadata } from 'next';
import { AuthGuard } from '@features/auth';
import { ContactPage } from '@features/support';

export const metadata: Metadata = {
  title: 'تواصل معنا — Contact us',
  robots: { index: false },
};

/**
 * Reports and suggestions (signed in). `?orderId=` (ROUTES.orderProblem) opens it as a problem
 * report about that order. On an API without support reports the page says it isn't available.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string | string[] }>;
}) {
  const { orderId } = await searchParams;
  return (
    <AuthGuard>
      <ContactPage orderId={typeof orderId === 'string' && orderId ? orderId : undefined} />
    </AuthGuard>
  );
}
