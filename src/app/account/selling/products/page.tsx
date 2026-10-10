'use client';

import { AuthGuard } from '@features/auth';
import { useCategories, type CategoryNode } from '@features/catalog';
import { SellerProductsPage, type SellingCategoryOption } from '@features/selling';

/**
 * /categories is a tree, but a product attaches to exactly one node, so the picker needs it flat.
 * Children keep their parent in the label — "Electronics › Laptops" — because leaf names alone
 * ("Laptops", "Other") are ambiguous once they're out of the hierarchy.
 */
function flattenCategories(nodes: CategoryNode[], parentName?: string): SellingCategoryOption[] {
  return nodes.flatMap((node) => {
    const name = parentName ? `${parentName} › ${node.name}` : node.name;
    return [
      { id: node.id, name, isLeaf: node.children.length === 0 },
      ...flattenCategories(node.children, name),
    ];
  });
}

/**
 * The one place catalog and selling meet. A product form needs the category list, but selling
 * may not import another feature slice (AGENTS.md rule 1), so the route reads it here and hands
 * it down — the same seam the wins screen uses for addresses.
 */
export default function Page() {
  const categories = useCategories();

  return (
    <AuthGuard>
      <SellerProductsPage categories={flattenCategories(categories.data ?? [])} />
    </AuthGuard>
  );
}
