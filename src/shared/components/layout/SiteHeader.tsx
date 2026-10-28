'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { cn, resolveActiveTabHref } from '@shared/lib';
import { BrandLockup } from '@shared/components/brand';
import { Icon } from '@shared/components/ui';

/**
 * The desktop header (design `.dh`), from 960px: the lockup, a search that lands on Browse, the
 * four destinations and the account actions (bell and avatar, or sign in), which app/ composes in
 * because they read feature data.
 */
export function SiteHeader({ actions }: { actions?: ReactNode }) {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const router = useRouter();
  const searchId = useId();
  const [query, setQuery] = useState('');

  const links = [
    { href: ROUTES.auctions, label: t('header.browse') },
    { href: ROUTES.myBids, label: t('header.bids') },
    { href: ROUTES.watchlistList, label: t('header.watchlist') },
    { href: ROUTES.selling, label: t('header.sell') },
  ];
  const active = resolveActiveTabHref(
    links.map((link) => link.href),
    pathname,
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${ROUTES.auctions}?q=${encodeURIComponent(q)}` : ROUTES.auctions);
  }

  return (
    <header className="sticky top-0 z-40 hidden h-header border-b border-border bg-header backdrop-blur-[18px] lg:block">
      <div className="mx-auto flex h-full w-full max-w-page items-center gap-7 px-10">
        <Link href={ROUTES.home} aria-label={t('header.home')} className="shrink-0 rounded-md">
          <BrandLockup />
        </Link>
        <form role="search" onSubmit={handleSearch} className="min-w-0 max-w-[520px] flex-1">
          <label htmlFor={searchId} className="sr-only">
            {t('search.label')}
          </label>
          <div className="flex h-[46px] items-center gap-2.5 rounded-full border border-border-strong bg-surface px-[18px] focus-within:border-gold focus-within:shadow-[0_0_0_4px_var(--color-gold-soft)]">
            <Icon name="search" size={19} className="text-foreground-soft" />
            <input
              id={searchId}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>
        </form>
        <nav aria-label={t('nav.main')} className="flex gap-1.5">
          {links.map((link) => {
            const isActive = link.href === active;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-fast',
                  isActive
                    ? 'bg-surface-raised text-foreground'
                    : 'text-foreground-soft hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2.5">{actions}</div>
      </div>
    </header>
  );
}
