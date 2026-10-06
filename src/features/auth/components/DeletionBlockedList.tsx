'use client';

import Link from 'next/link';
import { DELETION_BLOCKER_LINKS } from '../lib/account-deletion';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/** Every open obligation the API reported, each with a link to the screen that resolves it. */
export function DeletionBlockedList({ reasons }: { reasons: string[] }) {
  const { t } = useAuthTranslation();

  return (
    <div role="alert" className="flex flex-col gap-2 text-footnote">
      <p className="font-semibold text-destructive">{t('deleteAccount.blocked.title')}</p>
      <ul className="flex list-disc flex-col gap-1.5 ps-5 text-foreground-soft">
        {reasons.map((reason) => {
          const link = DELETION_BLOCKER_LINKS[reason];
          return (
            <li key={reason}>
              {t(`deleteAccount.reasons.${reason}`, {
                defaultValue: t('deleteAccount.reasons.unknown'),
              })}
              {link ? (
                <>
                  {' '}
                  <Link href={link.href} className="font-semibold text-primary-text">
                    {t(link.labelKey)}
                  </Link>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground">{t('deleteAccount.blocked.hint')}</p>
    </div>
  );
}
