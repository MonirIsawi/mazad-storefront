'use client';

import { forwardRef, useId, useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FIELD_ERROR } from '@shared/components/ui';
import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { OTP_CODE_LENGTH } from '../../schemas/auth.schema';

interface OtpCodeFieldProps {
  label: string;
  value: string;
  error?: string;
  field: UseFormRegisterReturn<'code'>;
}

/**
 * Six boxes (design `.otp`) over one real input, so typing, pasting, the phone's one-time-code
 * autofill and screen readers all see a single labelled field.
 */
export const OtpCodeField = forwardRef<HTMLDivElement, OtpCodeFieldProps>(function OtpCodeField(
  { label, value, error, field },
  ref,
) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const chars = Array.from(value.slice(0, OTP_CODE_LENGTH));
  const active = Math.min(chars.length, OTP_CODE_LENGTH - 1);

  return (
    <div ref={ref} className="grid gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative mx-auto flex gap-2.5" dir="ltr">
        {Array.from({ length: OTP_CODE_LENGTH }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              'grid h-[58px] w-12 place-items-center rounded-2xl border bg-surface font-num text-[22px] font-medium text-foreground',
              error ? 'border-destructive' : 'border-border-strong',
              isFocused &&
                index === active &&
                'border-gold shadow-[0_0_0_4px_var(--color-gold-soft)]',
            )}
          >
            {chars[index] ?? ''}
          </span>
        ))}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_CODE_LENGTH}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0"
          {...field}
          onFocus={() => setIsFocused(true)}
          onBlur={(event) => {
            setIsFocused(false);
            void field.onBlur(event);
          }}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className={cn(FIELD_ERROR, 'justify-center')}>
          <Icon name="warning" size={15} />
          {error}
        </p>
      ) : null}
    </div>
  );
});
