import { isAxiosError } from 'axios';
import type { ApiError } from '@shared/types';

/** The stable identifier to branch on — never `message`, which is free text (see AGENTS.md). */
export function getErrorCode(error: unknown): string | null {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.errorCode ?? null;
  }
  return null;
}

/** HTTP status of a failed request, for the few errors the API sends without an errorCode. */
export function getErrorStatus(error: unknown): number | null {
  if (isAxiosError(error)) {
    return error.response?.status ?? null;
  }
  return null;
}
