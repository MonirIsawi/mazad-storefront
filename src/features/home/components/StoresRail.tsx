'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Rail } from '@shared/components/cards';
import { Icon, InitialTile } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { pickLocalizedName } from '@shared/lib';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { useVerifiedStores } from '../hooks/useVerifiedStores';
import type { PublicStore } from '../types/home.types';

/**
 * "Verified stores" (design `.storecard` rail), from GET /stores. Drawn only when the API has
 * that route and returns verified stores: until then there is no rail, never a placeholder.
 */
export function StoresRail() {
  const { t } = useHomeTranslation();
  const stores = useVerifiedStores();
  if (stores.length === 0) return null;

  return (
    <Rail title={t('sections.stores')} icon="shield" itemClassName="w-[250px] lg:w-[250px]">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </Rail>
  );
}

function StoreCard({ store }: { store: PublicStore }) {
  const { t } = useHomeTranslation();
  const { locale } = useLocale();
  const name = pickLocalizedName(store, locale);

  return (
    <Link
      href={ROUTES.store(store.id)}
      className="grid overflow-hidden rounded-[26px] border border-border bg-surface text-start"
    >
      <span className="relative block h-[110px] bg-tile">
        {store.coverUrl ? (
          <Image src={store.coverUrl} alt="" fill sizes="250px" className="object-cover" />
        ) : null}
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(transparent,var(--color-surface))]"
        />
      </span>
      <span className="relative -mt-[22px] flex items-center gap-3 px-3.5 pb-3.5">
        <InitialTile name={name} size={46} />
        <span className="grid min-w-0 gap-0.5">
          <b className="inline-flex items-center gap-1.5 truncate text-[14.5px] font-medium text-foreground">
            {name}
            <Icon name="seal-check" isFilled size={15} className="shrink-0 text-gold" />
          </b>
          <span className="truncate text-xs text-muted-foreground">
            {store.city} · {t('stores.live', { count: store.liveCount })}
          </span>
        </span>
      </span>
    </Link>
  );
}
