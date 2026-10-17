import type { ReactNode } from 'react';
import { Card } from '@shared/components/ui';
import { cn } from '@shared/lib';

/** A titled card of the order page (design `.card.pad` with a `.t-h3` heading and a trailing slot). */
export function DetailCard({
  title,
  trailing,
  children,
  className,
  tone,
  testId,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'plain' | 'gold';
  testId?: string;
}) {
  return (
    <Card isInset tone={tone} className={cn('grid gap-3.5', className)} data-testid={testId}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-medium text-foreground">{title}</h2>
        {trailing}
      </div>
      {children}
    </Card>
  );
}
