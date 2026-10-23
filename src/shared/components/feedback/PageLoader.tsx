'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@shared/components/ui';

/**
 * A page whose shape isn't known yet (a cold route, the session check): a quiet skeleton of a title
 * and three rows, never a spinner wall. Screens that know their shape draw their own skeletons.
 */
export function PageLoader() {
  const { t } = useTranslation('common');
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-page px-5 py-6 lg:px-10"
      data-testid="page-loader"
    >
      <span className="sr-only">{t('state.loading')}</span>
      <div aria-hidden className="grid max-w-[820px] gap-3">
        <Skeleton radius="full" className="h-3 w-28" />
        <Skeleton radius="full" className="h-8 w-3/4 max-w-sm" />
        <div className="mt-3 grid gap-2.5">
          <Skeleton className="h-[62px] rounded-[22px]" />
          <Skeleton className="h-[62px] rounded-[22px]" />
          <Skeleton className="h-[62px] rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}
