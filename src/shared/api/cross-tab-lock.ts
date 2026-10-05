/**
 * Serializes token refreshes across every tab of this origin with the Web Locks API.
 *
 * - The browser releases a lock when its holder finishes, throws, or the tab closes or crashes, so
 *   a dead tab can never leave a permanent lock behind.
 * - Waiting is bounded: after LOCK_WAIT_MS the caller proceeds without the lock (the callback
 *   re-checks storage first, so it still adopts another tab's newer session when there is one).
 * - Browsers without Web Locks run the callback directly: the in-tab single-flight still applies.
 */
export const REFRESH_LOCK_NAME = 'mazad:auth-refresh';
export const LOCK_WAIT_MS = 15_000;

type LockManagerLike = {
  request<T>(
    name: string,
    options: { signal?: AbortSignal },
    callback: () => Promise<T>,
  ): Promise<T>;
};

function lockManager(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const locks = (navigator as Navigator & { locks?: LockManagerLike }).locks;
  return typeof locks?.request === 'function' ? locks : undefined;
}

export async function withCrossTabLock<T>(
  callback: () => Promise<T>,
  { name = REFRESH_LOCK_NAME, waitMs = LOCK_WAIT_MS }: { name?: string; waitMs?: number } = {},
): Promise<T> {
  const locks = lockManager();
  if (!locks) return callback();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), waitMs);
  try {
    return await locks.request(name, { signal: controller.signal }, () => {
      clearTimeout(timer);
      return callback();
    });
  } catch (error) {
    // Only the wait was aborted: run without the lock rather than fail the user's request.
    if (controller.signal.aborted && (error as DOMException)?.name === 'AbortError') {
      return callback();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
