# Architecture Decision Records

## ADR-001: Feature-Based Architecture

**Status:** Accepted
**Date:** 2026-07-31

**Context:** The storefront will grow to many domains (auth, catalog, bidding, orders, seller tools, admin). A flat component structure would become unmanageable, and this app has a real backend — `mazad-api` — with its own module boundaries (`AuctionsModule`, `ProductsModule`, `OrdersModule`, ...) that the frontend should mirror rather than fight.

**Decision:** Adopt Feature-Based Architecture where each domain feature is a self-contained folder with its own API, state, components, hooks, and i18n.

**Consequences:** Clear ownership, easy deletion of a feature, isolated testing. Cross-feature code goes to `shared/`. This first pass ships three features — `auth`, `home`, `catalog` — see [ARCHITECTURE.md](./ARCHITECTURE.md) for what each owns; bidding, orders, wallet, and seller/admin tooling are follow-up slices, not stubbed folders.

---

## ADR-002: Next.js 16 App Router

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Needed file-based routing, an SSR shell for the initial paint, `next/font`/`Metadata`, and a straightforward path to Vercel deployment, without hand-rolling a router.

**Decision:** Next.js 16 with the App Router. Route files under `src/app/<segment>/page.tsx` contain wiring only — each renders one feature's page component.

**Consequences:** Route protection is a client component (`AuthGuard`), not a router-level guard — see [ADR-008](#adr-008-session-tokens-live-in-localstorage-behind-a-client-side-authguard). Environment variables are `NEXT_PUBLIC_*`. Every module that uses React state, effects, browser APIs, or the router carries `'use client'`; the server pre-renders the shell. Code splitting comes from `next/dynamic` and route segments.

---

## ADR-003: Zustand for Client State Only

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Redux is too heavy for the amount of client-only state this app has (auth tokens, locale, toasts); Context API has performance pitfalls at scale.

**Decision:** Zustand for client state. TanStack Query for all server state. No overlap — never mirror API data (auctions, products, the user's own profile) into Zustand.

---

## ADR-004: Zod as Single Source of Truth for Schemas

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Maintaining parallel TypeScript interfaces and runtime validation invites drift, and `mazad-api`'s DTOs are a moving target across phases (Phase 6 stubs, Decimal-as-string fields, optional relations).

**Decision:** Define Zod schemas first, infer TypeScript types from them (`z.infer<typeof schema>`). Apply to form validation and to parsing every API response at the boundary — a schema that expects `currentPrice: z.string().nullable()` catches a backend shape change at the network edge instead of three components deep.

---

## ADR-005: Tailwind CSS v4

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Tailwind v4 removes the `tailwind.config.js` file and uses CSS-first configuration.

**Decision:** Define all design tokens inside `globals.css` with a `@theme` block. No `tailwind.config.js`. The build runs through `@tailwindcss/postcss` (`postcss.config.mjs`).

---

## ADR-006: i18next, Lazy-Loaded Feature Namespaces, English + Arabic Only

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Loading all translations upfront bloats the initial bundle. More importantly, `mazad-api`'s own localization (`resolveLocale` in `common/utils/locale.util.ts`) only ever picks between `nameEn`/`nameAr` from the `Accept-Language` header — there is no third language on the backend, so a frontend locale the API can't serve would just show English or Arabic copy under a different label.

**Decision:** Two locales — English and Arabic (RTL), Arabic default, matching the backend's own default. Each feature ships its own namespace loaded on demand. Shared strings use the `common` namespace, always loaded.

**Implementation:** A feature exports a `NamespaceLoader` from `features/<name>/i18n/index.ts` that dynamic-imports its own `en.json`/`ar.json`. `shared/hooks/useNamespaceTranslation.ts` calls that loader and registers the bundle with i18next on first use.

---

## ADR-007: Features Own Their Translations, Shared Owns the Loader

**Status:** Accepted
**Date:** 2026-07-31

**Context:** ADR-006 requires per-feature namespaces, while the dependency rules forbid `shared/` from importing `features/`. A central i18n config that imports every feature's JSON would break that rule.

**Decision:** Invert the dependency. `shared/i18n/config.ts` initialises i18next with the `common` namespace only and exposes `addNamespaceBundle`. Each feature exports a `loadXNamespace` function that dynamic-imports its own bundle, and a one-line `useXTranslation()` hook wrapping `useNamespaceTranslation`.

**Consequences:** Feature bundles stay out of the initial payload, `shared/` has no knowledge of any feature, and adding a feature needs no edit to a central registry. Callers gate their first render on the hook's `isReady` flag so no page flashes raw translation keys.

---

## ADR-008: Session Tokens Live in `localStorage` Behind a Client-Side `AuthGuard`

**Status:** Accepted
**Date:** 2026-07-31

**Context:** `mazad-api` issues a short-lived `accessToken` and a rotating `refreshToken` (`POST /auth/login`, `/auth/register`, `/auth/refresh`) with no cookie involved — the client is responsible for storage and for attaching `Authorization: Bearer <token>`.

**Decision:** Store both tokens in `localStorage` via the `auth` feature's Zustand store. Protect routes with an `AuthGuard` client component that checks session state on mount and redirects to `/login`, rather than Next middleware.

**Consequences:** Middleware cannot read `localStorage`, so it cannot gate routes today; moving to an `httpOnly` cookie issued by `mazad-api` would allow middleware-based protection later, at the cost of a CORS/cookie-domain story between `frontend` and `mazad-api`. `httpClient` attaches the bearer token to every request and, on a 401, refreshes through a single shared `POST /auth/refresh` (concurrent 401s wait for the same promise), retries each request once, and clears the session once if that fails — `mazad-api` revokes the whole session on refresh-token reuse (`REFRESH_TOKEN_REUSE`), so a refresh token must never be sent twice and a second failure must not retry again.

---

## ADR-009: Money Is a Decimal String on the Wire, Formatted at Render Time

**Status:** Accepted
**Date:** 2026-07-31

**Context:** `mazad-api` stores prices as Prisma `Decimal` and serializes them with `.toString()` (`auctions.service.ts#mapAuction`) — `startingPrice`, `currentPrice`, `minIncrement`, `buyNowPrice`, and `store.deliveryFee` all arrive as strings like `"1250.00"`, and `currentPrice`/`buyNowPrice` can be `null`. Treating any of these as a JSON `number` risks silent float rounding on resale-value prices.

**Decision:** Zod schemas type these fields as `z.string()` (or `z.string().nullable()`). `formatMoney` in `shared/lib/money.ts` is the single place that parses the string and formats it for display, assuming IQD. No component does arithmetic on a price string directly.

**Consequences:** Sorting or comparing prices (e.g. "ending soon" ordering) happens server-side via query params (`sort=currentPrice`), not by re-parsing strings client-side. If a future feature needs client-side price math (e.g. a bid increment preview), it goes through a shared `parseMoney` helper next to `formatMoney`, not an inline `Number(...)`.

---

## ADR-010: Locale Travels as an `Accept-Language` Header, Not a Query Param

**Status:** Accepted
**Date:** 2026-07-31

**Context:** `mazad-api` resolves which localized field to return (`nameEn` vs `nameAr`) from the `Accept-Language` request header (`resolveLocale`, default `ar`), not a query string. Categories, products, auctions, and stores all follow this convention.

**Decision:** `httpClient` reads the current locale from `shared/store/locale.store.ts` and sets `Accept-Language` on every outgoing request in a single interceptor. Feature API modules never add a `lang`/`locale` query param themselves.

**Consequences:** Switching locale in the UI only needs to invalidate TanStack Query caches (the same URL now returns different copy) rather than changing the request URL, which also means query keys must not encode the locale unless a feature specifically needs both locales cached simultaneously.

---

## ADR-011: Two Themes Driven by `data-theme`, Applied Before Hydration

**Status:** Accepted
**Date:** 2026-07-31

**Context:** A theme switch (light/dark) must apply instantly and must not flash the wrong palette on first paint, which rules out resolving it in React state alone.

**Decision:** `:root` carries the dark token values and `[data-theme='light']` overrides them. A tiny inline script in the root layout reads `localStorage` and stamps `data-theme`, `lang`, and `dir` on `<html>` before hydration; `useTheme` and `useLocale` keep those attributes correct afterwards.

**Consequences:** No theme or direction flash, and components reference only semantic tokens (`bg-surface`, `text-ink`, `border-hairline`) so neither palette is hardcoded anywhere. The script uses `next/script` with `beforeInteractive` rather than `dangerouslySetInnerHTML`, matching `docs/security.md`. `suppressHydrationWarning` on `<html>` is required because the server markup is stale by design.

---

## ADR-012: Vitest and Testing Library for the Test Suite

**Status:** Accepted
**Date:** 2026-07-31

**Context:** The app needs an executable guard for the non-obvious behaviors above (server-anchored countdowns, money formatting, refresh-token handling) rather than a comment asking reviewers to remember them.

**Decision:** Vitest with jsdom and React Testing Library. `vite-tsconfig-paths` reuses the `@features`/`@shared` aliases from `tsconfig.json` so tests resolve modules exactly the way the app does. Tests live in `src/**/*.test.{ts,tsx}`; `npm run test` runs once, `npm run test:watch` watches.

**Consequences:** Native ESM and TypeScript with no separate transform config, reusing the Vite pipeline. `@vitejs/plugin-react` is deliberately absent — it exists for Fast Refresh, a dev-server concern, and esbuild already compiles JSX from `jsx: react-jsx`.

---

## ADR-013: Auction Countdowns Anchor to Server Time, Not the Client Clock

**Status:** Accepted
**Date:** 2026-07-31

**Context:** Every auction has a hard `endsAt`, plus anti-sniping extensions that push it later. A "time remaining" countdown built on the visitor's own `Date.now()` drifts against the backend's actual close time whenever the visitor's clock is wrong — common enough on mobile devices to matter for something as time-sensitive as a live auction. `GET /homepage` conveniently returns `serverTime` alongside the feed.

**Decision:** `useServerClock` (`shared/hooks`) captures `serverTime - Date.now()` once per fetch of any endpoint that returns it, and stores the offset. Every countdown component computes `remaining = endsAt - (Date.now() + offset)` instead of comparing straight against `Date.now()`.

**Consequences:** A countdown is only as fresh as its last `serverTime` sample — acceptable for a display timer, not precise enough to gate the actual bid submission, which the backend enforces authoritatively regardless of what the client displays. If a page never hits an endpoint carrying `serverTime`, its offset defaults to zero rather than blocking render.
