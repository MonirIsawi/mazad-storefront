'use client';

import { AuthGuard } from '@features/auth';
import { ProductEditorPage } from '@features/selling';
import { useSellingCategories } from '../useSellingCategories';

function NewProduct() {
  return <ProductEditorPage categories={useSellingCategories()} />;
}

export default function Page() {
  return (
    <AuthGuard>
      <NewProduct />
    </AuthGuard>
  );
}
