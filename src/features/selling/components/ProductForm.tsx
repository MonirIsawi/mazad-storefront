'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Textarea } from '@shared/components/ui';
import { getErrorCode, pickLocalizedName } from '@shared/lib';
import { useLocale } from '@shared/hooks';
import { productFormSchema } from '../schemas/selling.schema';
import { groupDinars } from '../lib/dinars';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { ConditionChoice } from './products/ConditionChoice';
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
  onCancel?: () => void;
  /** True while the page finishes after a save (uploading the photos picked before it). */
  isFinishing?: boolean;
}

/**
 * The product's details (design `product-form`): store and category, the Arabic and English
 * names side by side, condition as a segmented choice, the description, and the optional new
 * retail price that powers "below new price" on the auction. Photos sit above it, on the page.
 */
export function ProductForm({
  product,
  stores,
  categories,
  onDone,
  onCancel,
  isFinishing = false,
}: ProductFormProps) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
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
          marketPrice: product.marketPrice ? groupDinars(String(Number(product.marketPrice))) : '',
        }
      : {
          storeId: stores.find((store) => store.isDefault)?.id ?? stores[0]?.id ?? '',
        },
  });

  const condition = useWatch({ control, name: 'condition' });
  const marketPrice = register('marketPrice');
  const mutation = product ? updateProduct : createProduct;
  const errorCode = getErrorCode(mutation.error);
  const message = (key?: string) => (key ? t(key) : undefined);

  const onSubmit = handleSubmit((values) => {
    if (product) {
      updateProduct.mutate({ id: product.id, values }, { onSuccess: onDone });
    } else {
      createProduct.mutate(values, { onSuccess: onDone });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
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
            error={message(errors.storeId?.message)}
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
          error={message(errors.categoryId?.message)}
          {...register('categoryId')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label={t('fields.nameAr')}
          dir="rtl"
          error={message(errors.nameAr?.message)}
          {...register('nameAr')}
        />
        <Input
          label={t('fields.nameEn')}
          dir="ltr"
          error={message(errors.nameEn?.message)}
          {...register('nameEn')}
        />
      </div>
      <p className="-mt-2 text-[12.5px] text-muted-foreground">{t('fields.oneLanguageHint')}</p>

      <ConditionChoice
        label={t('fields.condition')}
        selected={condition}
        error={message(errors.condition?.message)}
        {...register('condition')}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          label={t('fields.descriptionAr')}
          dir="rtl"
          error={message(errors.descriptionAr?.message)}
          {...register('descriptionAr')}
        />
        <Textarea
          label={t('fields.descriptionEn')}
          dir="ltr"
          error={message(errors.descriptionEn?.message)}
          {...register('descriptionEn')}
        />
      </div>

      {/* Whole dinars, grouped as typed ("1,250,000"); empty sends nothing. */}
      <Input
        label={t('fields.marketPrice')}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="font-tabular"
        hint={t('fields.marketPriceHint')}
        error={message(errors.marketPrice?.message)}
        trailing={
          <span className="pe-3 text-sm text-muted-foreground">{t('fields.currency')}</span>
        }
        {...marketPrice}
        onChange={(event) => {
          event.target.value = groupDinars(event.target.value);
          void marketPrice.onChange(event);
        }}
      />

      {errorCode ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}

      <div className="grid gap-2.5">
        <Button type="submit" isFullWidth isLoading={mutation.isPending || isFinishing}>
          {t(product ? 'form.save' : 'products.saveNew')}
        </Button>
        {onCancel ? (
          <Button type="button" variant="plain" isFullWidth onClick={onCancel}>
            {t('form.cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
