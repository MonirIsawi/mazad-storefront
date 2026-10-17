'use client';

import { useState, type ReactNode } from 'react';
import { Card, CardTitle, Icon, KeyValueList, type KeyValueRow } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { cn, pickLocalizedName } from '@shared/lib';
import type { Locale } from '@shared/store';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { Auction } from '../../types/catalog.types';

/** Longer than this, the description starts folded with "Read the full description". */
const FOLD_AT = 280;

/** The reading language's text, else the other one's; mazad-api already fills an empty side. */
export function pickText(
  en: string | null | undefined,
  ar: string | null | undefined,
  locale: Locale,
) {
  const text = locale === 'ar' ? ar?.trim() || en?.trim() : en?.trim() || ar?.trim();
  return text ?? '';
}

/** The seller's specifications with both a name and a value, in the reading language. */
export function productSpecs(auction: Auction, locale: Locale) {
  return (auction.product.variants ?? []).flatMap((variant) => {
    const name = pickText(variant.nameEn, variant.nameAr, locale);
    const value = pickText(variant.valueEn, variant.valueAr, locale);
    return name && value ? [{ name, value }] : [];
  });
}

/**
 * About this item (design `About this item`): condition and the seller's specs as chips, the full
 * description (folded when long, never cut), and every detail in the specifications fold. Only
 * what the seller entered: there are no brand or model fields.
 */
export function AboutItemCard({ auction }: { auction: Auction }) {
  const { t } = useCatalogTranslation();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { condition, category } = auction.product;
  const description = pickText(
    auction.product.descriptionEn,
    auction.product.descriptionAr,
    locale,
  );
  const specs = productSpecs(auction, locale);
  const isLong = description.length > FOLD_AT;
  // With a parent, the parent is the main category and the product's own the subcategory.
  const main = category?.parent ?? category;
  const sub = category?.parent ? category : null;

  const rows: KeyValueRow[] = [
    {
      key: 'condition',
      label: t('detail.condition'),
      value: (
        <>
          <span className="block">{t(`condition.${condition}`)}</span>
          <span className="block text-xs text-muted-foreground">
            {t(`conditionHint.${condition}`)}
          </span>
        </>
      ),
    },
    ...(main
      ? [{ key: 'category', label: t('detail.category'), value: pickLocalizedName(main, locale) }]
      : []),
    ...(sub
      ? [{ key: 'sub', label: t('detail.subcategory'), value: pickLocalizedName(sub, locale) }]
      : []),
    ...specs.map((spec, index) => ({ key: `spec-${index}`, label: spec.name, value: spec.value })),
  ];

  return (
    <Card>
      <CardTitle>{t('about.title')}</CardTitle>
      <div className="grid gap-3.5 p-[18px] pt-3.5">
        <ul className="flex flex-wrap gap-2">
          <Chip icon="seal-check">{t(`condition.${condition}`)}</Chip>
          {specs.slice(0, 3).map((spec, index) => (
            <Chip key={`${index}-${spec.name}`} icon="tag">
              {spec.name} <b className="font-semibold text-foreground">{spec.value}</b>
            </Chip>
          ))}
        </ul>

        <div className="grid gap-2">
          <p
            className={cn(
              'text-[15px] leading-[1.7] whitespace-pre-wrap text-foreground-soft',
              isLong && !isOpen && 'line-clamp-4',
            )}
            data-testid="detail-description"
          >
            {description || t('detail.noDescription')}
          </p>
          {isLong ? (
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
              className="inline-flex min-h-touch items-center gap-1 justify-self-start text-sm font-medium text-gold light:text-gold-lo"
            >
              {isOpen ? t('about.readLess') : t('about.readMore')}
              <Icon name="caret-down" size={14} className={cn(isOpen && 'rotate-180')} />
            </button>
          ) : null}
        </div>

        <details className="group border-t border-border pt-1">
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
            <Icon name="tag" size={18} className="text-gold" />
            <span className="flex-1">{t('about.specs')}</span>
            <Icon
              name="caret-down"
              size={16}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <div data-testid="detail-product-info">
            <KeyValueList rows={rows} />
          </div>
        </details>
      </div>
    </Card>
  );
}

function Chip({ icon, children }: { icon: 'seal-check' | 'tag'; children: ReactNode }) {
  return (
    <li className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong px-3.5 text-[13px] text-foreground-soft">
      <Icon name={icon} size={16} className="text-gold" />
      {children}
    </li>
  );
}
