'use client';

import type { ReactNode } from 'react';
import { Chip } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { BrowseFilters } from '../../lib/browse-filters';
import { findCategory } from '../../lib/category-list';
import type { CategoryNode } from '../../types/catalog.types';

interface ActiveChip {
  key: string;
  label: string;
  clear: BrowseFilters;
}

function useActiveChips(filters: BrowseFilters, categories: CategoryNode[]): ActiveChip[] {
  const { t } = useCatalogTranslation();
  const { number } = useMoney();
  const chips: ActiveChip[] = [];
  const category = findCategory(categories, filters.categoryId);
  if (filters.categoryId) {
    chips.push({
      key: 'category',
      label: category?.name ?? t('filters.category'),
      clear: { categoryId: undefined },
    });
  }
  const { minPrice: min, maxPrice: max } = filters;
  if (min !== undefined || max !== undefined) {
    const label =
      min !== undefined && max !== undefined
        ? t('filters.priceBetween', { min: number(min), max: number(max) })
        : min !== undefined
          ? t('filters.priceFrom', { min: number(min) })
          : t('filters.priceUpTo', { max: number(max ?? 0) });
    chips.push({ key: 'price', label, clear: { minPrice: undefined, maxPrice: undefined } });
  }
  if (filters.condition) {
    chips.push({
      key: 'condition',
      label: t(`condition.${filters.condition}`),
      clear: { condition: undefined },
    });
  }
  if (filters.endingSoon) {
    chips.push({
      key: 'endingSoon',
      label: t('filters.finalHour'),
      clear: { endingSoon: undefined },
    });
  }
  return chips;
}

/**
 * The applied filters as removable chips above the results (design `.chip.on.x`), then whatever
 * the page adds after them (the sort on phones). Nothing at all when there is nothing to show.
 */
export function ActiveFilterChips({
  filters,
  categories,
  onRemove,
  trailing,
}: {
  filters: BrowseFilters;
  categories: CategoryNode[];
  onRemove: (clear: BrowseFilters) => void;
  trailing?: ReactNode;
}) {
  const { t } = useCatalogTranslation();
  const chips = useActiveChips(filters, categories);
  if (chips.length === 0 && !trailing) return null;

  return (
    <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          isActive
          isRemovable
          label={t('filters.remove', { label: chip.label })}
          onClick={() => onRemove(chip.clear)}
        >
          {chip.label}
        </Chip>
      ))}
      {trailing}
    </div>
  );
}
