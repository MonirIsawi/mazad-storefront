import { auctionFormSchema } from '../schemas/selling.schema';
import type { AuctionFormValues } from '../types/selling.types';
import { fromDateTimeInputValue, toDateTimeInputValue } from './datetime-input';

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

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

/** A typed amount (grouping commas, Arabic digits allowed) as whole dinars, or an error key. */
export function parseDinars(text: string): { value: number } | { error: string } {
  const normalized = text
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC.indexOf(digit)))
    .replace(/[,٬\s]/g, '');
  if (!normalized) return { error: 'empty' };
  if (/^\d+[.٫]\d*[1-9]\d*$/.test(normalized)) return { error: 'errors.field.wholeDinars' };
  const whole = normalized.replace(/[.٫]0*$/, '');
  if (!/^\d+$/.test(whole)) return { error: 'invalid' };
  const value = Number(whole);
  return Number.isSafeInteger(value) ? { value } : { error: 'invalid' };
}

/**
 * Rules (mazad-api's): the opening bid in whole dinars and at least 1,000 IQD; buy-now optional,
 * whole dinars and above the opening bid. The raise per bid is the server's ladder, not asked.
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

  const startsAt =
    state.startMode === 'now' ? now.toISOString() : fromDateTimeInputValue(state.startsAt);
  const endsAt = fromDateTimeInputValue(state.endsAt);
  const parsed = auctionFormSchema.safeParse({
    productId: state.productId,
    startingPrice: 'error' in starting ? 0 : starting.value,
    startsAt,
    endsAt,
    buyNowPrice: buyNow ?? '',
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
