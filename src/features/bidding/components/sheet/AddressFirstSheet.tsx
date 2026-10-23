'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Icon, Sheet, StateBanner, buttonVariants } from '@shared/components/ui';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';

/** "Add an address first": a win becomes an order at once, so bidding needs a saved address. */
export function AddressFirstNotice() {
  const { t } = useBiddingTranslation();
  return (
    <div className="grid gap-3" data-testid="bid-address-first">
      <StateBanner tone="info" icon="pin">
        {t('addressFirst.body')}
      </StateBanner>
      <Link
        href={ROUTES.addressesList}
        className={buttonVariants({ isFullWidth: true })}
        data-testid="bid-address-first-add"
      >
        <Icon name="plus" size={20} />
        {t('addressFirst.add')}
      </Link>
    </div>
  );
}

/** The prompt that opens instead of the bid, auto-bid or buy-now sheet while there's no address. */
export function AddressFirstSheet({ onClose }: { onClose: () => void }) {
  const { t } = useBiddingTranslation();
  return (
    <Sheet isOpen onClose={onClose} title={t('addressFirst.title')}>
      <AddressFirstNotice />
    </Sheet>
  );
}
