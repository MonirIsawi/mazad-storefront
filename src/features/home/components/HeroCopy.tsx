'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Icon, buttonVariants } from '@shared/components/ui';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { TrustPills } from './PerksRow';

/** The desktop hero copy beside the featured lot (design `.dhero .dh-copy`); the page's h1 there. */
export function HeroCopy() {
  const { t } = useHomeTranslation();
  return (
    <div className="hidden content-center gap-[18px] lg:grid">
      <p className="text-[13px] tracking-[0.02em] text-gold light:text-gold-lo">
        {t('hero.kicker')}
      </p>
      <h1 className="font-display text-[60px] leading-[1.08] font-light text-foreground">
        {t('hero.title')}
        <span className="text-gold light:text-gold-lo">{t('hero.titleGold')}</span>
      </h1>
      <p className="max-w-[46ch] text-[15px] leading-[1.7] text-foreground-soft">
        {t('hero.body')}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href={ROUTES.auctions} className={buttonVariants({ variant: 'gold' })}>
          {t('hero.browse')}
          <Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />
        </Link>
        <Link
          href={ROUTES.helpTopic('how-auctions-work')}
          className={buttonVariants({ variant: 'line' })}
        >
          <Icon name="question" size={18} />
          {t('hero.how')}
        </Link>
      </div>
      <TrustPills />
    </div>
  );
}
