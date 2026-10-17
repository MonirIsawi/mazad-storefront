'use client';

import { cn } from '@shared/lib';

export interface Choice<T extends string> {
  id: T;
  label: string;
  /** The language of the label itself ("English" inside the Arabic page). */
  lang?: string;
}

/**
 * Two exclusive choices switched in place (design `.seg` on the Appearance and Language rows): a
 * labelled group of pressed/not-pressed buttons, so nothing navigates away.
 */
export function ChoiceSegment<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: Choice<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex w-[150px] gap-1 rounded-full border border-border bg-surface-raised p-1"
    >
      {choices.map((choice) => {
        const isOn = choice.id === value;
        return (
          <button
            key={choice.id}
            type="button"
            lang={choice.lang}
            aria-pressed={isOn}
            onClick={() => onChange(choice.id)}
            className={cn(
              'h-[38px] min-w-0 flex-1 rounded-full text-sm font-medium whitespace-nowrap',
              'transition-[background-color,color,box-shadow] duration-fast ease-ios',
              isOn
                ? 'bg-surface-high text-foreground shadow-[inset_0_0_0_1px_var(--color-border-strong)] light:bg-surface light:shadow-[inset_0_0_0_1px_var(--color-gold-line)]'
                : 'text-foreground-soft hover:text-foreground',
            )}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
