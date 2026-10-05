import type { Metadata } from 'next';
import { NOT_FOUND, auctionJsonLd, auctionMetadata, fetchPublicAuction } from '@shared/seo';
import { AuctionPageClient } from './AuctionPageClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return auctionMetadata(id, await fetchPublicAuction(id));
}

/**
 * Server shell: page head and structured data come from the public API (cached fetch shared with
 * generateMetadata); the interactive page itself is unchanged and renders client-side.
 */
export default async function Page({ params }: Props) {
  const { id } = await params;
  const auction = await fetchPublicAuction(id);
  return (
    <>
      {auction && auction !== NOT_FOUND ? (
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped cannot close the script element.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(auctionJsonLd(id, auction)).replace(/</g, '\u003c'),
          }}
        />
      ) : null}
      <AuctionPageClient />
    </>
  );
}
