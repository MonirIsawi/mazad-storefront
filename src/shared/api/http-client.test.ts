import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getSessionTokens, setSessionTokens, subscribeToSessionTokens } from './auth-session';
import { httpClient } from './http-client';
import { redirectToLogin } from './redirect-to-login';

vi.mock('./redirect-to-login', () => ({ redirectToLogin: vi.fn() }));

const OLD = { accessToken: 'access-old', refreshToken: 'refresh-old' };
const NEW = { accessToken: 'access-new', refreshToken: 'refresh-new' };

/** A fake network: 401 for any token but the accepted one, 200 otherwise. */
function fakeServer(acceptedToken: string | null) {
  const calls: { url?: string; token?: string }[] = [];
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
    const token = String(config.headers.get('Authorization') ?? '').replace('Bearer ', '');
    calls.push({ url: config.url, token });
    const response = (status: number) =>
      ({ status, statusText: '', headers: {}, config, data: { url: config.url } }) as AxiosResponse;
    if (acceptedToken === null || token !== acceptedToken) {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response(401));
    }
    return response(200);
  });
  httpClient.defaults.adapter = adapter;
  return { adapter, calls };
}

/** A refresh call the test resolves or rejects by hand, so 401s can pile up while it is pending. */
function deferredRefresh() {
  let resolve!: (value: { data: typeof NEW }) => void;
  let reject!: (reason: unknown) => void;
  const pending = new Promise<{ data: typeof NEW }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const post = vi.spyOn(axios, 'post').mockReturnValue(pending as never);
  return { post, resolve: () => resolve({ data: NEW }), reject: (e: unknown) => reject(e) };
}

/** Lets every queued promise callback run (interceptors are promise chains). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  setSessionTokens(OLD);
  vi.mocked(redirectToLogin).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  setSessionTokens(null);
});

describe('httpClient refresh single-flight', () => {
  it('sends ONE refresh for 3 concurrent 401s and retries all three once', async () => {
    const { calls } = fakeServer(NEW.accessToken);
    const refresh = deferredRefresh();

    const requests = Promise.all([
      httpClient.get('/me'),
      httpClient.get('/me/bids'),
      httpClient.get('/notifications'),
    ]);
    await flush();

    // All three got 401 and are now waiting on the same refresh.
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.token === OLD.accessToken)).toBe(true);
    expect(refresh.post).toHaveBeenCalledTimes(1);

    refresh.resolve();
    const responses = await requests;

    expect(refresh.post).toHaveBeenCalledTimes(1);
    expect(refresh.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/), {
      refreshToken: OLD.refreshToken,
    });
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);

    const retries = calls.slice(3);
    expect(retries).toHaveLength(3);
    expect(retries.every((c) => c.token === NEW.accessToken)).toBe(true);
    expect(retries.map((c) => c.url).sort()).toEqual(['/me', '/me/bids', '/notifications']);

    expect(getSessionTokens()).toEqual(NEW);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('ends the session exactly once when the shared refresh fails', async () => {
    const { calls } = fakeServer(NEW.accessToken);
    const refresh = deferredRefresh();
    const onTokens = vi.fn();
    const unsubscribe = subscribeToSessionTokens(onTokens);

    const requests = Promise.allSettled([
      httpClient.get('/me'),
      httpClient.get('/me/bids'),
      httpClient.get('/notifications'),
    ]);
    await flush();
    refresh.reject(new AxiosError('refresh rejected', 'ERR_BAD_REQUEST'));
    const results = await requests;
    unsubscribe();

    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'rejected']);
    expect(refresh.post).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(3); // nothing was retried
    expect(getSessionTokens()).toBeNull();
    expect(onTokens).toHaveBeenCalledTimes(1);
    expect(onTokens).toHaveBeenCalledWith(null);
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('never retries a request more than once (no infinite loop)', async () => {
    // The server refuses even the refreshed token.
    const { calls } = fakeServer(null);
    const refresh = deferredRefresh();

    const requests = Promise.allSettled([
      httpClient.get('/me'),
      httpClient.get('/me/bids'),
      httpClient.get('/notifications'),
    ]);
    await flush();
    refresh.resolve();
    const results = await requests;

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(refresh.post).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(6); // 3 originals + exactly 1 retry each
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
    expect(getSessionTokens()).toBeNull();
  });

  it('reuses a refresh that already finished instead of rotating again', async () => {
    // The request leaves with the old token; before its 401 arrives, another request's
    // refresh has already rotated the session to NEW.
    const refresh = deferredRefresh();
    const tokensSeen: string[] = [];
    let release401!: () => void;
    httpClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      const token = String(config.headers.get('Authorization')).replace('Bearer ', '');
      tokensSeen.push(token);
      const response = (status: number) =>
        ({ status, statusText: '', headers: {}, config, data: null }) as AxiosResponse;
      if (token === NEW.accessToken) return response(200);
      await new Promise<void>((resolve) => (release401 = resolve));
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response(401));
    });

    const late = httpClient.get('/me/bids');
    await flush();
    expect(tokensSeen).toEqual([OLD.accessToken]);

    setSessionTokens(NEW);
    release401();

    await expect(late).resolves.toMatchObject({ status: 200 });
    expect(refresh.post).not.toHaveBeenCalled();
    expect(tokensSeen).toEqual([OLD.accessToken, NEW.accessToken]);
  });

  it('does not refresh for 401s from auth endpoints', async () => {
    fakeServer(NEW.accessToken);
    const refresh = deferredRefresh();

    await expect(httpClient.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError);
    expect(refresh.post).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(getSessionTokens()).toEqual(OLD);
  });

  it('starts a new refresh for a later, unrelated expiry', async () => {
    fakeServer(NEW.accessToken);
    const first = deferredRefresh();
    const request = httpClient.get('/me');
    await flush();
    first.resolve();
    await request;
    expect(first.post).toHaveBeenCalledTimes(1);

    // Later the new access token expires too; the finished refresh must not be reused.
    const NEWER = { accessToken: 'access-newer', refreshToken: 'refresh-newer' };
    fakeServer(NEWER.accessToken);
    const second = vi.spyOn(axios, 'post').mockResolvedValue({ data: NEWER });
    await expect(httpClient.get('/me')).resolves.toMatchObject({ status: 200 });
    expect(second).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/), {
      refreshToken: NEW.refreshToken,
    });
    expect(getSessionTokens()).toEqual(NEWER);
  });
});
