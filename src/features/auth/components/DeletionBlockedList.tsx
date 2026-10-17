'use client';

import Link from 'next/link';
import { Icon } from '@shared/components/ui';
import { DELETION_BLOCKER_LINKS } from '../lib/account-deletion';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/** Every open obligation the API reported, each with a link to the screen that resolves it. */
export function DeletionBlockedList({ reasons }: { reasons: string[] }) {
  const { t } = useAuthTranslation();

  return (
    <div role="alert" className="grid gap-2.5 rounded-lg bg-destructive-soft p-4 text-sm">
      <p className="font-semibold text-destructive">{t('deleteAccount.blocked.title')}</p>
      <ul className="grid gap-2 text-foreground">
        {reasons.map((reason) => {
          const link = DELETION_BLOCKER_LINKS[reason];
          return (
            <li key={reason} className="flex gap-2">
              <Icon name="x-circle" size={18} className="mt-0.5 shrink-0 text-destructive" />
              <span>
                {t(`deleteAccount.reasons.${reason}`, {
                  defaultValue: t('deleteAccount.reasons.unknown'),
                })}
                {link ? (
                  <>
                    {' '}
                    <Link
                      href={link.href}
                      className="font-semibold text-gold underline underline-offset-2 light:text-gold-lo"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-foreground-soft">{t('deleteAccount.blocked.hint')}</p>
    </div>
  );
}
