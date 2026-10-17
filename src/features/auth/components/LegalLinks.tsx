'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { ROUTES } from '@shared/constants';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/**
 * Help, Privacy and Terms for someone not signed in yet: the sign-in and sign-up screens have no
 * tab bar, so this is how they reach the policies before creating an account.
 */
export function LegalLinks() {
  const { t } = useAuthTranslation();
  const links = [
    { href: ROUTES.help, label: t('legal.help') },
    { href: ROUTES.helpTopic('privacy'), label: t('legal.privacy') },
    { href: ROUTES.helpTopic('terms'), label: t('legal.terms') },
  ];

  return (
    <nav aria-label={t('legal.label')} data-testid="legal-links">
      <ul className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground">
        {links.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 ? (
              <li aria-hidden className="select-none">
                ·
              </li>
            ) : null}
            <li>
              <Link
                href={link.href}
                className="inline-flex min-h-6 items-center text-gold underline underline-offset-2 light:text-gold-lo"
              >
                {link.label}
              </Link>
            </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
