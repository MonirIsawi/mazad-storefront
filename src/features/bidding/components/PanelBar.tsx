import type { ReactNode } from 'react';
import { cn } from '@shared/lib';

/**
 * The panel's one action that has to stay in reach: pinned to the foot of the screen on phones
 * (design `.bidbar`, a glass pill over a fade) and simply in the panel from 960px. One element for
 * both widths, so it is never in the page twice.
 */
export function PanelBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[600px] px-[18px] pt-3.5 pb-[calc(env(safe-area-inset-bottom)+18px)]',
        'bg-[linear-gradient(transparent,var(--color-background)_26%)]',
        'lg:static lg:z-auto lg:mx-0 lg:max-w-none lg:bg-none lg:p-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
