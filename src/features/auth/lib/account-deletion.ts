import { isAxiosError } from 'axios';
import { ROUTES } from '@shared/constants';
import { getErrorCode, getErrorStatus } from '@shared/lib';
import type { ApiError } from '@shared/types';

/**
 * What a failed DELETE /me means for the screen. Branches on errorCode/status only, never on
 * the message (AGENTS.md).
 */
export type DeletionFailure =
  | { type: 'password'; code: 'PASSWORD_REQUIRED' | 'INVALID_CURRENT_PASSWORD' }
  | { type: 'reauth' }
  | { type: 'blocked'; reasons: string[] }
  | { type: 'signedOut' }
  | { type: 'message'; namespace: 'auth' | 'common'; key: string };

/**
 * Where each ACCOUNT_DELETION_BLOCKED reason can be resolved in this storefront. Reasons without a
 * screen here (seller orders, return windows, wallet) are listed without a link.
 */
export const DELETION_BLOCKER_LINKS: Record<string, { href: string; labelKey: string }> = {
  SELLER_AUCTIONS_ACTIVE: { href: ROUTES.sellingAuctions, labelKey: 'deleteAccount.links.selling' },
  BUYER_ORDERS_OPEN: { href: ROUTES.orders, labelKey: 'account.orders' },
  RETURNS_OPEN: { href: ROUTES.orders, labelKey: 'account.orders' },
  WINS_PENDING: { href: ROUTES.wins, labelKey: 'account.wins' },
  LEADING_BIDS: { href: ROUTES.myBids, labelKey: 'account.myBids' },
};

function blockerReasons(error: unknown): string[] {
  if (!isAxiosError<ApiError>(error)) return [];
  const reasons = error.response?.data?.details?.reasons;
  return Array.isArray(reasons)
    ? reasons.filter((reason): reason is string => typeof reason === 'string')
    : [];
}

export function resolveDeletionFailure(error: unknown): DeletionFailure {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);

  switch (code) {
    case 'PASSWORD_REQUIRED':
    case 'INVALID_CURRENT_PASSWORD':
      return { type: 'password', code };
    case 'REAUTH_REQUIRED':
      return { type: 'reauth' };
    case 'ACCOUNT_DELETION_BLOCKED':
      return { type: 'blocked', reasons: blockerReasons(error) };
    case 'ACCOUNT_DELETION_NOT_ALLOWED':
      return { type: 'message', namespace: 'auth', key: `deleteAccount.errors.${code}` };
  }
  if (status === 401) return { type: 'signedOut' };
  // The throttler answers 429 without a code of its own (see resolveAuthErrorCode).
  const key = status === 429 ? 'errors.TOO_MANY_REQUESTS' : 'errors.generic';
  return { type: 'message', namespace: 'common', key };
}
