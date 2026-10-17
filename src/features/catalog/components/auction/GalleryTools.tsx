'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { IconButton } from '@shared/components/ui';
import { useToast } from '@shared/hooks';
import { shareLink } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';

/** Back, share and the heart over the photo (design `.tools`), on dark glass in both themes. */
export function GalleryTools({ watchlistToggle }: { watchlistToggle?: ReactNode }) {
  const { t } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const toast = useToast();

  const handleBack = () => {
    // Opened from a link with nothing to go back to: land on Browse rather than leave the site.
    if (window.history.length > 1) window.history.back();
    else router.push(ROUTES.auctions);
  };
  const handleShare = async () => {
    const outcome = await shareLink(window.location.href);
    if (outcome === 'copied') toast.success(t('detail.linkCopied'));
    if (outcome === 'unavailable') toast.error(t('detail.shareUnavailable'));
  };

  return (
    <>
      <IconButton
        name="caret-right"
        tone="glass"
        className="ltr:[&>svg]:-scale-x-100"
        label={tCommon('nav.back')}
        onClick={handleBack}
      />
      <div className="flex items-center gap-2">
        <IconButton
          name="share"
          tone="glass"
          label={t('detail.share')}
          onClick={() => void handleShare()}
        />
        {watchlistToggle}
      </div>
    </>
  );
}
