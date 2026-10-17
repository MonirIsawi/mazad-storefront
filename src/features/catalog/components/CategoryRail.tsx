'use client';

import { ROUTES } from '@shared/constants';
import { CategoryTile } from '@shared/components/ios';
import { Skeleton } from '@shared/components/ui';
import { getCategoryIcon } from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useCategories } from '../hooks/useCategories';
import { flattenCategories } from '../lib/category-list';

const RAIL = 'no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 lg:mx-0 lg:gap-2.5 lg:px-0';

/**
 * The category shortcuts on the home feed (design `.cats`): round gold-glyph tiles on phones, pills
 * from 960px. "All" leads and is the current choice on home. Lives in catalog because it owns the
 * categories query; the home route composes it in (AGENTS.md rule 1).
 */
export function CategoryRail() {
  const { t, isReady } = useCatalogTranslation();
  const categories = useCategories();

  if (categories.isPending || !isReady) return <CategoryRailSkeleton />;
  if (!categories.data?.length) return null;

  return (
    <nav aria-label={t('browse.categoriesLabel')}>
      <ul className={RAIL}>
        <li>
          <CategoryTile
            label={t('browse.filters.all')}
            icon="grid"
            href={ROUTES.auctions}
            isActive
          />
        </li>
        {flattenCategories(categories.data).map((category) => (
          <li key={category.id}>
            <CategoryTile
              label={<span className="whitespace-nowrap">{category.name}</span>}
              icon={getCategoryIcon(category.slug)}
              href={`${ROUTES.auctions}?categoryId=${category.id}`}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryRailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className={RAIL}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid w-[72px] shrink-0 justify-items-center gap-[7px] lg:w-32">
          <Skeleton
            radius="lg"
            className="size-16 border border-border lg:h-[54px] lg:w-32 lg:rounded-full"
          />
          <Skeleton radius="full" className="h-2.5 w-12 lg:hidden" />
        </div>
      ))}
    </div>
  );
}
