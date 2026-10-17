'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmDialog, Icon } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { getErrorCode } from '@shared/lib';
import { useDeleteProduct } from '../../hooks/useProducts';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';

/** Deleting a product: asked first, in the page's own dialog, then back to the list. */
export function DeleteProductButton({ productId }: { productId: string }) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const deleteProduct = useDeleteProduct();
  const [isAsking, setIsAsking] = useState(false);
  const errorCode = getErrorCode(deleteProduct.error);

  return (
    <div className="grid gap-2 border-t border-border pt-5">
      <Button variant="dangerLine" isFullWidth onClick={() => setIsAsking(true)}>
        <Icon name="trash" size={18} />
        {t('products.delete')}
      </Button>
      {errorCode ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={isAsking}
        tone="danger"
        title={t('products.deleteTitle')}
        body={t('products.deleteBody')}
        confirmLabel={t('products.danger')}
        isPending={deleteProduct.isPending}
        onCancel={() => setIsAsking(false)}
        onConfirm={() =>
          deleteProduct.mutate(productId, {
            onSuccess: () => router.replace(ROUTES.sellingProducts),
            onSettled: () => setIsAsking(false),
          })
        }
      />
    </div>
  );
}
