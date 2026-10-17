'use client';

import type { ReactNode } from 'react';
import { Chip } from '@shared/components/ui';
import { getCategoryIcon } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { CONDITION_VALUES, STATUS_VALUES, type SheetFilters } from '../../lib/browse-filters';
import { flattenCategories } from '../../lib/category-list';
import type { CategoryNode } from '../../types/catalog.types';
import { PriceRange } from './PriceRange';

export interface FilterPanelProps {
  value: SheetFilters;
  onChange: (next: SheetFilters) => void;
  categories: CategoryNode[];
  /** The sheet applies prices as they are typed (nothing is shown until Apply); the column on blur. */
  isPriceLive?: boolean;
}

/**
 * The filter column on desktop and the body of the filter sheet on phones (design `filterPanel`):
 * status, category, current price and condition. Only filters the API has: there is no city.
 */
export function FilterPanel({
  value,
  onChange,
  categories,
  isPriceLive = false,
}: FilterPanelProps) {
  const { t } = useCatalogTranslation();
  const set = (changes: Partial<SheetFilters>) => onChange({ ...value, ...changes });

  return (
    <div className="grid gap-5">
      <Group legend={t('filters.status')}>
        <Chip isActive={!value.status} onClick={() => set({ status: undefined })}>
          {t('browse.filters.all')}
        </Chip>
        {STATUS_VALUES.map((status) => (
          <Chip key={status} isActive={value.status === status} onClick={() => set({ status })}>
            {t(`browse.filters.${status}`)}
          </Chip>
        ))}
      </Group>

      {categories.length > 0 ? (
        <Group legend={t('filters.category')}>
          {flattenCategories(categories).map((category) => {
            const isActive = value.categoryId === category.id;
            return (
              <Chip
                key={category.id}
                icon={getCategoryIcon(category.slug)}
                isActive={isActive}
                onClick={() => set({ categoryId: isActive ? undefined : category.id })}
              >
                {category.name}
              </Chip>
            );
          })}
        </Group>
      ) : null}

      <PriceRange
        minPrice={value.minPrice}
        maxPrice={value.maxPrice}
        isLive={isPriceLive}
        onChange={(range) => set(range)}
      />

      <Group legend={t('filters.condition')}>
        {CONDITION_VALUES.map((condition) => {
          const isActive = value.condition === condition;
          return (
            <Chip
              key={condition}
              isActive={isActive}
              onClick={() => set({ condition: isActive ? undefined : condition })}
            >
              {t(`condition.${condition}`)}
            </Chip>
          );
        })}
      </Group>
    </div>
  );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-2.5">
      <legend className="mb-2.5 text-[13.5px] font-medium text-foreground-soft">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
