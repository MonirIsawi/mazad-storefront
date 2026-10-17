'use client';

import { Avatar, Badge, Card } from '@shared/components/ui';
import { isolatePhone } from '@shared/lib';
import type { AuthUser } from '../../types/auth.types';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';

/** Who is signed in: the initial on the gold disc, the full name, the phone and the verified mark. */
export function ProfileCard({ user }: { user: AuthUser }) {
  const { t } = useAuthTranslation();
  return (
    <Card isInset className="flex items-center gap-3.5">
      <Avatar name={user.fullName} size="lg" />
      <div className="grid min-w-0 flex-1 gap-[3px]">
        <p className="truncate text-lg font-medium text-foreground">{user.fullName}</p>
        {user.phone ? (
          <p className="font-tabular text-[13px] text-foreground-soft">
            {isolatePhone(user.phone)}
          </p>
        ) : null}
        {user.isVerified ? (
          <Badge tone="gold" icon="seal-check" isIconFilled className="justify-self-start">
            {t('account.verified')}
          </Badge>
        ) : null}
      </div>
    </Card>
  );
}
