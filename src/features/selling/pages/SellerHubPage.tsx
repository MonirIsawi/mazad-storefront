'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Badge, Icon, MenuRow, buttonVariants } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useStores } from '../hooks/useStores';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { HubStats } from '../components/hub/HubStats';
import { SELLING_PATHS } from '../lib/selling-paths';

/** The seller's front door (Bidoom design `sell`). Counts come from the same queries the child
 *  screens use, so opening one of them is already warm. `openSalesCount` (received orders that
 *  still need the seller) comes from the orders feature, composed in the route file. */
export function SellerHubPage({ openSalesCount }: { openSalesCount?: number }) {
  const { t, isReady } = useSellingTranslation();
  const { number } = useMoney();
  const stores = useStores();
  const products = useProducts();
  const auctions = useSellerAuctions();

  if (!isReady) return <PageLoader />;

  const countOf = (status: string) =>
    auctions.data?.filter((auction) => auction.status === status).length;
  const count = (value: number | undefined) => (value == null ? undefined : number(value));

  return (
    <>
      <ScreenHeader
        title={t('hub.title')}
        subtitle={t('hub.subtitle')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('hub.account'), href: ROUTES.account }]}
      />

      <PageContainer className="grid gap-[18px] pb-8">
        <p className="text-[15px] leading-[1.6] text-foreground-soft lg:hidden">
          {t('hub.subtitle')}
        </p>

        <HubStats
          counts={{
            live: countOf('LIVE'),
            pending: countOf('PENDING_APPROVAL'),
            rejected: countOf('REJECTED'),
            newOrders: openSalesCount,
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link href={SELLING_PATHS.auctionNew()} className={buttonVariants({ variant: 'gold' })}>
            <Icon name="gavel" size={20} />
            {t('hub.createAuction')}
          </Link>
          <Link href={SELLING_PATHS.productNew} className={buttonVariants({ variant: 'soft' })}>
            <Icon name="plus" size={20} />
            {t('hub.addProduct')}
          </Link>
        </div>

        <nav aria-label={t('hub.areas')} className="grid gap-2.5 lg:grid-cols-2">
          <MenuRow
            icon="package"
            title={t('hub.sales')}
            href={ROUTES.sellingSales}
            tail={
              openSalesCount ? (
                <Badge tone="gold">{t('hub.newCount', { count: openSalesCount })}</Badge>
              ) : null
            }
          />
          <MenuRow
            icon="gavel"
            title={t('hub.auctions')}
            href={ROUTES.sellingAuctions}
            tail={count(auctions.data?.length)}
          />
          <MenuRow
            icon="tag"
            title={t('hub.products')}
            href={ROUTES.sellingProducts}
            tail={count(products.data?.length)}
          />
          <MenuRow
            icon="storefront"
            title={t('hub.stores')}
            href={ROUTES.sellingStores}
            tail={count(stores.data?.length)}
          />
        </nav>
      </PageContainer>
    </>
  );
}
