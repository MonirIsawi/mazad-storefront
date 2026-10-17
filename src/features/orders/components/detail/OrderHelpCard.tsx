'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Icon, buttonVariants } from '@shared/components/ui';
import { useApiFeature } from '@shared/hooks';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { DetailCard } from './DetailCard';

/**
 * Beside a delivered order (and its rating): the return and contact ways out, so a problem
 * doesn't have to become a one-star review. The return itself opens on the item.
 */
export function OrderHelpCard({ orderId }: { orderId: string }) {
  const { t } = useOrdersTranslation();
  const hasReports = useApiFeature('supportReports') === true;
  return (
    <DetailCard title={t('view.somethingWrong')}>
      <p className="text-sm leading-[1.7] text-foreground-soft">{t('view.somethingWrongBody')}</p>
      <div className="flex flex-wrap gap-2.5">
        <a href="#order-items" className={buttonVariants({ variant: 'soft', size: 'sm' })}>
          <Icon name="undo" size={16} />
          {t('actions.openReturn')}
        </a>
        {hasReports ? (
          <Link
            href={ROUTES.orderProblem(orderId)}
            className={buttonVariants({ variant: 'soft', size: 'sm' })}
          >
            {t('view.contact')}
          </Link>
        ) : null}
      </div>
    </DetailCard>
  );
}
