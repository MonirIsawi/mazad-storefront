import type { CategoryNode } from '../types/catalog.types';

/**
 * The category tree as one list in reading order: each main category followed by its
 * subcategories. Filtering by a main category includes its subcategories (the API matches a
 * category with its descendants), so both levels are useful shortcuts.
 */
export function flattenCategories(categories: CategoryNode[]): CategoryNode[] {
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) => [category, ...flattenCategories(category.children)]);
}

/** A category anywhere in the tree, by id. */
export function findCategory(categories: CategoryNode[], id: string | undefined) {
  if (!id) return undefined;
  return flattenCategories(categories).find((category) => category.id === id);
}
