# Authentication

## Flow

1. User submits the login form (phone + password) → `useLogin` mutation fires
2. `authApi.login()` calls `POST /auth/login` → server returns `{ accessToken, refreshToken, sessionId, user }`
3. `useAuthStore.setSession()` writes the tokens and user to `localStorage` and updates the store
4. The `httpClient` request interceptor attaches `Authorization: Bearer <accessToken>` to every request
5. On a 401 outside `/auth/*` → the response interceptor refreshes the session (one shared `POST /auth/refresh` for all concurrent 401s); on success it retries each original request once, on failure it clears the session and redirects to `/login` once

Registration proves the phone first. `RegisterForm` is one form in two steps:

1. Full name, phone and password are validated, then `POST /auth/otp/request` with
   `purpose: "SIGNUP"` sends a 6-digit code. If the phone is not linked to the Telegram bot yet,
   the response has `delivered: false` and a `telegramDeepLink`; the form shows that link.
2. The details lock, a code field appears, and `POST /auth/register` is sent with
   `{ phone, password, fullName, code }` only once the code is 6 digits. The API verifies and
   consumes the code before the account exists, then returns the same
   `{ accessToken, refreshToken, sessionId, user }` shape and the user is signed in.

"Resend code" unlocks after 60s, matching the API's per-phone cooldown (`OTP_RESEND_COOLDOWN`).
Errors are shown by `errorCode`: `OTP_INVALID`, `OTP_EXPIRED_OR_MISSING` (expired or already
used), `OTP_EXHAUSTED`, `OTP_RESEND_COOLDOWN`, `OTP_RATE_LIMITED`; the API's per-IP throttler
answers 429 without a code of its own and is shown as `TOO_MANY_REQUESTS`. In development the
API's `OTP_DEV_MODE` accepts the static `OTP_DEV_STATIC_CODE` (6 digits); production refuses it.

After a successful sign-in or registration, the hook redirects to `/`. There is no setup wizard —
the storefront has nothing to configure before browsing.

## Protected Routes

`AuthGuard` from `features/auth` wraps every authenticated route file:

```tsx
'use client';

import { AuthGuard, AccountPage } from '@features/auth';

export default function Route() {
  return (
    <AuthGuard>
      <AccountPage />
    </AuthGuard>
  );
}
```

It renders `<PageLoader />` until the session check passes, then the children. See [routing.md](../architecture/routing.md) for why this is a client guard rather than middleware.

## Auth Store

```ts
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (result: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}
```

The tokens live in `localStorage` under the keys in `shared/constants/storage-keys.ts` because the Axios interceptor — which sits in `shared/` and cannot import this feature — reads them synchronously on every request. The store is their only writer, so the two can never drift. The store hydrates from `localStorage` at creation, validating the stored user with `userSchema` before trusting it.

## Logout

`useLogout` calls `POST /auth/logout` (best-effort — it revokes the session server-side), then clears the auth store and the whole React Query cache, and replaces the route with `/login`. If the network call fails, the local session is cleared anyway; there's nothing sensitive left to protect once the tokens are gone client-side.

## Token Refresh

Implemented in the Axios response interceptor (see [axios.md](./axios.md)). `mazad-api` rotates the refresh token on every use and revokes the whole session if a stale one is replayed (`REFRESH_TOKEN_REUSE`), so the refresh is **single-flight**: every request that gets a 401 while a refresh is running waits for the same promise, and only one `POST /auth/refresh` goes out. Each request is retried at most once; a 401 on the retry, or a failed refresh, clears the session and redirects to `/login` exactly once. Covered by `src/shared/api/http-client.test.ts`.

Tabs coordinate too (`src/shared/api/cross-tab-lock.ts`). The refresh runs under a Web Lock (`mazad:auth-refresh`); the tab that gets it first re-reads `localStorage` and either adopts a session another tab already rotated (no network call) or refreshes and persists the new tokens before releasing the lock. A tab whose stored session vanished (signed out elsewhere) signs out instead of refreshing. Other tabs pick up new tokens or a sign-out from the `storage` event (`syncSessionFromStorage`). The browser releases a lock when its tab closes or crashes, and waiting is capped at 15s; browsers without Web Locks (before Safari 15.4 / Firefox 96) keep the per-tab single flight. Covered by `src/shared/api/cross-tab-refresh.test.ts`.

Moving the session to an `httpOnly` cookie issued by `mazad-api` would let a Next `middleware.ts` protect routes before render, replacing the client-side `AuthGuard` — see [ADR-008](../../DECISIONS.md#adr-008-session-tokens-live-in-localstorage-behind-a-client-side-authguard).
