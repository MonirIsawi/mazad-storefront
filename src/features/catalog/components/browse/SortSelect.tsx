'use client';

import { useId } from 'react';
import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { SORT_VALUES } from '../../lib/browse-filters';
import type { CatalogSort } from '../../types/catalog.types';

/**
 * The sort as a chip with a native picker under it (design `.chip` with a caret): the system list
 * on phones, and a keyboard and a screen reader already know a select.
 */
export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: CatalogSort | undefined;
  onChange: (sort: CatalogSort) => void;
  className?: string;
}) {
  const { t } = useCatalogTranslation();
  const id = useId();
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <label htmlFor={id} className="sr-only">
        {t('browse.sortLabel')}
      </label>
      <Icon
        name="sort"
        size={16}
        className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-foreground-soft"
      />
      <select
        id={id}
        value={value ?? 'endingSoon'}
        onChange={(event) => onChange(event.target.value as CatalogSort)}
        className={cn(
          'h-[38px] appearance-none rounded-full border border-border bg-surface-raised ps-9 pe-9 text-sm font-medium text-foreground-soft',
          'hover:border-border-strong focus-visible:border-gold lg:h-11 lg:border-border-strong lg:bg-surface',
        )}
      >
        {SORT_VALUES.map((sort) => (
          <option key={sort} value={sort}>
            {t(`browse.sort.${sort}`)}
          </option>
        ))}
      </select>
      <Icon
        name="caret-down"
        size={14}
        className="pointer-events-none absolute inset-y-0 end-3.5 my-auto text-foreground-soft"
      />
    </div>
  );
}
