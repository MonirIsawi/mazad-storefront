'use client';

import { Button, Icon, buttonVariants } from '@shared/components/ui';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/**
 * Under the code: open the Telegram bot (only when the API gave its link) and change the number,
 * which goes back to the details with the name and password kept.
 */
export function CodeStepActions({
  telegramDeepLink,
  onChangePhone,
}: {
  telegramDeepLink?: string;
  onChangePhone: () => void;
}) {
  const { t } = useAuthTranslation();
  return (
    <div className="flex gap-2.5">
      {telegramDeepLink ? (
        <a
          href={telegramDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'soft', isFullWidth: true })}
        >
          <Icon name="telegram" size={20} />
          {t('register.openTelegramLink')}
        </a>
      ) : null}
      <Button variant="soft" isFullWidth onClick={onChangePhone}>
        {t('register.changePhone')}
      </Button>
    </div>
  );
}
