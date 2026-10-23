'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { cn } from '@shared/lib';

const TABS = ['terms', 'privacy'] as const;
export type LegalTopic = (typeof TABS)[number];

/**
 * Terms | Privacy (design `.seg`), each tab its own address, so every "you accept the terms and
 * privacy policy" link opens the right one. Links, not tab widgets: each one is a page.
 */
export function LegalTabs({
  current,
  labels,
  navLabel,
}: {
  current: LegalTopic;
  labels: Record<LegalTopic, string>;
  navLabel: string;
}) {
  return (
    <nav aria-label={navLabel} className="w-full max-w-[420px]">
      <ul className="flex gap-1 rounded-full border border-border bg-surface-raised p-1">
        {TABS.map((tab) => {
          const isActive = tab === current;
          return (
            <li key={tab} className="flex-1">
              <Link
                href={ROUTES.helpTopic(tab)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium lg:h-[38px]',
                  'transition-[background-color,color,box-shadow] duration-fast ease-ios',
                  isActive
                    ? 'bg-surface-high text-foreground shadow-[inset_0_0_0_1px_var(--color-border-strong)] light:bg-surface light:shadow-[inset_0_0_0_1px_var(--color-gold-line),0_2px_6px_-2px_rgb(60_40_10/25%)]'
                    : 'text-foreground-soft hover:text-foreground',
                )}
              >
                {labels[tab]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
