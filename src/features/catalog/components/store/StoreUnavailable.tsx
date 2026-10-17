'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '@shared/components/feedback';
import { Button, buttonVariants } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { getErrorCode, getErrorStatus } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';

/**
 * Why the store can't be shown. A 404 (missing, removed or suspended store, or a banned seller)
 * and a 403 won't change on retry: offer a way on instead. Retry stays for network and server
 * failures, which can.
 */
export function StoreUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const status = getErrorStatus(error);
  const isNotFound = status === 404 || getErrorCode(error) === 'STORE_NOT_FOUND';

  if (!isNotFound && status !== 403) {
    return <ErrorState message={t('store.loadError')} onRetry={onRetry} />;
  }

  // Back where the buyer came from; home when the store was the first page they opened.
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));
  return (
    <EmptyState
      icon="store"
      title={t(isNotFound ? 'store.notFound' : 'store.unavailable')}
      titleAs="h1"
      message={t(isNotFound ? 'store.notFoundMessage' : 'store.unavailableMessage')}
      action={
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button variant="soft" onClick={goBack}>
            {tCommon('nav.back')}
          </Button>
          <Link href={ROUTES.auctions} className={buttonVariants({ variant: 'gold' })}>
            {t('detail.browseAuctions')}
          </Link>
        </div>
      }
    />
  );
}
