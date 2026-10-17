'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@features/auth';
import { PageLoader } from '@shared/components/feedback';
import { ROUTES } from '@shared/constants';
import { SellerAuctionsPage } from '@features/selling';

// Links made before the form had its own page (ROUTES.sellingAuctionNew, notifications) carry
// ?productId= here: they open the new-auction page for that product.
function SellerAuctionsRoute() {
  const router = useRouter();
  const productId = useSearchParams().get('productId');
  useEffect(() => {
    if (productId) {
      router.replace(`${ROUTES.sellingAuctions}/new?productId=${encodeURIComponent(productId)}`);
    }
  }, [productId, router]);
  return productId ? <PageLoader /> : <SellerAuctionsPage />;
}

// useSearchParams needs a Suspense boundary above it or the whole route opts out of static
// rendering (Next.js bails the prerender otherwise).
export default function Page() {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <SellerAuctionsRoute />
      </Suspense>
    </AuthGuard>
  );
}
