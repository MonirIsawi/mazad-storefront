import { auctionFormSchema } from '../schemas/selling.schema';
import type { AuctionFormValues } from '../types/selling.types';
import { fromDateTimeInputValue, toDateTimeInputValue } from './datetime-input';
import { MIN_BID_STEP, ladderStep } from './bid-ladder';
import { parseDinars } from './dinars';

export { parseDinars };

/** What the listing form holds: typed text, the start choice and datetime-local strings. */
export interface AuctionFormState {
  productId: string;
  startingPrice: string;
  /** "now": the auction starts when it is published; "later": at `startsAt`. */
  startMode: 'now' | 'later';
  /** datetime-local values ("2026-08-11T18:30", the browser's zone). */
  startsAt: string;
  endsAt: string;
  buyNowPrice: string;
  /** The seller's bid step in dinars; empty sends the suggested step for the opening price. */
  minIncrement: string;
  /** A bid in the last N minutes adds N minutes (1 to 10). */
  antiSnipingMinutes: string;
  /** How many times the auction may be extended (1 to 20). */
  maxExtensions: string;
}

export type AuctionField = keyof AuctionFormState;

export type AuctionPayloadResult =
  | { ok: true; payload: AuctionFormValues }
  | { ok: false; errors: Partial<Record<AuctionField, string>> };

/** mazad-api's listing rules (auction-rules.ts), checked here so the seller learns at once. */
export const MIN_STARTING_PRICE = 1_000;
const MINUTE_MS = 60_000;
const START_NOW_GRACE_MS = 5 * MINUTE_MS;
const MIN_DURATION_MS = 60 * MINUTE_MS;
const MAX_DURATION_MS = 14 * 24 * 60 * MINUTE_MS;
/** The seller's extension bounds (mazad-api SELLER_EXTENSION_MINUTES / SELLER_MAX_EXTENSIONS). */
export const EXTENSION_MINUTES = { min: 1, max: 10, default: 5 } as const;
export const MAX_EXTENSIONS = { min: 1, max: 20, default: 10 } as const;

/**
 * Rules (mazad-api's): the opening bid in whole dinars and at least 1,000 IQD; buy-now optional,
 * whole dinars and above the opening bid. The bid step is the seller's, whole dinars from 250 IQD
 * up to the opening price (empty: the suggested step); the extension is 1 to 10 minutes, 1 to 20
 * times.
 * "Start now" starts at publishing time; a scheduled start may not be in the past (a few minutes'
 * grace). The auction runs at least an hour and at most 14 days.
 */
export function buildAuctionPayload(
  state: AuctionFormState,
  now: Date = new Date(),
): AuctionPayloadResult {
  const errors: Partial<Record<AuctionField, string>> = {};

  const starting = parseDinars(state.startingPrice);
  if ('error' in starting) {
    errors.startingPrice =
      starting.error === 'errors.field.wholeDinars'
        ? starting.error
        : 'errors.field.startingPriceInvalid';
  } else if (starting.value < MIN_STARTING_PRICE) {
    errors.startingPrice = 'errors.field.startingPriceMin';
  }

  let buyNow: number | undefined;
  if (state.buyNowPrice.trim()) {
    const parsed = parseDinars(state.buyNowPrice);
    if ('error' in parsed) {
      errors.buyNowPrice =
        parsed.error === 'errors.field.wholeDinars' ? parsed.error : 'errors.field.buyNowInvalid';
    } else {
      buyNow = parsed.value;
      if (!('error' in starting) && parsed.value <= starting.value) {
        errors.buyNowPrice = 'errors.field.buyNowNotAboveStart';
      }
    }
  }

  const step = buildStep(state.minIncrement, 'error' in starting ? null : starting.value);
  if ('error' in step) errors.minIncrement = step.error;
  const minutes = wholeInRange(state.antiSnipingMinutes, EXTENSION_MINUTES);
  if (minutes === null) errors.antiSnipingMinutes = 'errors.field.extensionMinutesInvalid';
  const times = wholeInRange(state.maxExtensions, MAX_EXTENSIONS);
  if (times === null) errors.maxExtensions = 'errors.field.maxExtensionsInvalid';

  const startsAt =
    state.startMode === 'now' ? now.toISOString() : fromDateTimeInputValue(state.startsAt);
  const endsAt = fromDateTimeInputValue(state.endsAt);
  const parsed = auctionFormSchema.safeParse({
    productId: state.productId,
    startingPrice: 'error' in starting ? 0 : starting.value,
    startsAt,
    endsAt,
    buyNowPrice: buyNow ?? '',
    minIncrement: 'value' in step ? step.value : 0,
    antiSnipingMinutes: minutes ?? EXTENSION_MINUTES.default,
    maxExtensions: times ?? MAX_EXTENSIONS.default,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as AuctionField | undefined;
      if (field && !errors[field]) errors[field] = issue.message;
    }
  }

  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (Number.isFinite(start) && Number.isFinite(end) && !errors.endsAt) {
    if (state.startMode === 'later' && start < now.getTime() - START_NOW_GRACE_MS) {
      errors.startsAt = 'errors.field.startInPast';
    }
    const from = Math.max(start, now.getTime());
    if (end - from < MIN_DURATION_MS) errors.endsAt = 'errors.field.durationTooShort';
    else if (end - from > MAX_DURATION_MS) errors.endsAt = 'errors.field.durationTooLong';
  }

  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, errors };
  return { ok: true, payload: parsed.data };
}

/** The typed step, or the suggested one when left empty; bounded like the API's INVALID_BID_STEP. */
function buildStep(text: string, opening: number | null): { value: number } | { error: string } {
  if (!text.trim()) {
    return opening === null ? { value: 0 } : { value: ladderStep(opening) };
  }
  const parsed = parseDinars(text);
  if ('error' in parsed) {
    return {
      error:
        parsed.error === 'errors.field.wholeDinars'
          ? parsed.error
          : 'errors.field.minIncrementInvalid',
    };
  }
  const maximum = Math.max(opening ?? Number.POSITIVE_INFINITY, MIN_BID_STEP);
  if (parsed.value < MIN_BID_STEP || parsed.value > maximum) {
    return { error: 'errors.field.minIncrementInvalid' };
  }
  return parsed;
}

/** A typed whole number within the bounds, else null. */
function wholeInRange(text: string, bounds: { min: number; max: number }): number | null {
  const parsed = parseDinars(text);
  if ('error' in parsed) return null;
  return parsed.value >= bounds.min && parsed.value <= bounds.max ? parsed.value : null;
}

/**
 * The end for a duration preset, as a datetime-local value: counted from publishing for "start
 * now", else from the chosen start.
 */
export function endAfterDays(
  state: Pick<AuctionFormState, 'startMode' | 'startsAt'>,
  days: number,
  now: Date = new Date(),
): string {
  const start = state.startMode === 'now' ? now.getTime() : Date.parse(state.startsAt);
  const from = Number.isFinite(start) ? start : now.getTime();
  return toDateTimeInputValue(new Date(from + days * 24 * 60 * MINUTE_MS).toISOString());
}
