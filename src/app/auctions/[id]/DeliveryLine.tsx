'use client';

import { useAddresses } from '@features/addresses';
import { DeliveryLineView } from '@features/bidding';
import { useLocale } from '@shared/hooks';

/**
 * The bid sheet's delivery line: the default address from the addresses feature, drawn by the
 * bidding feature. Rendered only inside the sheet, which only a signed-in buyer opens.
 */
export function DeliveryLine() {
  const addresses = useAddresses();
  const { locale } = useLocale();
  if (!addresses.data) return null;
  const address = addresses.data.find((item) => item.isDefault) ?? addresses.data[0];
  const place = address
    ? [address.area, address.city].filter(Boolean).join(locale === 'ar' ? '، ' : ', ')
    : null;
  return <DeliveryLineView place={place} />;
}
