import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the standard 16pt inset so simple cards don't need a CardContent wrapper. */
  isInset?: boolean;
  hasShadow?: boolean;
}

/**
 * Card — white surface, radius 18, soft shadow and no border. Dropping the shadow swaps in a
 * hairline border instead, for the dense list groups where stacked shadows would muddy.
 */
export function Card({ isInset = false, hasShadow = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface',
        hasShadow ? 'shadow-card' : 'border border-border',
        isInset && 'p-4',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('px-4 pt-4 text-title-3 font-bold text-foreground', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}

export interface SectionHeaderProps {
  title: ReactNode;
  actionLabel?: ReactNode;
  /** Renders the action as a link when given an href, as a button when given onAction. */
  action?: ReactNode;
  className?: string;
}

/** SectionHeader — the "title + عرض الكل" row that opens every home-feed section. */
export function SectionHeader({ title, actionLabel, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex min-h-touch items-center justify-between gap-3 px-1 pb-2', className)}>
      <h2 className="text-title-2 font-bold text-foreground">{title}</h2>
      {action ??
        (actionLabel ? (
          <span className="text-subhead font-semibold text-primary-text">{actionLabel}</span>
        ) : null)}
    </div>
  );
}
