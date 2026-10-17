'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@shared/components/ui';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';
import { AuthBrandPanel } from './AuthBrandPanel';

/**
 * The sign-in flows' page (design `authShell`): on phones a single column with a round back
 * control; from 960px two halves, the brand panel on the start side and the form on the other.
 * The panel is brand art (the mark and its gold glow), never a stock photo.
 */
export function AuthShell({ backHref, children }: { backHref: string; children: ReactNode }) {
  const { t } = useAuthTranslation();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5 px-[22px] pt-3 pb-10 lg:justify-center lg:px-[70px] lg:py-[60px]">
        <Link
          href={backHref}
          aria-label={t('shell.back')}
          className="grid size-11 place-items-center self-start rounded-full border border-border bg-surface-raised text-foreground lg:hidden"
        >
          <Icon name="caret-right" size={20} className="ltr:-scale-x-100" />
        </Link>
        {children}
      </div>
    </div>
  );
}
