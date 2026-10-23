'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { useSupportContact } from '../hooks/useSupportContact';
import { useSupportTranslation } from '../hooks/useSupportTranslation';

const LINK =
  'font-medium text-gold underline decoration-gold-line decoration-1 underline-offset-[3px] hover:decoration-gold light:text-gold-lo';

/**
 * "Still have a question? Contact us" (design legal footer line), for the help and policy pages.
 * Renders nothing when this deployment has no way to reach us.
 */
export function SupportInlineLink() {
  const { t, isReady } = useSupportTranslation();
  const { canReport, channels } = useSupportContact();
  if (!isReady) return null;
  const links = [
    ...(canReport ? [{ href: ROUTES.contact, label: t('entry.action'), isExternal: false }] : []),
    ...channels.map((channel) => ({
      href: channel.href,
      label: t(`channels.${channel.id}`),
      isExternal: true,
    })),
  ];
  if (links.length === 0) return null;
  return (
    <p className="text-[13px] text-muted-foreground" data-testid="support-inline">
      {t('entry.inlineLead')}{' '}
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? ' · ' : null}
          {link.isExternal ? (
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
              {link.label}
              <span className="sr-only"> {t('channels.newTab')}</span>
            </a>
          ) : (
            <Link href={link.href} className={LINK}>
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}
