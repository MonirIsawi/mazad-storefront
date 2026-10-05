import type { Metadata } from 'next';
import { fetchPublicSeller, sellerMetadata } from '@shared/seo';
import { SellerPageClient } from './SellerPageClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return sellerMetadata(id, await fetchPublicSeller(id));
}

export default function Page() {
  return <SellerPageClient />;
}
