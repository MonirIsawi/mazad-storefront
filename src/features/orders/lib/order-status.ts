import type { BadgeTone, IconName } from '@shared/components/ui';
import type { Order, OrderStatus } from '../types/orders.types';

/** Each order status's pill (design `statusBadge`): tone and glyph. */
export const ORDER_STATUS_BADGE: Record<OrderStatus, { tone: BadgeTone; icon?: IconName }> = {
  CREATED: { tone: 'upcoming', icon: 'hourglass' },
  CONFIRMED: { tone: 'gold', icon: 'check' },
  OUT_FOR_DELIVERY: { tone: 'ending', icon: 'truck' },
  DELIVERED: { tone: 'live', icon: 'check-circle' },
  CANCELLED: { tone: 'bad' },
};

/** Still on its way to the buyer (the "Open" filter, the account counter). */
export function isOpenOrder(order: Pick<Order, 'status'>): boolean {
  return (
    order.status === 'CREATED' ||
    order.status === 'CONFIRMED' ||
    order.status === 'OUT_FOR_DELIVERY'
  );
}

export type TimelineStepKey = 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface TimelineStep {
  key: TimelineStepKey;
  icon: IconName;
  at: string | null;
  state: 'done' | 'current' | 'todo';
}

/**
 * Where the order is, from its own timestamps: created → confirmed → out for delivery →
 * delivered. A cancelled order stops at the step it reached and ends with the cancellation.
 */
export function orderTimeline(order: Order): TimelineStep[] {
  const steps: Omit<TimelineStep, 'state'>[] = [
    { key: 'created', icon: 'trophy', at: order.createdAt },
    { key: 'confirmed', icon: 'check', at: order.confirmedAt },
    { key: 'shipped', icon: 'truck', at: order.shippedAt },
    { key: 'delivered', icon: 'package', at: order.deliveredAt },
  ];
  if (order.status === 'CANCELLED') {
    const reached = steps.filter((step) => step.at);
    return [
      ...reached.map((step) => ({ ...step, state: 'done' as const })),
      { key: 'cancelled', icon: 'x', at: order.cancelledAt, state: 'done' },
    ];
  }
  const firstOpen = steps.findIndex((step) => !step.at);
  return steps.map((step, index) => ({
    ...step,
    state: step.at ? 'done' : index === firstOpen ? 'current' : 'todo',
  }));
}
