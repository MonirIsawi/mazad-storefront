/**
 * mazad-api's bid step ladder (auction-rules.ts `ladderIncrement`), mirrored only to show a seller
 * the step their opening price will get. The API sets the step; nobody chooses it, and the
 * auction page shows the API's own `bidIncrement`.
 */
const LADDER: ReadonlyArray<readonly [upTo: number, step: number]> = [
  [100_000, 1_000],
  [1_000_000, 5_000],
  [10_000_000, 25_000],
];
const TOP_STEP = 100_000;

export function ladderStep(price: number): number {
  for (const [upTo, step] of LADDER) {
    if (price < upTo) return step;
  }
  return TOP_STEP;
}
