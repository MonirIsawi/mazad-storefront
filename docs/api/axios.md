# Axios Setup

## Single Instance

There is exactly one Axios instance in the entire app: `shared/api/http-client.ts`.

All feature API modules import from it:

```ts
import { httpClient } from '@shared/api';
```

## Configuration

```ts
export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
```

## Request Interceptor

Attaches the `Authorization` and `Accept-Language` headers. Guarded for the server render, where there is no `window`:

```ts
httpClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;

  config.headers['Accept-Language'] = useLocaleStore.getState().locale;
  return config;
});
```

Storage keys come from `shared/constants/storage-keys.ts` — never a string literal. See [ADR-010](../../DECISIONS.md#adr-010-locale-travels-as-an-accept-language-header-not-a-query-param) for why locale is a header, not a query param.

## Response Interceptor

Handles 401 globally, except on `/auth/*`, where a 401 means "wrong credentials" rather than "session expired" and belongs to the form. The real code is `src/shared/api/http-client.ts`; its shape:

```ts
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint = original?.url?.startsWith('/auth') ?? false;

    if (!isUnauthorized || isAuthEndpoint || !original) return Promise.reject(error);
    if (original._retried) return signOutOnce(error); // the fresh token was refused too
    original._retried = true;

    // One shared promise: concurrent 401s wait for the same POST /auth/refresh.
    const { accessToken } = await refreshSessionOnce().catch(signOutOnce);
    original.headers.set('Authorization', `Bearer ${accessToken}`);
    return httpClient(original);
  },
);
```

Three rules keep this safe with `mazad-api`'s refresh-token rotation (`REFRESH_TOKEN_REUSE`
revokes the whole session):

- **Single flight.** While a refresh is running, every other 401 awaits the same promise instead
  of sending the same (soon rotated) refresh token again.
- **One retry per request.** `_retried` stops loops: a 401 on the retry ends the session.
- **One sign-out.** Requests that fail together all call the sign-out; only the first, which still
  finds a session, clears it and redirects.

A request that left with an older access token than the current one is simply retried with the
current token, without another refresh. The refresh itself uses bare `axios`, so it never enters
this interceptor.

## Usage in Feature API Modules

Success responses are raw JSON — there is no `{ success, data, message }` envelope. A list
endpoint returns `{ data, meta }` directly; `GET /homepage` returns `{ live, upcoming,
endingSoon, serverTime }` directly. Only errors have a fixed shape (see
[error-handling.md](./error-handling.md)). Parse the raw response with the feature's Zod schema:

```ts
// features/catalog/api/catalog.api.ts
export const catalogApi = {
  listAuctions: async (params: AuctionListParams): Promise<AuctionList> => {
    const response = await httpClient.get<unknown>('/auctions', { params });
    return auctionListSchema.parse(response.data);
  },
};
```

Type the response as `unknown` and let Zod narrow it. Never assert a shape with `as`.

Response schemas are deliberately permissive where a field genuinely doesn't matter to the UI —
`.nullish()` or a `.catch()` default — so an optional field going missing never blanks a page.
Prices stay `z.string()` end to end (see [ADR-009](../../DECISIONS.md#adr-009-money-is-a-decimal-string-on-the-wire-formatted-at-render-time)) — never `z.coerce.number()`.
