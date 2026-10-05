/**
 * The one server-clock offset for the whole app (server time − device time). Every countdown reads
 * through it so a device clock that is minutes off can't show an auction open after it closed
 * (ADR-013).
 *
 * Samples come from the X-Server-Time header mazad-api puts on every response, so the first API
 * call of any page — including a deep link to an auction — anchors the clock. Each sample is
 * corrected by half its round trip; the lowest-latency sample wins, and is replaced after
 * SAMPLE_MAX_AGE_MS so slow drift is followed.
 */
export const SAMPLE_MAX_AGE_MS = 5 * 60_000;

let offsetMs = 0;
let bestRttMs = Number.POSITIVE_INFINITY;
let bestSampleAt = Number.NEGATIVE_INFINITY;
const listeners = new Set<() => void>();

function publish(next: number) {
  if (Math.abs(next - offsetMs) < 1) return;
  offsetMs = next;
  listeners.forEach((listener) => listener());
}

export function getServerClockOffset(): number {
  return offsetMs;
}

export function subscribeServerClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Device time now, corrected to the server's clock. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

/**
 * One measured sample: `serverMs` was stamped by the API while the request travelled between
 * `sentAt` and `receivedAt` (device clock). A slower sample than the current best is ignored
 * unless the best has gone stale.
 */
export function recordServerTimeSample(serverMs: number, sentAt: number, receivedAt: number): void {
  if (!Number.isFinite(serverMs) || !Number.isFinite(sentAt) || receivedAt < sentAt) return;
  const rtt = receivedAt - sentAt;
  const isStale = receivedAt - bestSampleAt > SAMPLE_MAX_AGE_MS;
  if (!isStale && rtt > bestRttMs) return;
  bestRttMs = rtt;
  bestSampleAt = receivedAt;
  publish(serverMs + rtt / 2 - receivedAt);
}

/**
 * A server timestamp without timing information (GET /homepage's `serverTime`). Used only while no
 * fresher measured sample exists, since its latency is unknown.
 */
export function recordServerTime(serverTimeIso: string): void {
  const serverMs = new Date(serverTimeIso).getTime();
  if (!Number.isFinite(serverMs)) return;
  if (Date.now() - bestSampleAt <= SAMPLE_MAX_AGE_MS) return;
  publish(serverMs - Date.now());
}

/** Test helper: forget every sample. */
export function resetServerClock(): void {
  offsetMs = 0;
  bestRttMs = Number.POSITIVE_INFINITY;
  bestSampleAt = Number.NEGATIVE_INFINITY;
  listeners.forEach((listener) => listener());
}
