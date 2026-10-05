import type { Metadata } from 'next';
import { fetchPublicStore, storeMetadata } from '@shared/seo';
import { StorePageClient } from './StorePageClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return storeMetadata(id, await fetchPublicStore(id));
}

export default function Page() {
  return <StorePageClient />;
}
