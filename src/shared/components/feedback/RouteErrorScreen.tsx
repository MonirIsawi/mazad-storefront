'use client';

import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@shared/components/ui';
import { EmptyState } from './EmptyState';
import { RecoveryLinks } from './NotFoundScreen';

/**
 * A page that failed (design error): it says bids are safe and offers to try again, with Browse
 * and Home as quieter ways on. Never the error's own text, which may be technical.
 */
export function RouteErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60dvh] w-full max-w-page flex-col justify-center px-5 pt-16 lg:px-10 lg:pt-0"
      data-testid="route-error"
    >
      <EmptyState
        icon="warning"
        title={t('errorPage.title')}
        titleAs="h1"
        message={t('errorPage.message')}
        action={
          <div className="grid justify-items-center gap-3">
            <Button onClick={onRetry}>
              <Icon name="arrows-clockwise" size={20} />
              {t('state.retry')}
            </Button>
            <RecoveryLinks isQuiet />
          </div>
        }
      />
    </div>
  );
}
