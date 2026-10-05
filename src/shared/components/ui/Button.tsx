import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib';
import { Spinner } from './Spinner';

// Press feedback changes color or opacity only — never geometry — so a tap can't reflow the row
// it sits in. `hover:` is safe here: Tailwind v4 only emits it under `@media (hover: hover)`.
const VARIANT_CLASSES = {
  filled: 'bg-primary text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed',
  tinted: 'bg-primary-tint text-primary-text hover:opacity-75 active:opacity-75',
  gray: 'bg-fill text-foreground hover:opacity-70 active:opacity-70',
  outline: 'border border-border bg-transparent text-foreground hover:bg-fill active:bg-fill',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-85 active:opacity-85',
  plain: 'bg-transparent text-primary-text hover:bg-fill active:bg-fill',
} as const;

// Every size clears the 44pt touch target except `sm`, which is only for chips-in-cards and
// other controls that already sit inside a padded 44pt row.
const SIZE_CLASSES = {
  sm: 'h-9 px-3.5 text-footnote rounded-sm',
  md: 'h-touch px-[18px] text-subhead rounded-md',
  lg: 'h-13 px-6 text-headline rounded-md',
  icon: 'size-touch rounded-full',
} as const;

export interface ButtonVariantProps {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  isFullWidth?: boolean;
  /** The blue glow under the one primary CTA on a screen. Filled variant only. */
  hasShadow?: boolean;
}

/** Shares Button's visual style with plain `<Link>`s that navigate rather than act. */
export function buttonVariants({
  variant = 'filled',
  size = 'md',
  isFullWidth = false,
  hasShadow = false,
}: ButtonVariantProps = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 font-semibold',
    'transition-[background-color,opacity,box-shadow] duration-fast ease-ios',
    'disabled:pointer-events-none disabled:bg-fill disabled:text-foreground-disabled disabled:shadow-none',
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    // Filled and destructive keep the 14px button radius at every size; the quieter variants
    // take their size's own radius.
    (variant === 'filled' || variant === 'destructive') && size !== 'icon' && 'rounded-md',
    isFullWidth && 'w-full',
    hasShadow && variant === 'filled' && 'shadow-button',
  );
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>, ButtonVariantProps {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'filled',
    size = 'md',
    isFullWidth = false,
    hasShadow = false,
    isLoading = false,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, isFullWidth, hasShadow }), className)}
      {...props}
    >
      {isLoading ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
});
