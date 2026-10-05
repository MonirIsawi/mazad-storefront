import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

vi.mock('./redirect-to-login', () => ({ redirectToLogin: vi.fn() }));

const OLD = { accessToken: 'access-old', refreshToken: 'refresh-old' };
const NEW = { accessToken: 'access-new', refreshToken: 'refresh-new' };

/**
 * A Web Locks stand-in: one holder at a time, FIFO, released when the callback settles — the
 * property the browser guarantees across tabs.
 */
function installFakeLocks() {
  let tail: Promise<unknown> = Promise.resolve();
  const requests: string[] = [];
  const locks = {
    request<T>(name: string, _options: unknown, callback: () => Promise<T>): Promise<T> {
      requests.push(name);
      const run = tail.then(() => callback());
      tail = run.catch(() => undefined);
      return run;
    },
  };
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });
  return { requests };
}

/**
 * One mazad-api: access tokens are valid until rotated, and a refresh token works exactly once
 * (a second use is REFRESH_TOKEN_REUSE, which revokes the session).
 */
function fakeApi() {
  const validAccess = new Set([OLD.accessToken]);
  const usedRefresh = new Set<string>();
  const refreshCalls: string[] = [];

  async function refresh(refreshToken: string) {
    refreshCalls.push(refreshToken);
    await new Promise((resolve) => setTimeout(resolve, 5)); // network time: let tabs overlap
    if (usedRefresh.has(refreshToken) || refreshToken !== OLD.refreshToken) {
      throw Object.assign(new Error('REFRESH_TOKEN_REUSE'), { response: { status: 401 } });
    }
    usedRefresh.add(refreshToken);
    validAccess.delete(OLD.accessToken);
    validAccess.add(NEW.accessToken);
    return { data: NEW };
  }

  function adapter(config: InternalAxiosRequestConfig) {
    const token = String(config.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const response = (status: number) =>
      ({
        status,
        statusText: '',
        headers: {},
        config,
        data: { ok: status === 200 },
      }) as AxiosResponse;
    if (validAccess.has(token)) return Promise.resolve(response(200));
    return import('axios').then(({ AxiosError }) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response(401));
    });
  }

  return {
    refresh,
    adapter,
    refreshCalls,
    expireOldAccess: () => validAccess.delete(OLD.accessToken),
  };
}

/** A fresh copy of the client modules = one browser tab sharing this window's localStorage. */
async function openTab(api: ReturnType<typeof fakeApi>) {
  vi.resetModules();
  const axios = (await import('axios')).default;
  vi.spyOn(axios, 'post').mockImplementation(
    (_url, body) => api.refresh((body as { refreshToken: string }).refreshToken) as never,
  );
  const { httpClient } = await import('./http-client');
  const session = await import('./auth-session');
  httpClient.defaults.adapter = api.adapter;
  return { httpClient, session };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('mazad.accessToken', OLD.accessToken);
  localStorage.setItem('mazad.refreshToken', OLD.refreshToken);
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'locks');
});

describe('cross-tab refresh', () => {
  it('two tabs hitting 401 together rotate the refresh token exactly once', async () => {
    const { requests } = installFakeLocks();
    const api = fakeApi();
    const tabA = await openTab(api);
    const tabB = await openTab(api);
    api.expireOldAccess();

    const [a, b] = await Promise.all([tabA.httpClient.get('/me'), tabB.httpClient.get('/me/bids')]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(api.refreshCalls).toEqual([OLD.refreshToken]);
    expect(requests).toEqual(['mazad:auth-refresh', 'mazad:auth-refresh']);
    expect(tabA.session.getSessionTokens()).toEqual(NEW);
    expect(tabB.session.getSessionTokens()).toEqual(NEW);
  });

  it('adopts a session another tab already rotated, without a network call', async () => {
    installFakeLocks();
    const api = fakeApi();
    const tab = await openTab(api);
    // Another tab rotated the session; this tab's storage event has not been processed yet.
    await api.refresh(OLD.refreshToken);
    api.refreshCalls.length = 0;
    localStorage.setItem('mazad.accessToken', NEW.accessToken);
    localStorage.setItem('mazad.refreshToken', NEW.refreshToken);

    const res = await tab.httpClient.get('/me');

    expect(res.status).toBe(200);
    expect(api.refreshCalls).toEqual([]);
    expect(tab.session.getSessionTokens()).toEqual(NEW);
  });

  it('signs out instead of refreshing when another tab already signed out', async () => {
    installFakeLocks();
    const api = fakeApi();
    const tab = await openTab(api);
    const { redirectToLogin } = await import('./redirect-to-login');
    api.expireOldAccess();
    localStorage.clear(); // logout in another tab

    await expect(tab.httpClient.get('/me')).rejects.toBeTruthy();
    expect(api.refreshCalls).toEqual([]);
    expect(tab.session.getSessionTokens()).toBeNull();
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('without Web Locks, the in-tab single flight still holds', async () => {
    const api = fakeApi();
    const tab = await openTab(api);
    api.expireOldAccess();

    const responses = await Promise.all([
      tab.httpClient.get('/me'),
      tab.httpClient.get('/notifications'),
    ]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(api.refreshCalls).toEqual([OLD.refreshToken]);
  });
});

describe('storage sync between tabs', () => {
  it('picks up tokens rotated in another tab and notifies subscribers', async () => {
    const api = fakeApi();
    const tab = await openTab(api);
    const seen: unknown[] = [];
    tab.session.subscribeToSessionTokens((tokens) => seen.push(tokens));

    localStorage.setItem('mazad.accessToken', NEW.accessToken);
    localStorage.setItem('mazad.refreshToken', NEW.refreshToken);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mazad.refreshToken' }));

    expect(tab.session.getSessionTokens()).toEqual(NEW);
    expect(seen).toEqual([NEW]);
  });

  it('propagates a sign-out from another tab', async () => {
    const api = fakeApi();
    const tab = await openTab(api);

    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));

    expect(tab.session.getSessionTokens()).toBeNull();
  });
});

describe('withCrossTabLock', () => {
  it('stops waiting for a lock that is never granted and proceeds', async () => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: (_name: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          ),
      },
    });
    const { withCrossTabLock } = await import('./cross-tab-lock');

    await expect(withCrossTabLock(async () => 'ran', { waitMs: 20 })).resolves.toBe('ran');
  });
});
