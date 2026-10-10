'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Textarea } from '@shared/components/ui';
import { getErrorCode, pickLocalizedName } from '@shared/lib';
import { useLocale } from '@shared/hooks';
import { PRODUCT_CONDITIONS, productFormSchema } from '../schemas/selling.schema';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import type {
  ProductFormInput,
  ProductFormValues,
  SellerProduct,
  SellingCategoryOption,
  Store,
} from '../types/selling.types';

export interface ProductFormProps {
  product?: SellerProduct;
  stores: Store[];
  categories: SellingCategoryOption[];
  onDone: (product: SellerProduct) => void;
  onCancel: () => void;
}

export function ProductForm({ product, stores, categories, onDone, onCancel }: ProductFormProps) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          storeId: product.store.id,
          categoryId: product.category.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          descriptionEn: product.descriptionEn,
          descriptionAr: product.descriptionAr,
          condition: product.condition,
          marketPrice: product.marketPrice ? Number(product.marketPrice) : undefined,
        }
      : {
          storeId: stores.find((store) => store.isDefault)?.id ?? stores[0]?.id ?? '',
        },
  });

  const mutation = product ? updateProduct : createProduct;
  const errorCode = getErrorCode(mutation.error);

  const onSubmit = handleSubmit((values) => {
    if (product) {
      updateProduct.mutate({ id: product.id, values }, { onSuccess: onDone });
    } else {
      createProduct.mutate(values, { onSuccess: onDone });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {/* One store (the usual case): nothing to choose, it is preselected. */}
      {stores.length === 1 && !product ? null : (
        <Select
          label={t('fields.store')}
          placeholder={t('form.selectStore')}
          options={stores.map((store) => ({
            value: store.id,
            label: pickLocalizedName(store, locale),
          }))}
          // A product cannot change stores after creation — UpdateProductDto has no storeId.
          disabled={Boolean(product)}
          error={errors.storeId ? t(errors.storeId.message ?? '') : undefined}
          {...register('storeId')}
        />
      )}
      <Select
        label={t('fields.category')}
        placeholder={t('form.selectCategory')}
        // Only the most specific categories; a product's own stays listed even if it isn't one.
        options={categories
          .filter((category) => category.isLeaf !== false || category.id === product?.category.id)
          .map((category) => ({ value: category.id, label: category.name }))}
        error={errors.categoryId ? t(errors.categoryId.message ?? '') : undefined}
        {...register('categoryId')}
      />

      <Input
        label={t('fields.nameAr')}
        error={errors.nameAr ? t(errors.nameAr.message ?? '') : undefined}
        {...register('nameAr')}
      />
      <Input
        label={t('fields.nameEn')}
        error={errors.nameEn ? t(errors.nameEn.message ?? '') : undefined}
        {...register('nameEn')}
      />
      <Textarea
        label={t('fields.descriptionAr')}
        error={errors.descriptionAr ? t(errors.descriptionAr.message ?? '') : undefined}
        {...register('descriptionAr')}
      />
      <Textarea
        label={t('fields.descriptionEn')}
        error={errors.descriptionEn ? t(errors.descriptionEn.message ?? '') : undefined}
        {...register('descriptionEn')}
      />

      <Select
        label={t('fields.condition')}
        options={PRODUCT_CONDITIONS.map((condition) => ({
          value: condition,
          label: t(`condition.${condition}`),
        }))}
        error={errors.condition ? t(errors.condition.message ?? '') : undefined}
        {...register('condition')}
      />
      <Input
        label={t('fields.marketPrice')}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        hint={t('fields.marketPriceHint')}
        {...register('marketPrice')}
      />

      {errorCode ? (
        <p role="alert" className="text-footnote text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" isLoading={mutation.isPending}>
          {t(product ? 'form.save' : 'form.create')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
