# Routing

## Next.js App Router — File-Based

Routes are folders under `src/app/`, each with a `page.tsx`. There is no generated route tree to maintain. See [ADR-002](../../DECISIONS.md#adr-002-nextjs-16-app-router) for why Next.js was chosen for this app.

## File Map

| File                         | Route           | Renders                    |
| ---------------------------- | --------------- | -------------------------- |
| `app/layout.tsx`             | (root)          | Providers, fonts, metadata |
| `app/page.tsx`               | `/`             | `HomePage`                 |
| `app/auctions/page.tsx`      | `/auctions`     | `AuctionsBrowsePage`       |
| `app/auctions/[id]/page.tsx` | `/auctions/:id` | `AuctionDetailPage`        |
| `app/stores/[id]/page.tsx`   | `/stores/:id`   | `StorePage`                |
| `app/login/page.tsx`         | `/login`        | `LoginPage`                |
| `app/register/page.tsx`      | `/register`     | `RegisterPage`             |
| `app/account/page.tsx`       | `/account`      | `AccountPage`              |

### Bidoom first run: `/welcome`

`app/welcome/page.tsx` renders `WelcomePage` (brand art, the promise, slide to start). It is never a
gate: the server always renders the page that was asked for, so deep links and crawlers are
unaffected. On the client, a first visit to `/` by a signed-out visitor is sent to `/welcome`
once; `mazad.welcomeSeen` in localStorage remembers it (also set for signed-in visitors, who never
see it). Slide to start goes home; "Sign in" goes to `/login`. The shell draws no header, footer or
tab bar there. Other Bidoom routes: `/auctions/:id/bids` (full bid history), `/account/delete`
(in-app account deletion) and `/contact` (support reports; hidden unless the API has them).

Only `/account` needs a session — browsing the marketplace is public, matching `mazad-api`'s
`@Public()` decorators on `/homepage`, `/categories`, `/products`, `/auctions`, and `/stores/:id`.

## Adding a Route

1. Create `src/app/<segment>/page.tsx`.
2. Export a default component that renders the feature page and nothing else.
3. Wrap it in `<AuthGuard>` if the route needs a session.

```tsx
// src/app/account/page.tsx
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

Import from the feature's public API (`@features/auth`), never its internals — ESLint enforces this for files under `src/app/`.

## Route Guards

`AuthGuard` (`features/auth/components/AuthGuard.tsx`) checks the session on mount and redirects:

```tsx
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

useEffect(() => {
  if (!isAuthenticated) router.replace(ROUTES.login);
  else setIsAllowed(true);
}, [isAuthenticated, router]);

if (!isAllowed) return <PageLoader />;
```

It renders `<PageLoader />` until the check passes, which also keeps the server-rendered markup and the first client render identical.

**Why not middleware?** The token lives in `localStorage`, which the Edge runtime cannot read. Moving the session to an `httpOnly` cookie would allow a `middleware.ts` guard and is the natural next step if the API supports it — see [ADR-008](../../DECISIONS.md#adr-008-session-tokens-live-in-localstorage-behind-a-client-side-authguard).

## Navigation

Use `<Link>` from `next/link` for anything the user clicks, and `useRouter()` from `next/navigation` for programmatic redirects after a mutation. Never use `window.location` except in the error boundary and the auth interceptor's forced sign-out, where the React tree/session is already gone.

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@shared/constants';

<Link href={ROUTES.auctions}>Auctions</Link>;

const router = useRouter();
router.replace(ROUTES.home);
```

Paths come from `ROUTES` in `shared/constants/routes.ts` — never a string literal.
