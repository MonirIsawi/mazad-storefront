'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { GoldTile, Select } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import type { ReportOrder } from '../schemas/support.schema';

/** The first item's name in the page language (the order's own snapshot first). */
export function orderItemName(order: ReportOrder, locale: 'ar' | 'en'): string {
  const item = order.items[0];
  const names = [item?.display, item?.product];
  for (const name of names) {
    const value = locale === 'en' ? name?.nameEn || name?.nameAr : name?.nameAr || name?.nameEn;
    if (value) return value;
  }
  return '';
}

/**
 * The optional "which order" picker: only my own orders (the API refuses any other). The chosen
 * order is shown underneath with its number and status, as the design's attached-order row.
 */
export function OrderField({
  orders,
  isLoading,
  selectedId,
  field,
}: {
  orders: ReportOrder[];
  isLoading: boolean;
  selectedId?: string;
  field: UseFormRegisterReturn<'orderId'>;
}) {
  const { t } = useSupportTranslation();
  const { locale } = useLocale();
  const statusOf = (order: ReportOrder) => t(`orderStatus.${order.status}`, order.status);
  const options = orders.map((order) => {
    const name = orderItemName(order, locale);
    return { value: order.id, label: name ? `${order.orderNumber} · ${name}` : order.orderNumber };
  });
  const selected = orders.find((order) => order.id === selectedId);

  return (
    <div className="grid gap-2.5">
      <Select
        label={t('form.order')}
        hint={isLoading ? t('form.orderLoading') : t('form.orderHint')}
        placeholder={t('form.orderNone')}
        options={options}
        disabled={isLoading}
        {...field}
      />
      {selected ? (
        <div className="flex items-center gap-3 rounded-[20px] border border-border bg-surface-raised p-3">
          <GoldTile icon="package" />
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate text-[14.5px] font-medium text-foreground">
              {orderItemName(selected, locale) || selected.orderNumber}
            </span>
            <span className="text-xs text-muted-foreground">
              <bdi className="font-num">{selected.orderNumber}</bdi> · {statusOf(selected)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
