'use client';

import { useId, useState } from 'react';
import { Button, Card } from '@shared/components/ui';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { DeleteAccountForm } from './DeleteAccountForm';

/**
 * The account screen's danger zone. Deleting is never one tap: the button only opens the
 * confirmation in place (the same ask-then-act pattern as Buy now and opening a return).
 */
export function DeleteAccountSection() {
  const { t } = useAuthTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const titleId = useId();

  return (
    <Card
      isInset
      hasShadow={false}
      aria-labelledby={titleId}
      role="region"
      className="flex flex-col gap-3 border-destructive/30"
    >
      <h2 id={titleId} className="text-headline font-semibold text-destructive">
        {t('deleteAccount.title')}
      </h2>
      <p className="text-footnote text-muted-foreground">{t('deleteAccount.summary')}</p>

      {isConfirming ? (
        <DeleteAccountForm onCancel={() => setIsConfirming(false)} />
      ) : (
        <Button
          variant="gray"
          size="lg"
          isFullWidth
          className="text-destructive"
          onClick={() => setIsConfirming(true)}
        >
          {t('deleteAccount.open')}
        </Button>
      )}
    </Card>
  );
}
