import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@shared/lib';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Shown under the field when there's no error — the two never appear together. */
  hint?: string;
  isLabelHidden?: boolean;
  /** A control inside the field's end edge (e.g. show/hide password). */
  trailing?: ReactNode;
}

/** Input — iOS text field: label above, 50pt field, inline error or hint below. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, isLabelHidden = false, trailing, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          'text-footnote font-semibold text-foreground-soft',
          isLabelHidden && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="relative flex">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'h-[50px] rounded-md border border-border bg-surface px-3.5 text-body text-foreground',
            'placeholder:text-muted-foreground',
            'transition-colors duration-fast ease-ios focus:border-primary',
            'disabled:bg-fill disabled:text-foreground-disabled',
            error && 'border-destructive',
            trailing ? 'w-full pe-12' : 'w-full',
            className,
          )}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 end-1 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-footnote text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-footnote text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
