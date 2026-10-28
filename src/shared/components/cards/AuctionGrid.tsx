import { cn } from '@shared/lib';
import { AuctionCardSkeleton } from '@shared/components/ui';
import { AuctionCard } from './AuctionCard';
import type { AuctionSummary } from '@shared/types';

const COLUMN_CLASSES = {
  /** two up on phones, four from 960px, five and six on wide screens (design `.grid`) */
  2: 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  /** beside a filter column or a side panel (design `.grid.g3`) */
  3: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
} as const;

export interface AuctionGridProps {
  auctions: AuctionSummary[];
  columns?: keyof typeof COLUMN_CLASSES;
  /** How many leading cards load their photos eagerly. */
  priorityCount?: number;
  className?: string;
}

export function AuctionGrid({
  auctions,
  columns = 2,
  priorityCount = 0,
  className,
}: AuctionGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-x-3.5 gap-y-[18px] lg:gap-x-[22px] lg:gap-y-7',
        COLUMN_CLASSES[columns],
        className,
      )}
    >
      {auctions.map((auction, index) => (
        <li key={auction.id}>
          <AuctionCard auction={auction} isPriority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

/** Matches AuctionGrid's footprint so the real cards don't shift in when the query resolves. */
export function AuctionGridSkeleton({
  count = 4,
  columns = 2,
}: {
  count?: number;
  columns?: keyof typeof COLUMN_CLASSES;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'grid gap-x-3.5 gap-y-[18px] lg:gap-x-[22px] lg:gap-y-7',
        COLUMN_CLASSES[columns],
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <AuctionCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * AuctionRail: the horizontally scrolling row of lot cards, without a header. Pages that want the
 * header with "See all" and desktop arrows use Rail instead.
 */
export function AuctionRail({ auctions }: { auctions: AuctionSummary[] }) {
  return (
    <ul className="no-scrollbar rail-fade -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3.5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      {auctions.map((auction) => (
        <li key={auction.id} className="w-44 shrink-0 snap-start lg:w-[210px]">
          <AuctionCard auction={auction} />
        </li>
      ))}
    </ul>
  );
}

export function AuctionRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 lg:mx-0 lg:px-0"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="w-44 shrink-0 lg:w-[210px]">
          <AuctionCardSkeleton />
        </div>
      ))}
    </div>
  );
}
