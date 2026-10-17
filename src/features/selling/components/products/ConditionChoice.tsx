'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { FIELD_LABEL } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { PRODUCT_CONDITIONS } from '../../schemas/selling.schema';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { ProductCondition } from '../../types/selling.types';

export interface ConditionChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /** The chosen condition, for its one-line explanation under the choice. */
  selected?: ProductCondition | '';
  error?: string;
}

/**
 * The product's condition as a segmented choice (design `.seg`): native radios under the pills,
 * so it is one tab stop with arrow keys between the four and works with react-hook-form's
 * `register` as is.
 */
export const ConditionChoice = forwardRef<HTMLInputElement, ConditionChoiceProps>(
  function ConditionChoice({ label, selected, error, ...input }, ref) {
    const { t } = useSellingTranslation();
    const id = useId();
    return (
      <fieldset
        className="grid gap-2"
        aria-describedby={error ? `${id}-error` : selected ? `${id}-hint` : undefined}
      >
        <legend className={cn(FIELD_LABEL, 'mb-2')}>{label}</legend>
        <div className="grid grid-cols-4 gap-1 rounded-full border border-border bg-surface-raised p-1">
          {PRODUCT_CONDITIONS.map((condition) => (
            <label
              key={condition}
              className={cn(
                'relative inline-flex h-11 cursor-pointer items-center justify-center rounded-full px-1 text-center text-[13.5px] font-medium text-foreground-soft',
                'transition-[background-color,color,box-shadow] duration-fast ease-ios hover:text-foreground',
                'has-checked:bg-surface-high has-checked:text-foreground has-checked:shadow-[inset_0_0_0_1px_var(--color-border-strong)]',
                'light:has-checked:bg-surface light:has-checked:shadow-[inset_0_0_0_1px_var(--color-gold-line)]',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold',
              )}
            >
              <input ref={ref} type="radio" value={condition} className="sr-only" {...input} />
              {t(`condition.${condition}`)}
            </label>
          ))}
        </div>
        {error ? (
          <p id={`${id}-error`} className="text-[12.5px] text-destructive">
            {error}
          </p>
        ) : selected ? (
          <p id={`${id}-hint`} className="text-[12.5px] text-muted-foreground">
            {t(`conditionHint.${selected}`)}
          </p>
        ) : null}
      </fieldset>
    );
  },
);
