'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib';
import { IconButton } from '@shared/components/ui';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

export interface ArticleHeaderProps {
  /** The page's one h1. */
  title: string;
  /** Where the phone back control goes. */
  backHref: string;
  /** A small centred title in the phone bar (the help centre's "Help and policies"). */
  barTitle?: string;
  /** Desktop breadcrumbs before the current page. */
  crumbs?: Crumb[];
  /** The current page's crumb, when it differs from the title (legal: "Terms & privacy"). */
  currentCrumb?: string;
  /** The display size (the help centre's question) instead of the page-title size. */
  isDisplay?: boolean;
  /** Lines under the title: a summary, a date. */
  children?: ReactNode;
}

/**
 * The header of a reading page (design help, help-topic, legal, contact): on phones a sticky bar
 * with the round back control, then the title large and start-aligned under it; from 960px the
 * breadcrumbs and the same title. Render it as a direct child of the page column (PageContainer)
 * so the bar stays put while the page scrolls.
 */
export function ArticleHeader({
  title,
  backHref,
  barTitle,
  crumbs = [],
  currentCrumb,
  isDisplay = false,
  children,
}: ArticleHeaderProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  return (
    <>
      <div className="sticky top-0 z-30 -mx-1 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 bg-[linear-gradient(var(--color-background)_70%,transparent)] pt-2 pb-3 lg:hidden">
        <IconButton
          name="caret-right"
          className="ltr:[&>svg]:-scale-x-100"
          label={t('nav.back')}
          onClick={() => router.push(backHref)}
        />
        {barTitle ? (
          <p className="truncate text-center text-[17px] font-medium text-foreground">{barTitle}</p>
        ) : (
          <span />
        )}
        <span />
      </div>
      <div className="grid gap-1.5">
        <Breadcrumbs
          items={[...crumbs, { label: currentCrumb ?? title }]}
          className="hidden lg:block"
        />
        <h1
          className={cn(
            'font-display font-normal text-balance text-foreground',
            isDisplay ? 'text-display lg:text-display-lg' : 'text-h1 lg:text-h1-lg',
          )}
        >
          {title}
        </h1>
        {children}
      </div>
    </>
  );
}
