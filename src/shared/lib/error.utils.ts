import { isAxiosError } from 'axios';
import type { ApiError } from '@shared/types';

/** The stable identifier to branch on — never `message`, which is free text (see AGENTS.md). */
export function getErrorCode(error: unknown): string | null {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.errorCode ?? null;
  }
  return null;
}

/** One string value of the error's `details` (e.g. INVALID_AUCTION_DATES' `reason`). */
export function getErrorDetail(error: unknown, key: string): string | null {
  if (!isAxiosError<ApiError & { details?: Record<string, unknown> }>(error)) return null;
  const value = error.response?.data?.details?.[key];
  return typeof value === 'string' ? value : null;
}

/** HTTP status of a failed request, for the few errors the API sends without an errorCode. */
export function getErrorStatus(error: unknown): number | null {
  if (isAxiosError(error)) {
    return error.response?.status ?? null;
  }
  return null;
}
