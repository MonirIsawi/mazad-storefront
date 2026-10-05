'use client';

import { Button } from '@shared/components/ui';
import { useCountdown } from '@shared/hooks';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

interface ResendCodeButtonProps {
  availableAt: string;
  isResending: boolean;
  onResend: () => void;
}

/** Its own component so the once-a-second countdown re-renders only this button. */
export function ResendCodeButton({ availableAt, isResending, onResend }: ResendCodeButtonProps) {
  const { t } = useAuthTranslation();
  const secondsLeft = Math.ceil(useCountdown(availableAt) / 1000);
  const isWaiting = secondsLeft > 0;

  return (
    <Button
      variant="plain"
      size="sm"
      onClick={onResend}
      disabled={isWaiting}
      isLoading={isResending}
      className="self-start"
    >
      {isWaiting ? t('register.resendIn', { seconds: secondsLeft }) : t('register.resend')}
    </Button>
  );
}
