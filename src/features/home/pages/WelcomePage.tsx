'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Trans } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { BrandLockup } from '@shared/components/brand';
import { GoldTile, SlideToConfirm, buttonVariants, type IconName } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { markWelcomeSeen } from '../hooks/useFirstRunWelcome';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { pickFeatured } from '../lib/home-feed';
import { WelcomeArt } from '../components/welcome/WelcomeArt';

const PERKS: { icon: IconName; key: string }[] = [
  { icon: 'live', key: 'live' },
  // Not "verified sellers": verification is per seller, not a promise about all of them.
  { icon: 'cash', key: 'cod' },
  { icon: 'hourglass', key: 'antiSniping' },
];

const LINK_CLASS = 'text-gold underline underline-offset-4';

/**
 * First run (design `welcome`): one picture, one sentence of promise, and slide to start, the same
 * gesture that later confirms a bid. Signing in stays one tap away. It stays dark in the light
 * theme too: a photo page.
 */
export function WelcomePage() {
  const { t, isReady } = useHomeTranslation();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const feed = useHomeFeed();
  const photo = pickFeatured(feed.data)?.product.coverImage ?? null;

  useEffect(() => markWelcomeSeen(), []);

  return (
    <div
      data-surface="dark"
      className="relative grid min-h-dvh content-end bg-background text-foreground lg:grid-cols-[1.1fr_1fr] lg:content-stretch"
    >
      <WelcomeArt photo={photo} isLoading={feed.isPending} />
      {isReady ? (
        <div className="relative grid gap-4 px-[22px] pt-10 pb-11 lg:max-w-[620px] lg:content-center lg:px-[70px] lg:py-[60px]">
          <BrandLockup className="mb-1.5" />
          <h1 className="font-display text-[32px] leading-[1.18] font-normal ar:text-display lg:text-display-lg">
            {t('welcome.title')}
          </h1>
          <ul className="my-0.5 grid grid-cols-3 gap-2.5">
            {PERKS.map((perk) => (
              <li key={perk.key} className="grid justify-items-center gap-2 text-center">
                <GoldTile icon={perk.icon} />
                <span className="text-[11.5px] leading-[1.35] font-medium text-foreground-soft">
                  {t(`welcome.perks.${perk.key}`)}
                </span>
              </li>
            ))}
          </ul>
          <SlideToConfirm
            label={t('welcome.slide')}
            doneLabel={t('welcome.slideDone')}
            icon="arrow-right"
            // The arrow points the way the knob travels: leftwards in Arabic.
            className="rtl:[&_.bg-grad_svg]:-scale-x-100"
            confirmTitle={t('welcome.confirmTitle')}
            confirmBody={t('welcome.confirmBody')}
            confirmLabel={t('welcome.confirmLabel')}
            onConfirm={() => router.replace(ROUTES.home)}
          />
          {isAuthenticated ? null : (
            <Link
              href={ROUTES.login}
              className={buttonVariants({ variant: 'soft', isFullWidth: true })}
            >
              {t('welcome.signIn')}
            </Link>
          )}
          <p className="text-center text-xs text-muted-foreground">
            <Trans
              t={t}
              i18nKey="welcome.terms"
              components={{
                terms: <Link href={ROUTES.helpTopic('terms')} className={LINK_CLASS} />,
                privacy: <Link href={ROUTES.helpTopic('privacy')} className={LINK_CLASS} />,
              }}
            />
          </p>
        </div>
      ) : null}
    </div>
  );
}
