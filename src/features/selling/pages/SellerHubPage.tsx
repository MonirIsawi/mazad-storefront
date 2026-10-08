'use client';

import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Card } from '@shared/components/ui';
import { ListRow } from '@shared/components/ios';
import { useProducts } from '../hooks/useProducts';
import { useSellerAuctions } from '../hooks/useSellerAuctions';
import { useStores } from '../hooks/useStores';
import { useSellingTranslation } from '../hooks/useSellingTranslation';

/** The seller's front door. Counts come from the same queries the child screens use, so opening
 *  one of them is already warm. `openSalesCount` (received orders that still need the seller)
 *  comes from the orders feature, composed in the route file. */
export function SellerHubPage({ openSalesCount }: { openSalesCount?: number }) {
  const { t, isReady } = useSellingTranslation();
  const stores = useStores();
  const products = useProducts();
  const auctions = useSellerAuctions();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader title={t('hub.title')} backHref={ROUTES.account} />

      <div className="flex flex-col gap-4 px-gutter pb-6">
        <p className="text-subhead text-foreground-soft">{t('hub.subtitle')}</p>

        <Card hasShadow className="overflow-hidden">
          <ListRow
            icon="package"
            title={t('hub.sales')}
            value={openSalesCount}
            href={ROUTES.sellingSales}
          />
          <ListRow
            icon="gavel"
            title={t('hub.auctions')}
            value={auctions.data?.length}
            href={ROUTES.sellingAuctions}
          />
          <ListRow
            icon="package"
            title={t('hub.products')}
            value={products.data?.length}
            href={ROUTES.sellingProducts}
          />
          <ListRow
            icon="store"
            title={t('hub.stores')}
            value={stores.data?.length}
            href={ROUTES.sellingStores}
            isLast
          />
        </Card>
      </div>
    </>
  );
}
