import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useLocaleStore } from '@shared/store';
import { getSessionTokens, setSessionTokens, type SessionTokens } from './auth-session';
import { redirectToLogin } from './redirect-to-login';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const httpClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const tokens = getSessionTokens();
  if (tokens) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  // mazad-api picks nameEn/nameAr from this header, default "ar" (see ADR-010).
  config.headers.set('Accept-Language', useLocaleStore.getState().locale);
  return config;
});

/** Bare axios, not httpClient — a refresh call must never itself re-enter this interceptor. */
async function refreshAccessToken(refreshToken: string): Promise<SessionTokens> {
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${baseURL}/auth/refresh`,
    { refreshToken },
  );
  return { accessToken: response.data.accessToken, refreshToken: response.data.refreshToken };
}

/*
 * Single-flight refresh. mazad-api rotates the refresh token on every use and revokes the whole
 * session when an already-rotated token comes back (REFRESH_TOKEN_REUSE, ADR-008). Requests that
 * hit 401 together must share ONE /auth/refresh call; if each sent the same refresh token, the
 * second call would end the session.
 */
let inFlightRefresh: Promise<SessionTokens> | null = null;

function refreshSessionOnce(refreshToken: string): Promise<SessionTokens> {
  inFlightRefresh ??= refreshAccessToken(refreshToken)
    .then((tokens) => {
      setSessionTokens(tokens);
      return tokens;
    })
    .finally(() => {
      inFlightRefresh = null;
    });
  return inFlightRefresh;
}

/** Ends the session once: every caller that failed together lands here, only the first acts. */
function forceSignOut() {
  if (!getSessionTokens()) return;
  setSessionTokens(null);
  redirectToLogin();
}

function bearerOf(config: InternalAxiosRequestConfig): string | undefined {
  const header = config.headers.get('Authorization');
  return typeof header === 'string' ? header.replace(/^Bearer /, '') : undefined;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint = original?.url?.startsWith('/auth') ?? false;
    const tokens = getSessionTokens();

    if (!isUnauthorized || isAuthEndpoint || !tokens || !original) {
      return Promise.reject(error);
    }

    // Each request is retried at most once. A 401 on the retry means even the fresh token was
    // refused, so the session is over; refreshing again would only loop.
    if (original._retried) {
      forceSignOut();
      return Promise.reject(error);
    }
    original._retried = true;

    let fresh: SessionTokens;
    try {
      // A refresh may have completed while this request was in flight. Then it only needs the
      // newer token, not a second rotation of the session.
      fresh =
        bearerOf(original) !== tokens.accessToken
          ? tokens
          : await refreshSessionOnce(tokens.refreshToken);
    } catch (refreshError) {
      forceSignOut();
      return Promise.reject(refreshError);
    }

    original.headers.set('Authorization', `Bearer ${fresh.accessToken}`);
    return httpClient(original);
  },
);
