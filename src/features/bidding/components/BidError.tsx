'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { Icon } from '@shared/components/ui';
import { getErrorCode } from '@shared/lib';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';

/**
 * Why a bid, an auto-bid or a purchase was refused, by the API's error code (never its message).
 * A missing address links straight to the addresses page.
 */
export function BidError({ error }: { error: unknown }) {
  const { t } = useBiddingTranslation();
  const { t: tCommon } = useTranslation('common');
  const errorCode = getErrorCode(error);
  if (!error) return null;

  return (
    <p role="alert" className="flex items-start gap-2 text-[13px] text-destructive">
      <Icon name="x-circle" size={16} className="mt-0.5 shrink-0" />
      <span>
        {errorCode === 'ADDRESS_REQUIRED' ? (
          <>
            {t('errors.ADDRESS_REQUIRED')}{' '}
            <Link href={ROUTES.addressesList} className="font-semibold underline">
              {t('errors.addAddressLink')}
            </Link>
          </>
        ) : (
          t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })
        )}
      </span>
    </p>
  );
}
