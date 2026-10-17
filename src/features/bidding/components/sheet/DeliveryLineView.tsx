'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Icon } from '@shared/components/ui';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';

/**
 * "Delivers to: Mansour, Baghdad · Change" in the bid sheet (a win becomes an order at the default
 * address). The route reads the address from the addresses feature and passes the place in;
 * without one it says an address is needed before bidding.
 */
export function DeliveryLineView({ place }: { place: string | null }) {
  const { t } = useBiddingTranslation();
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-foreground-soft">
      <Icon name="pin" size={15} className="shrink-0" />
      {place ? t('sheet.deliversTo', { place }) : t('sheet.noAddress')}
      <span aria-hidden>·</span>
      <Link
        href={ROUTES.addressesList}
        className="font-medium text-gold underline-offset-4 hover:underline"
      >
        {place ? t('sheet.changeAddress') : t('sheet.addAddress')}
      </Link>
    </p>
  );
}
