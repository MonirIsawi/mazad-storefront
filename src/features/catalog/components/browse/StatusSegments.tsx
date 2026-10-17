'use client';

import { SegmentedControl } from '@shared/components/ios';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { STATUS_VALUES } from '../../lib/browse-filters';
import type { AuctionStatusFilter } from '../../types/catalog.types';

type Segment = AuctionStatusFilter | 'all';

/** Phones: the auction status as one exclusive choice (design `.seg`). */
export function StatusSegments({
  value,
  onChange,
}: {
  value: AuctionStatusFilter | undefined;
  onChange: (status: AuctionStatusFilter | undefined) => void;
}) {
  const { t } = useCatalogTranslation();
  const segments: { id: Segment; label: string }[] = [
    { id: 'all', label: t('browse.filters.all') },
    ...STATUS_VALUES.map((status) => ({ id: status, label: t(`browse.filters.${status}`) })),
  ];
  return (
    <SegmentedControl
      label={t('filters.status')}
      value={value ?? 'all'}
      onChange={(id) => onChange(id === 'all' ? undefined : id)}
      segments={segments}
      className="lg:hidden"
    />
  );
}
