'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@shared/constants';
import { EmptyState, PageLoader } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { buttonVariants } from '@shared/components/ui';
import { canEditAuction } from '../lib/auction-permissions';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { AuctionForm } from '../components/AuctionForm';
import { SELLING_COLUMN, SellingHeader } from '../components/SellingHeader';

export interface AuctionEditorPageProps {
  /** Editing a draft or rejected auction. */
  auctionId?: string;
  /** A new auction for this product ("List in auction"). */
  productId?: string;
  /** A new auction pre-filled from this ended one ("List again"). */
  relistId?: string;
}

/** Create, edit or re-list an auction (Bidoom design `create-auction`). */
export function AuctionEditorPage({ auctionId, productId, relistId }: AuctionEditorPageProps) {
  const { t, isReady } = useSellingTranslation();
  const router = useRouter();
  const auctions = useSellerAuctions();
  const products = useProducts();

  if (!isReady) return <PageLoader />;

  const auction = auctionId ? auctions.data?.find((item) => item.id === auctionId) : undefined;
  const relistFrom = relistId ? auctions.data?.find((item) => item.id === relistId) : undefined;
  const isLoading = products.isPending || (Boolean(auctionId || relistId) && auctions.isPending);
  const isMissing =
    Boolean(auctionId) && !isLoading && (!auction || !canEditAuction(auction.status));
  const title = auctionId
    ? 'auctions.editTitle'
    : relistId
      ? 'auctions.relistTitle'
      : 'auctions.newTitle';
  const backToList = () => router.push(ROUTES.sellingAuctions);

  return (
    <>
      <SellingHeader
        width="wide"
        title={t(title)}
        backHref={ROUTES.sellingAuctions}
        crumbs={[{ label: t('auctions.title'), href: ROUTES.sellingAuctions }]}
      />
      <PageContainer className={`pb-10 ${SELLING_COLUMN.wide}`}>
        {isLoading ? (
          <PageLoader />
        ) : isMissing ? (
          <EmptyState
            icon="gavel"
            title={t(auction ? 'auctions.notEditable' : 'auctions.notFound')}
            message={t('auctions.emptyHint')}
            action={
              <Link href={ROUTES.sellingAuctions} className={buttonVariants({ variant: 'soft' })}>
                {t('auctions.title')}
              </Link>
            }
          />
        ) : (
          <AuctionForm
            auction={auction}
            relistFrom={relistFrom}
            products={products.data ?? []}
            initialProductId={productId}
            onDone={backToList}
            onCancel={backToList}
          />
        )}
      </PageContainer>
    </>
  );
}
