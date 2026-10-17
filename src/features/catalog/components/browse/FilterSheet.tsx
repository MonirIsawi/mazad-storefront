'use client';

import { useState } from 'react';
import { Button, Sheet } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { useResultCount } from '../../hooks/useResultCount';
import type { BrowseFilters, SheetFilters } from '../../lib/browse-filters';
import type { CategoryNode } from '../../types/catalog.types';
import { FilterPanel } from './FilterPanel';

export interface FilterSheetProps {
  filters: BrowseFilters;
  categories: CategoryNode[];
  onApply: (next: SheetFilters) => void;
  onClose: () => void;
}

const sheetPart = ({ categoryId, status, minPrice, maxPrice, condition }: BrowseFilters) => ({
  categoryId,
  status,
  minPrice,
  maxPrice,
  condition,
});

/**
 * The filters as a bottom sheet on phones and a dialog on desktop (design `filters`). Nothing
 * changes until Apply, and Apply says what it will show: "Show 32 results", counted by the API
 * for the pending filters. Mounted only while open, so it always starts from the page's filters.
 */
export function FilterSheet({ filters, categories, onApply, onClose }: FilterSheetProps) {
  const { t } = useCatalogTranslation();
  const { number } = useMoney();
  const [pending, setPending] = useState<SheetFilters>(() => sheetPart(filters));
  const { total, isSettling } = useResultCount({ ...filters, ...pending }, true);

  const applyLabel =
    total === undefined
      ? t('filters.showResults')
      : t('filters.show', { count: total, formattedCount: number(total) });

  return (
    <Sheet
      isOpen
      onClose={onClose}
      title={t('filters.title')}
      footer={
        <div className="flex items-center gap-2.5">
          <Button variant="plain" onClick={() => setPending({})}>
            {t('filters.clearAll')}
          </Button>
          <Button
            className="flex-1"
            aria-busy={isSettling}
            onClick={() => onApply(pending)}
            data-testid="filters-apply"
          >
            {applyLabel}
          </Button>
        </div>
      }
    >
      <FilterPanel value={pending} onChange={setPending} categories={categories} isPriceLive />
    </Sheet>
  );
}
