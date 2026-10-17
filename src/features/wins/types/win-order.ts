/**
 * What My wins shows of the order a win created. Structurally satisfied by the orders feature's
 * `OrderSummary`, which the route passes in, so wins never imports orders (AGENTS.md rule 1).
 */
export interface WinOrderSummary {
  orderNumber: string;
  status: string;
  imageByWin: Record<string, string | null>;
}

/** Structurally satisfied by the addresses feature's `Address` (passed in by the route). */
export interface WinAddressOption {
  id: string;
  label: string;
  city: string;
  isDefault: boolean;
}
