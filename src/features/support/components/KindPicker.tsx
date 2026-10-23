'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Icon, type IconName } from '@shared/components/ui';
import type { ReportKind } from '../schemas/support.schema';

export const KIND_ICONS: Record<ReportKind, IconName> = {
  PROBLEM: 'warning',
  SUGGESTION: 'lightning',
  OTHER: 'info',
};

const KINDS: ReportKind[] = ['PROBLEM', 'SUGGESTION', 'OTHER'];

/**
 * Problem | Suggestion | Other on the design's segmented track (`.seg`): native radios, so the
 * keyboard and screen readers treat it as the single choice it is.
 */
export function KindPicker({
  legend,
  labels,
  field,
}: {
  legend: string;
  labels: Record<ReportKind, string>;
  field: UseFormRegisterReturn<'kind'>;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{legend}</legend>
      <div className="flex gap-1 rounded-full border border-border bg-surface-raised p-1">
        {KINDS.map((kind) => (
          <label key={kind} className="relative min-w-0 flex-1 cursor-pointer">
            <input type="radio" value={kind} className="peer sr-only" {...field} />
            <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-2 text-[13.5px] font-medium text-foreground-soft transition-[background-color,color] duration-fast ease-ios peer-checked:bg-surface-high peer-checked:text-foreground peer-checked:shadow-[inset_0_0_0_1px_var(--color-border-strong)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold light:peer-checked:bg-surface light:peer-checked:shadow-[inset_0_0_0_1px_var(--color-gold-line)] lg:h-[38px]">
              <Icon name={KIND_ICONS[kind]} size={16} className="shrink-0" />
              <span className="truncate">{labels[kind]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
