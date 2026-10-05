/**
 * A fresh Idempotency-Key for one user intent (one bid, one purchase). Reusing the key when the
 * same intent is retried — e.g. after a timeout where the server did commit — makes mazad-api
 * answer with the original result instead of acting twice.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
