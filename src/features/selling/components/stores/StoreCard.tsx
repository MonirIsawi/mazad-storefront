'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button, Icon, InitialTile, Price, buttonVariants } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useLocale } from '@shared/hooks';
import { cn, joinList, parseMoney, pickLocalizedName, resolveThumbUrl } from '@shared/lib';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { Store } from '../../types/selling.types';

const SPEC =
  'inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-3.5 text-[13px] whitespace-nowrap text-foreground-soft';

/**
 * One of the seller's stores (design `my-stores`): its tile (or cover), name and city, the
 * default mark, its delivery fee and live auctions, then Edit and View store.
 */
export function StoreCard({
  store,
  liveCount,
  onEdit,
}: {
  store: Store;
  /** Live auctions of this store's products; undefined while unknown. */
  liveCount?: number;
  onEdit: () => void;
}) {
  const { t } = useSellingTranslation();
  const { locale } = useLocale();
  const name = pickLocalizedName(store, locale);
  const cover = resolveThumbUrl(store.coverUrl);
  const isFree = parseMoney(store.deliveryFee) === 0;

  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-[18px]">
      <div className="flex items-center gap-3">
        {cover ? (
          <span className="relative size-[52px] shrink-0 overflow-hidden rounded-[18px] border border-border-strong">
            <Image src={cover} alt="" fill sizes="52px" className="object-cover" />
          </span>
        ) : (
          <InitialTile name={name} size={52} />
        )}
        <div className="grid min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-medium text-foreground">{name}</h2>
          <span className="truncate text-xs text-muted-foreground">
            {joinList([store.city, store.area], locale)}
          </span>
        </div>
        {store.isDefault ? (
          <Badge tone="gold" title={t('stores.defaultHint')}>
            {t('stores.default')}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={SPEC}>
          <Icon name="truck" size={16} className="text-gold" />
          {t('stores.delivery')}
          {isFree ? (
            <b className="font-medium text-foreground">{t('stores.free')}</b>
          ) : (
            <Price value={store.deliveryFee} size="xs" className="font-medium" />
          )}
        </span>
        {liveCount != null ? (
          <span className={cn(SPEC)}>
            <Icon name="gavel" size={16} className="text-gold" />
            {t('stores.liveAuctions', { count: liveCount })}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="soft" size="sm" onClick={onEdit}>
          <Icon name="pencil-simple" size={16} />
          {t('stores.edit')}
        </Button>
        <Link
          href={ROUTES.store(store.id)}
          className={buttonVariants({ variant: 'soft', size: 'sm' })}
        >
          {t('stores.view')}
        </Link>
      </div>
    </article>
  );
}
