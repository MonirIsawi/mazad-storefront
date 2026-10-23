import type { ReactNode } from 'react';
import { cn } from '@shared/lib';
import { Icon, type IconName } from './Icon';

export interface ChipProps {
  isActive: boolean;
  onClick: () => void;
  /** Result count shown after the label, already localized by the caller. */
  count?: ReactNode;
  icon?: IconName;
  /** `sm`: the 28px chips inside cards (rating tags, review tags). */
  size?: 'md' | 'sm';
  /** Renders a trailing ×: an active filter that can be removed. */
  isRemovable?: boolean;
  /** Accessible name when the visible text alone is not enough (removable filters). */
  label?: string;
  children: ReactNode;
}

/** Chip (design `.chip`): a pill on the raised surface; selected reads in soft gold. */
export function Chip({
  isActive,
  onClick,
  count,
  icon,
  size = 'md',
  isRemovable = false,
  label,
  children,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isRemovable ? undefined : isActive}
      aria-label={label}
      className={cn(chipClasses({ isActive, size }), isRemovable && 'pe-2.5')}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 13 : 16} /> : null}
      {children}
      {count != null ? <span className="font-tabular text-xs font-semibold">{count}</span> : null}
      {isRemovable ? <Icon name="x" size={14} className="opacity-80" /> : null}
    </button>
  );
}

export function chipClasses({ isActive, size = 'md' }: { isActive: boolean; size?: 'md' | 'sm' }) {
  return cn(
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium',
    'transition-[background-color,border-color,color] duration-fast ease-ios',
    size === 'sm' ? 'h-7 gap-1.5 px-[11px] text-xs' : 'h-[38px] gap-2 px-4 text-sm',
    isActive
      ? 'border-gold-line bg-gold-soft text-gold light:border-gold light:bg-[rgb(148_105_42/15%)] light:text-gold-lo'
      : 'border-border bg-surface-raised text-foreground-soft hover:border-border-strong',
  );
}
