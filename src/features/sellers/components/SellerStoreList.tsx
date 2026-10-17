'use client';

import Link from 'next/link';
import { Icon, InitialTile } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName } from '@shared/lib';
import type { SellerProfile } from '../types/sellers.types';

export interface SellerStoreListProps {
  stores: SellerProfile['stores'];
}

/** The stores a seller runs (design `.seller` cards): initial tile, name, city, an open arrow. */
export function SellerStoreList({ stores }: SellerStoreListProps) {
  const { locale } = useLocale();

  return (
    <ul className="grid gap-3">
      {stores.map((store) => {
        const name = pickLocalizedName(store, locale);
        return (
          <li key={store.id}>
            <Link
              href={ROUTES.store(store.id)}
              className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-border bg-surface p-3.5 transition-[border-color] duration-fast ease-ios hover:border-border-strong"
            >
              <InitialTile name={name} size={52} />
              <span className="grid min-w-0 gap-[3px]">
                <b className="truncate font-medium text-foreground">{name}</b>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="map-pin" size={14} />
                  {store.city}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-full border border-gold-line text-gold"
              >
                <Icon name="arrow-up-left" size={17} className="ltr:-scale-x-100" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
