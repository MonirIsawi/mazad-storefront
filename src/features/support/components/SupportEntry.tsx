'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Card, buttonVariants } from '@shared/components/ui';
import { useSupportContact } from '../hooks/useSupportContact';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import { ChannelList } from './ChannelList';

/**
 * The help centre's last card (design `.help-cta`): "Didn't find your answer?" with Contact us when
 * the API has support reports, or the configured chat channels; nothing at all when neither exists.
 */
export function SupportEntry() {
  const { t, isReady } = useSupportTranslation();
  const { canReport, channels, hasContact } = useSupportContact();
  if (!isReady || !hasContact) return null;
  if (!canReport) return <ChannelList channels={channels} />;
  return (
    <Card className="flex items-center gap-3.5 p-[18px]" data-testid="support-entry">
      <span className="grid min-w-0 flex-1 gap-[3px]">
        <span className="font-medium text-foreground">{t('entry.title')}</span>
        <span className="text-xs text-muted-foreground">
          {channels.length ? t('entry.reportWithChat') : t('entry.report')}
        </span>
      </span>
      <Link href={ROUTES.contact} className={buttonVariants({ variant: 'gold', size: 'sm' })}>
        {t('entry.action')}
      </Link>
    </Card>
  );
}
