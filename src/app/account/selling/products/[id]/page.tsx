'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@features/auth';
import { ProductEditorPage } from '@features/selling';
import { useSellingCategories } from '../useSellingCategories';

function EditProduct() {
  const params = useParams<{ id: string }>();
  return <ProductEditorPage productId={params.id} categories={useSellingCategories()} />;
}

export default function Page() {
  return (
    <AuthGuard>
      <EditProduct />
    </AuthGuard>
  );
}
