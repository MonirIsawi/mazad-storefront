'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs, type Crumb } from '@shared/components/layout';
import { IconButton } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';

/**
 * The seller page's bar: on phones a back control and the page's name (the h1 is the seller's
 * name in the card below, as the design has it); from 960px, breadcrumbs.
 */
export function SellerTopBar({ label, crumbs }: { label: string; crumbs: Crumb[] }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));

  return (
    <div className="sticky top-0 z-30 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 bg-[linear-gradient(var(--color-background)_70%,transparent)] px-4 pt-2 pb-3 lg:static lg:mx-auto lg:block lg:max-w-[900px] lg:bg-none lg:px-10 lg:pt-0 lg:pb-0">
      <IconButton
        name="caret-right"
        className="lg:hidden ltr:[&>svg]:-scale-x-100"
        label={t('nav.back')}
        onClick={goBack}
      />
      <p className="truncate text-center text-[17px] font-medium text-foreground lg:hidden">
        {label}
      </p>
      <span className="lg:hidden" />
      <Breadcrumbs items={crumbs} className="hidden lg:block" />
    </div>
  );
}
