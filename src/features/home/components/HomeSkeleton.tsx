import { AuctionGridSkeleton, AuctionRailSkeleton } from '@shared/components/cards';
import { Skeleton } from '@shared/components/ui';
import { cn } from '@shared/lib';

/** A quiet bar inside a skeleton card, where the real text lands (design `.sk-lot`). */
function Bar({ className }: { className: string }) {
  return <i className={cn('block rounded-full bg-surface-high opacity-75', className)} />;
}

/** Stands in for the featured lot: its badge, name, price, timer and actions where they land. */
export function FeaturedLotSkeleton() {
  return (
    <div
      aria-hidden
      className="skeleton relative grid min-h-[330px] content-end gap-3 rounded-3xl border border-gold-line p-5 lg:min-h-[470px]"
    >
      <Bar className="absolute start-4 top-4 h-7 w-28" />
      <Bar className="h-5 w-4/5" />
      <Bar className="h-5 w-1/2" />
      <Bar className="mt-2 h-3 w-16" />
      <div className="flex items-center justify-between gap-3">
        <Bar className="h-8 w-1/2" />
        <Bar className="h-10 w-28 rounded-[12px]" />
      </div>
      <div className="flex gap-2.5">
        <Bar className="h-[52px] flex-1" />
        <Bar className="size-[52px]" />
      </div>
    </div>
  );
}

/** The rails and grid below the featured lot, drawn from the real cards (design `loading`). */
export function FeedSkeleton() {
  return (
    <div aria-hidden className="grid gap-[22px] lg:gap-10">
      <div className="grid gap-3.5">
        <Skeleton radius="full" className="h-5 w-44" />
        <AuctionRailSkeleton count={4} />
      </div>
      <div className="grid gap-3.5">
        <Skeleton radius="full" className="h-5 w-36" />
        <AuctionGridSkeleton count={4} />
      </div>
    </div>
  );
}

/** Before the home copy has loaded: the greeting, headline and search drawn as quiet bars. */
export function HeaderSkeleton() {
  return (
    <div aria-hidden className="grid gap-[22px] lg:hidden">
      <div className="grid gap-2.5">
        <Skeleton radius="full" className="h-3.5 w-32" />
        <Skeleton radius="full" className="h-8 w-3/4" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton radius="full" className="h-[52px] flex-1" />
        <span className="size-[52px] rounded-full bg-grad opacity-80" />
      </div>
    </div>
  );
}
