'use client';

import { Badge, type BadgeTone, type IconName } from '@shared/components/ui';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { SellerAuctionStatus } from '../../types/selling.types';

const LOOK: Record<SellerAuctionStatus, { tone: BadgeTone; icon?: IconName }> = {
  DRAFT: { tone: 'done', icon: 'pencil-simple' },
  PENDING_APPROVAL: { tone: 'upcoming', icon: 'hourglass-medium' },
  REJECTED: { tone: 'bad', icon: 'x' },
  SCHEDULED: { tone: 'upcoming', icon: 'calendar-blank' },
  LIVE: { tone: 'live' },
  ENDED: { tone: 'done' },
  SOLD: { tone: 'gold', icon: 'check' },
  UNSOLD: { tone: 'done' },
  CANCELLED: { tone: 'bad' },
};

/** A seller auction's status pill (design `statusBadge`): live pulses, sold is gold. */
export function SellerAuctionBadge({ status }: { status: SellerAuctionStatus }) {
  const { t } = useSellingTranslation();
  const look = LOOK[status];
  return (
    <Badge tone={look.tone} icon={look.icon} hasDot={status === 'LIVE'}>
      {t(`status.${status}`)}
    </Badge>
  );
}
