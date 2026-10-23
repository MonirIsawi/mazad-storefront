'use client';

import type { ReactNode } from 'react';
import { Button, Card, CardTitle, KeyValueList, Price, StateBanner } from '@shared/components/ui';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';

export interface ExtensionRule {
  minutes: number;
  times: number;
}

export interface AuctionSummaryCardProps {
  opening: string | null;
  step: string | null;
  /** The seller's extension as typed; null while either number is missing. */
  rule: ExtensionRule | null;
  duration: string | null;
  isBusy: boolean;
  canPublish: boolean;
  isEdit: boolean;
  error?: ReactNode;
  onSaveDraft: () => void;
  onCancel: () => void;
}

/**
 * The listing at a glance beside the form (design `create-auction` summary): opening, the seller's
 * step and extension, the duration, then Publish. Sticky on desktop.
 */
export function AuctionSummaryCard({
  opening,
  step,
  rule,
  duration,
  isBusy,
  canPublish,
  isEdit,
  error,
  onSaveDraft,
  onCancel,
}: AuctionSummaryCardProps) {
  const { t } = useSellingTranslation();
  const dash = <span className="text-muted-foreground">—</span>;
  return (
    <Card tone="framed" className="grid gap-3.5 pb-[18px] lg:sticky lg:top-24">
      <CardTitle>{t('summary.title')}</CardTitle>
      <div className="grid gap-3.5 px-[18px]">
        <KeyValueList
          rows={[
            {
              key: 'opening',
              label: t('summary.opening'),
              value: opening ? <Price value={opening} size="sm" /> : dash,
            },
            {
              key: 'step',
              label: t('summary.step'),
              value: step ? <Price value={step} size="sm" /> : dash,
            },
            {
              key: 'extension',
              label: t('summary.extension'),
              value: rule ? t('summary.extensionValue', { ...rule }) : dash,
            },
            { key: 'duration', label: t('summary.duration'), value: duration ?? dash },
          ]}
        />
        <StateBanner tone="info" icon="eye" className="px-3.5 py-3 text-[13px]">
          {t('summary.bidderNote')}
        </StateBanner>
        {error}
        <Button
          type="submit"
          isFullWidth
          isLoading={isBusy}
          disabled={!canPublish}
          data-testid="auction-publish"
        >
          {t('form.publish')}
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={isBusy}
            onClick={onSaveDraft}
            data-testid="auction-save-draft"
          >
            {t(isEdit ? 'form.save' : 'form.saveDraft')}
          </Button>
          <Button type="button" variant="plain" size="sm" onClick={onCancel}>
            {t('form.cancel')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
