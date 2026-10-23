'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { EmptyState } from '@shared/components/feedback';
import { buttonVariants } from '@shared/components/ui';
import { useSupportTranslation } from '../hooks/useSupportTranslation';

/** The contact screen on an API without support reports: said plainly, with the way to help. */
export function ContactUnavailable() {
  const { t } = useSupportTranslation();
  return (
    <div data-testid="contact-unavailable">
      <EmptyState
        icon="info"
        title={t('unavailable.title')}
        message={t('unavailable.message')}
        action={
          <Link href={ROUTES.help} className={buttonVariants({ variant: 'soft' })}>
            {t('unavailable.help')}
          </Link>
        }
      />
    </div>
  );
}
