# AGENTS.md — AI Agent Instructions

This file tells AI coding agents (Claude, Copilot, Cursor, etc.) how to work in this codebase.

The app is **mazad-storefront**: Next.js 16 (App Router) + TypeScript + Tailwind v4, organised as feature slices under `src/`. It is the public buyer-facing web client for `mazad-api` (NestJS/Prisma/MySQL, in the sibling `../mazad-api` directory) — a live auction marketplace, not a generic e-commerce store. Read [ARCHITECTURE.md](./ARCHITECTURE.md) before making structural changes, and read the sibling API's `README.md`/`ASSUMPTIONS.md` before assuming an endpoint shape.

## Architecture Rules

1. **Feature isolation is absolute.** Never import from `features/X` inside `features/Y`. If two features need each other, compose them in the route file under `src/app/`.
2. **No business logic in components.** Extract to hooks or utils.
3. **No Axios in components or hooks.** All HTTP calls belong in `features/[name]/api/`, and they use `httpClient` from `@shared/api` — never a new Axios instance.
4. **No `any`.** TypeScript strict mode is enforced by ESLint.
5. **Infer types from Zod schemas** (`z.infer<typeof schema>`) rather than writing duplicate interfaces.
6. **`shared/` knows nothing about `features/`.** If shared code needs feature data, invert the dependency and let the feature pass it in (see the i18n loader pattern in ADR-007).

## Backend Contract Rules

These come directly from how `mazad-api` is built — get them wrong and a feature will compile but silently misbehave.

1. **Prices are strings, never numbers.** Every `Decimal` field (`startingPrice`, `currentPrice`, `minIncrement`, `buyNowPrice`, `deliveryFee`, …) is serialized with `.toString()`, e.g. `"1250.00"`. Never do arithmetic on it in a component — parse once in a hook/util, format with `formatMoney` from `@shared/lib` (see ADR-009).
2. **Locale is a header, not a query param.** Localized fields (`nameEn`/`nameAr` → `name`) are picked server-side from `Accept-Language` (`en` or `ar`, default `ar`). `httpClient` attaches this automatically from the locale store — don't add a `lang` query param by hand (ADR-010).
3. **Success responses are raw JSON, not an envelope.** `GET /auctions` returns `{ data, meta }`; `GET /homepage` returns `{ live, upcoming, endingSoon, serverTime }` directly. Only errors have a fixed shape: `{ statusCode, errorCode, message, details, requestId, timestamp, path }`. Match on `errorCode`, never on `message` (it's human text, not an identifier).
4. **Auction countdowns anchor to `serverTime`, not `Date.now()`.** The client clock can't be trusted against `endsAt`/anti-sniping extensions — see ADR-013.
5. **Every request carries a bearer token when one exists**, because `mazad-api`'s global guard defaults to authenticated; only `@Public()`/`@OptionalAuth()` routes work without one. A 401 triggers one silent, shared `/auth/refresh` (single-flight, so concurrent 401s never replay a rotated refresh token) and one retry per request before the session is cleared.

## When Adding a Feature

1. Create `src/features/[feature-name]/` with the subfolders it needs (`api`, `components`, `hooks`, `i18n`, `pages`, `schemas`, `types`).
2. Add `i18n/en.json`, `i18n/ar.json`, and an `i18n/index.ts` exporting `<FEATURE>_NAMESPACE` and `load<Feature>Namespace`.
3. Add a `hooks/use<Feature>Translation.ts` that wraps `useNamespaceTranslation`.
4. Add query keys to `shared/constants/query-keys.ts`.
5. Export the public API via `index.ts` — pages and anything `app/` needs, nothing more.
6. Add the route file at `src/app/[segment]/page.tsx`, wrapped in `<AuthGuard>` if it needs a session.

## Naming Conventions

| Item         | Convention                 | Example                      |
| ------------ | -------------------------- | ---------------------------- |
| Folders      | kebab-case                 | `auction-card/`              |
| Components   | PascalCase                 | `AuctionCard.tsx`            |
| Hooks        | camelCase prefix `use`     | `useAuctionDetail.ts`        |
| Stores       | `feature.store.ts`         | `auth.store.ts`              |
| Schemas      | `feature.schema.ts`        | `auth.schema.ts`             |
| Types        | `feature.types.ts`         | `catalog.types.ts`           |
| API modules  | `feature.api.ts`           | `catalog.api.ts`             |
| Constants    | UPPER_SNAKE_CASE values    | `MAX_RETRY_COUNT`            |
| Boolean vars | `is/has/can/should` prefix | `isLoading`, `hasPermission` |
| Handlers     | `handle` prefix            | `handleSubmit`               |

## Import Order

```ts
// 1. React
import { useState } from 'react';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';

// 3. Shared
import { Button } from '@shared/components/ui';
import { cn } from '@shared/lib';

// 4. Feature-internal (relative)
import { useAuctions } from '../hooks/useAuctions';
import type { Auction } from '../types/catalog.types';
```

Path aliases: `@/` → `src/`, `@app/`, `@features/`, `@shared/`.

## Client and Server Components

Every module that uses React state, effects, refs, context, browser APIs, or `next/navigation` starts with `'use client'`. That covers everything under `features/*/{components,hooks,pages,store}` and `shared/{components,hooks,store}`, plus each feature's `index.ts`. Schemas, types, constants, utils, and API modules stay directive-free.

## Component Size Limits

- Component file: **150–200 lines max**. Split into sub-components if larger.
- Function body: **10–30 lines ideal, 40 lines max**.
- One component = one responsibility.

## State Rules

- Server state → TanStack Query (`useQuery`, `useMutation`)
- Client/UI state → Zustand
- Form state → React Hook Form with `zodResolver`
- Never duplicate server state in Zustand

## Styling Rules

- Tailwind utilities only; no inline `style` objects except for values that come from data at runtime (e.g. a category icon colour from the API).
- Colours come from the semantic tokens in `src/app/styles/globals.css` (`bg-surface`, `text-accent`, `border-destructive/30`, `text-live`, `text-ending-soon`). Never write a hex value in a component.
- Use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) so RTL keeps working — Arabic is the default locale.

## Commit Message Format

```
type(scope): short description

Types: feat | fix | refactor | docs | style | test | chore
Examples:
  feat(auth): add phone + password registration
  fix(catalog): correct ending-soon countdown drift
```

## Adding Translations

Always add keys to **both** `en.json` and `ar.json` at the same time. Never leave a key untranslated. Zod validation messages are i18n keys — the form translates `errors.field.message` at render time.

## Verifying a Change

```bash
npm run type-check && npm run lint && npm run format:check && npm run build
```

All four must pass with zero errors before a change is done.

## Do NOT

- Use `../../../` imports — use path aliases (`@shared/`, `@features/`, `@app/`)
- Add `console.log` (only `console.warn` / `console.error` allowed)
- Create utility functions that already exist in `shared/lib/`
- Create a second Axios instance
- Set `typescript.ignoreBuildErrors` in `next.config.mjs`
- Reach into a feature's internals from `app/` — import from `@features/<name>` only
- Treat a Decimal-string price as a number, or an error `message` as a stable identifier
