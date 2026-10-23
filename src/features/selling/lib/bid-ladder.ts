/**
 * mazad-api's suggested bid step (auction-rules.ts `ladderIncrement`): the step a new listing gets
 * when the seller leaves it out, and the one the form pre-fills. The seller may set any whole
 * step from `MIN_BID_STEP` up to the opening price; the auction page shows the API's own
 * `bidIncrement`.
 */
const LADDER: ReadonlyArray<readonly [upTo: number, step: number]> = [
  [100_000, 1_000],
  [1_000_000, 5_000],
  [10_000_000, 25_000],
];
const TOP_STEP = 100_000;

/** The smallest step a seller may set (the smallest note), as mazad-api enforces. */
export const MIN_BID_STEP = 250;

export function ladderStep(price: number): number {
  for (const [upTo, step] of LADDER) {
    if (price < upTo) return step;
  }
  return TOP_STEP;
}

/**
 * Steps offered as chips beside the step input: around the suggested one (a fifth of it, it, twice
 * and five times it), kept within what the API accepts for this opening price.
 * A 400,000 opening gives 1,000 / 5,000 / 10,000 / 25,000.
 */
export function stepSuggestions(opening: number): number[] {
  const step = ladderStep(opening);
  const candidates = [Math.round(step / 5), step, step * 2, step * 5];
  return [...new Set(candidates)].filter((value) => value >= MIN_BID_STEP && value <= opening);
}
