'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { AppTabBar, SiteFooter, SiteHeader, type FooterColumn } from '@shared/components/layout';
import { AuctionCardActionProvider } from '@shared/components/cards';
import { cn } from '@shared/lib';
import { useApiFeature } from '@shared/hooks';

// Keeps watchlist's JS out of routes that never render an AuctionCard (login/register): this is
// still the one place app/ composes a feature into shared/'s presentational components; the
// shared components themselves stay feature-agnostic (see AGENTS.md's dependency rules).
const WatchlistToggle = dynamic(
  () => import('@features/watchlist').then((m) => ({ default: m.WatchlistToggle })),
  { ssr: false },
);

// The header's bell and avatar read the auth and notifications features; loaded on the side so
// neither lands in every route's first chunk.
const HeaderActions = dynamic(() => import('./HeaderActions').then((m) => m.HeaderActions), {
  ssr: false,
});

/** Pages with no chrome at all: the first-run welcome is a full-bleed photo page. */
const BARE_ROUTES: string[] = ['/welcome'];

/** Sign-in flows are a step away from browsing: no header or tab bar (design authShell). */
const AUTH_ROUTES: string[] = [ROUTES.login, ROUTES.register, ROUTES.resetPassword];

/** The five tab roots, plus the seller hub, keep the phone tab bar. */
const TAB_ROOTS = new Set<string>([
  ROUTES.home,
  ROUTES.auctions,
  ROUTES.myBids,
  ROUTES.watchlistList,
  ROUTES.account,
  ROUTES.selling,
]);

/**
 * Pushed screens: a back control at the top on phones and no tab bar (an auction has its bid bar
 * instead). Routes this list doesn't know (a 404) keep the tab bar, so there is a way out.
 */
const PUSHED_ROUTE_PATTERN =
  /^\/(auctions\/[^/]+(\/bids)?|stores\/[^/]+|sellers\/[^/]+|account\/.+|help(\/.*)?|legal(\/.*)?|contact|account-deletion)$/;

function useFooterColumns(): FooterColumn[] {
  const { t } = useTranslation('common');
  // Contact us only once the API has support reports (hidden, never a dead link, until then).
  const canContact = useApiFeature('supportReports') === true;
  return [
    {
      title: t('footer.shop'),
      links: [
        { href: ROUTES.auctions, label: t('footer.allAuctions') },
        { href: `${ROUTES.auctions}?status=live&sort=endingSoon`, label: t('footer.endingSoon') },
      ],
    },
    {
      title: t('footer.selling'),
      links: [
        { href: ROUTES.selling, label: t('footer.startSelling') },
        { href: ROUTES.sellingAuctions, label: t('footer.createAuction') },
        { href: ROUTES.helpTopic('selling'), label: t('footer.sellingRules') },
      ],
    },
    {
      title: t('footer.help'),
      links: [
        { href: ROUTES.helpTopic('how-auctions-work'), label: t('footer.howAuctionsWork') },
        { href: ROUTES.helpTopic('payments'), label: t('footer.paymentsReturns') },
        { href: ROUTES.helpTopic('privacy'), label: t('footer.privacyTerms') },
        { href: ROUTES.help, label: t('footer.helpCentre') },
        ...(canContact ? [{ href: ROUTES.contact, label: t('footer.contact') }] : []),
      ],
    },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const footerColumns = useFooterColumns();
  const isBare = BARE_ROUTES.includes(pathname);
  const isAuth = AUTH_ROUTES.includes(pathname);
  const hasChrome = !isBare && !isAuth;
  const hasTabBar = hasChrome && (TAB_ROOTS.has(pathname) || !PUSHED_ROUTE_PATTERN.test(pathname));

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-grad px-5 py-3 font-semibold text-gold-ink focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t('nav.skip')}
      </a>
      {hasChrome ? <SiteHeader actions={<HeaderActions />} /> : null}
      <AuctionCardActionProvider render={(auctionId) => <WatchlistToggle auctionId={auctionId} />}>
        <main
          id="main"
          className={cn(
            'flex-1 pt-[env(safe-area-inset-top)] lg:pt-0',
            // Clears the floating tab bar and the home indicator on phones.
            hasTabBar &&
              'pb-[calc(var(--spacing-tab-bar-floating)+env(safe-area-inset-bottom))] lg:pb-0',
          )}
        >
          {children}
        </main>
      </AuctionCardActionProvider>
      {hasChrome ? <SiteFooter columns={footerColumns} /> : null}
      {hasTabBar ? <AppTabBar /> : null}
    </div>
  );
}
