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

## Password reset

"Forgot password?" on the sign-in page opens `/reset-password`. The flow uses existing mazad-api
endpoints only. It was read from the code (`auth.controller.ts`, `auth.service.ts`,
`otp.service.ts`, `auth-core.service.ts`, `dto/auth.dto.ts`), not from older docs. The mobile app
runs the same three steps.

### Step 1: request a code

`POST /auth/otp/request` with `{ phone, purpose: "PASSWORD_RESET" }`.

- The phone must match `^\+?[0-9]{10,15}$`; the API normalises it to `+digits`.
- Success returns `{ message, expiresAt, channel, delivered, telegramDeepLink?, botUsername? }`.
  - It answers the same way whether or not an account exists for the phone.
  - `delivered: false` means the code arrives only after the user opens `telegramDeepLink`, the
    same as sign-up.
- Limits:
  - the code lives `OTP_TTL_SECONDS`, 300 s by default;
  - one request per phone and purpose per 60 s (`OTP_RESEND_COOLDOWN`, 429);
  - at most `OTP_MAX_REQUESTS_PER_HOUR` codes per phone per hour, across all purposes
    (`OTP_RATE_LIMITED`, 429);
  - 10 requests a minute per IP (429, no code of its own: shown as `TOO_MANY_REQUESTS`).

### Step 2: verify the code

`POST /auth/otp/verify` with `{ phone, code, purpose: "PASSWORD_RESET" }`. The code is 6–8 digits
on the API (`OTP_LENGTH`, 6 by default); the storefront sends 6.

- Success returns `{ resetToken, resetTokenExpiresAt }`. **No session is created.**
  - `resetToken` is 64 lowercase hex characters and single-use.
  - It is valid for `PASSWORD_RESET_TOKEN_TTL_SECONDS`, 600 s by default.
  - Issuing it retires any earlier unused reset token for that account.
- Code errors (401):
  - `OTP_EXPIRED_OR_MISSING`: no live code, or it was already used;
  - `OTP_EXHAUSTED`: more than `OTP_MAX_ATTEMPTS` wrong tries (5 by default);
  - `OTP_INVALID`: wrong code.

  Each attempt counts, and a correct code is consumed.

- Account errors, checked **after** the code is consumed:
  - `USER_NOT_FOUND` (404): no account for the phone. This includes a deleted account, whose phone
    was released.
  - `ACCOUNT_DISABLED` (403);
  - `USER_BANNED` (403);
  - `OTP_LOGIN_NOT_ALLOWED` (403): administrator accounts reset through the dashboard, not here.
- Throttle: 20 requests a minute per IP.

### Step 3: set the new password

`POST /auth/password/reset` with `{ resetToken, newPassword }`.

- `newPassword` is 8–128 characters. Any other body field gives a 400 validation error. The
  form asks for it twice and only sends it when both match (the API takes it once).
- Success returns `{ message: "Password updated" }`.
  - The password is changed and **every session of the account is revoked**, on every device.
  - The user is not signed in: they sign in with the new password.
- `RESET_TOKEN_INVALID` (401): the token is expired, already used, or the account is no longer
  active. The user starts again from step 1.
- Throttle: 10 requests a minute per IP.

None of these are refreshed by the http client: a 401 under `/auth/*` is passed through as an
error.

Known server behaviour, unchanged here:

- `USER_NOT_FOUND` at step 2 tells someone holding a valid code for a phone that it has no account.
  Getting that code already requires control of the phone's Telegram account.
- A passwordless account (OTP sign-up through the API) can use this flow to set its first
  password.

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
