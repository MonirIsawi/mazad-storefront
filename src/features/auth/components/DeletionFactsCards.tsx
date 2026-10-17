'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, Icon } from '@shared/components/ui';
import { DELETION_BLOCKERS, DELETION_BLOCKER_LINKS } from '../lib/account-deletion';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

const AFTER = ['permanent', 'signedOut', 'phone'] as const;

function FactCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card isInset className="grid gap-2.5 text-[14.5px] leading-[1.7] text-foreground-soft">
      <h2 className="text-h3 font-medium text-foreground">{title}</h2>
      {children}
    </Card>
  );
}

/** What must be closed first, what is deleted, what is kept and what happens after. */
export function DeletionFactsCards() {
  const { t } = useAuthTranslation();
  return (
    <>
      <FactCard title={t('deleteAccount.closeFirst')}>
        <p>{t('deleteAccount.closeFirstIntro')}</p>
        <ul className="grid gap-1">
          {DELETION_BLOCKERS.map((reason) => {
            const link = DELETION_BLOCKER_LINKS[reason];
            const body = (
              <>
                <Icon name="lock" size={17} className="mt-1 shrink-0 text-muted-foreground" />
                <span className="flex-1">{t(`deleteAccount.reasons.${reason}`)}</span>
                {link ? (
                  <Icon name="caret-left" size={16} className="mt-1 ltr:-scale-x-100" />
                ) : null}
              </>
            );
            return (
              <li key={reason}>
                {link ? (
                  <Link
                    href={link.href}
                    className="flex min-h-11 gap-2.5 py-1.5 hover:text-foreground"
                  >
                    {body}
                  </Link>
                ) : (
                  <span className="flex min-h-11 gap-2.5 py-1.5">{body}</span>
                )}
              </li>
            );
          })}
        </ul>
      </FactCard>
      <FactCard title={t('deleteAccount.deletedTitle')}>
        <p>{t('deleteAccount.consequences.removed')}</p>
      </FactCard>
      <FactCard title={t('deleteAccount.keptTitle')}>
        <p>{t('deleteAccount.consequences.kept')}</p>
      </FactCard>
      <FactCard title={t('deleteAccount.afterTitle')}>
        <ul className="grid list-disc gap-1 ps-5">
          {AFTER.map((key) => (
            <li key={key}>{t(`deleteAccount.consequences.${key}`)}</li>
          ))}
        </ul>
      </FactCard>
    </>
  );
}
