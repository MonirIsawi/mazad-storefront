'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { GoldTile } from '@shared/components/ui';
import { cn } from '@shared/lib';

export interface LotRowProps {
  /** The cover thumbnail; a gold package tile without one. */
  thumbUrl: string | null;
  title: string;
  /** Opens the item (the whole row is the target; the end actions sit above it). */
  href?: string;
  /** Lines under the title: category and condition, status, price, a reason. */
  children?: ReactNode;
  /** The status or next step at the row's end. */
  end?: ReactNode;
  /** The end holds buttons: on phones they drop under the text instead of squeezing it. */
  hasActions?: boolean;
  className?: string;
}

/** A product or auction row (design `.lot-row`): thumbnail, name and details, then what's next. */
export function LotRow({
  thumbUrl,
  title,
  href,
  children,
  end,
  hasActions = false,
  className,
}: LotRowProps) {
  return (
    <div
      className={cn(
        'relative grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3.5 rounded-xl border border-border bg-surface p-3',
        'transition-[border-color] duration-medium ease-ios hover:border-border-strong lg:grid-cols-[72px_minmax(0,1fr)_auto]',
        !hasActions && 'grid-cols-[72px_minmax(0,1fr)_auto]',
        hasActions && 'items-start lg:items-center',
        className,
      )}
    >
      <span className="relative size-[72px] overflow-hidden rounded-[20px] bg-surface-raised">
        {thumbUrl ? (
          <Image src={thumbUrl} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-tile">
            <GoldTile icon="package" size="sm" className="border-0 bg-none" />
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-[3px]">
        {href ? (
          <Link
            href={href}
            className="line-clamp-2 text-[14.5px] leading-[1.35] font-medium text-foreground after:absolute after:inset-0 after:rounded-xl"
          >
            {title}
          </Link>
        ) : (
          <b className="line-clamp-2 text-[14.5px] leading-[1.35] font-medium text-foreground">
            {title}
          </b>
        )}
        {children}
      </span>
      {end ? (
        <span
          className={cn(
            'relative z-10 flex flex-wrap items-center gap-2',
            hasActions ? 'col-start-2 justify-start lg:col-start-3 lg:justify-end' : 'justify-end',
          )}
        >
          {end}
        </span>
      ) : null}
    </div>
  );
}
