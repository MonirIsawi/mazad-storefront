import { getErrorCode, getErrorStatus } from '@shared/lib';

/**
 * The common-namespace error key to show for a failed auth request.
 *
 * mazad-api's per-IP throttler answers 429 without an errorCode of its own ("REQUEST_FAILED"),
 * so that case is told apart by status. Anything without a code still gets the generic message
 * rather than no message at all.
 */
export function resolveAuthErrorCode(error: unknown): string | null {
  if (!error) return null;
  const code = getErrorCode(error);
  if (getErrorStatus(error) === 429 && (!code || code === 'REQUEST_FAILED')) {
    return 'TOO_MANY_REQUESTS';
  }
  return code ?? 'generic';
}
