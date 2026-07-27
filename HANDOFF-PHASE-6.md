# CrafteeVee — Phase 6 Handoff: Accounts + About/Contact

## Progress Summary

**Current completed phase:** Phase 6 — mock user accounts (signup/login/
logout, protected account page, per-user order history) and real content
for the About/Contact pages (scope confirmed with the user up front:
"both").

### New features added

- **Mock accounts, site-wide** — `AuthContext` + `AuthProvider` (new
  `src/context/` files), mounted in `App.tsx` alongside `CartProvider`/
  `WishlistProvider`. There is no real backend: `signup()` writes a user
  record to `localStorage` (`crafteevee-users`) and `login()` checks
  against it; the current session is a single email string in
  `crafteevee-session`. Heavily commented as a demo of the auth *flow*
  (forms, validation, session persistence, protected routes) and
  explicitly **not** representative of real auth security - passwords are
  stored in plain text because there's no server to hash against.
- **`/login`** (new) — combined login/signup page with a mode toggle
  ("Don't have an account? Sign up" / "Already have one? Log in") rather
  than two separate routes, since switching modes is the most common
  thing someone does here. Redirects to wherever `RequireAuth` sent the
  person from (`location.state.from`), defaulting to `/account`.
- **`/account`** (new) — protected via the new `RequireAuth` guard. Shows
  name/email and a "Log out" button, plus order history read from
  `localStorage` via `getOrdersForUser()`. No simulated fetch here, same
  reasoning as `Wishlist.tsx` - this data never left the browser.
- **`RequireAuth`** (new, `src/components/auth/`) — route guard.
  Redirects unauthenticated visitors to `/login`, remembering where they
  were headed so `Login` can send them back after signing in.
- **`src/lib/auth.ts`** (new) — `validateLogin()`/`validateSignup()`
  (required fields, email format, password length ≥6, confirm-password
  match).
- **`src/lib/orders.ts`** (new) — `getOrdersForUser()`/
  `saveOrderForUser()`, one `localStorage` array per email
  (`crafteevee-orders:<email>`). Guest checkout still works exactly as in
  Phase 5 - orders just aren't saved anywhere to look up again if nobody's
  logged in.
- **Checkout integration** — `Checkout.tsx` now pre-fills full name/email
  from the logged-in account (one less thing to type) and calls
  `saveOrderForUser()` right after a successful `placeOrder()` when
  someone's signed in.
- **Navbar account icon** — new `User` icon between Search and Wishlist
  (Search → Account → Wishlist → Cart → Theme). Shows "Log in" and routes
  to `/login` when signed out; shows "Account" and routes to `/account`
  when signed in. Wired into both the desktop icon row and the mobile
  menu (which also gets a "Log out" action when authenticated).
- **`/about`** — real content, replacing the Phase 1 `PagePlaceholder`
  stub: brand story, a "how each piece comes together" process-step grid,
  a values grid, and a shop CTA. Keeps `id="story"` on the story section
  since the footer's existing "Our Story" link (`Footer.tsx`) already
  points to `/about#story` - that anchor had nothing to land on before
  this phase.
- **`/contact`** — real content, replacing the Phase 1 `PagePlaceholder`
  stub: contact info cards + a working contact form with the same
  simulated-submit pattern as Newsletter/Checkout (validates, shows a
  loading state, then a success state - no real backend, same as
  everywhere else).
- **`src/data/contact-content.ts`** (new) — `CONTACT_POINTS` extracted
  from `ContactTeaser.tsx` (which previously defined it inline) so the
  homepage teaser and the full Contact page share one source of contact
  info instead of two copies that could drift apart.

### Bugs found and fixed this session

**Logging out from `/account` landed on `/login` instead of `/`.** This
was a genuine React Router timing issue, not a simple ordering mistake -
worth documenting in detail since it very nearly slipped through and the
"obvious" fixes didn't work:

- `/account` is wrapped in `RequireAuth`, which redirects to `/login`
  whenever `isAuthenticated` is `false`.
- The original logout handler called `logout()` then `navigate("/")`.
  Both are state updates fired synchronously in the same click handler,
  so React batches them into one re-render - but `RequireAuth` could
  still observe the *old* `/account` pathname in that same render (its
  `useLocation()` hadn't caught up with the in-flight `navigate("/")`
  yet), see `isAuthenticated: false`, and redirect to `/login`,
  clobbering the `navigate("/")` that was already in flight.
- **Simply reordering to `navigate("/")` then `logout()` did not fix
  it.** Instrumented tracing (adding temporary `console.log`s to
  `RequireAuth`) showed `RequireAuth` re-rendering with the stale
  `/account` pathname *after* `navigate("/")` had already updated
  `window.location.pathname` to `/` - React Router's own location
  context update is not synchronized with the browser History API call.
- **Deferring `logout()` with `setTimeout(..., 0)` also did not fix
  it** - the location-context update can still be pending after a
  macrotask boundary.
- **Wrapping `navigate("/")` in `flushSync()` also did not fix it** -
  `flushSync` only forces *React's own* pending updates to flush
  synchronously; if the location-context update hadn't even been
  scheduled yet by the time `flushSync`'s callback returned, there was
  nothing for it to flush.
- **Fix**: use a real page navigation (`window.location.href = "/"`)
  instead of React Router's `navigate()` for the logout action. This
  sidesteps the SPA routing race entirely (there's no React tree left to
  race against) and is a reasonable choice for an "end session" action
  regardless - it guarantees every bit of in-memory state gets reset, not
  just the auth context. `logout()` was also changed to clear the
  `crafteevee-session` key synchronously (instead of solely relying on
  its `useEffect`), so the hard navigation immediately after it can't
  race the `localStorage` write either. Applied to both logout call
  sites: `Account.tsx`'s "Log out" button and the Navbar mobile menu's.
- Verified fixed with a dedicated Playwright reproduction script tracing
  `framenavigated` events and the exact final URL, plus the full QA suite
  (19/19 passed after the fix, including the two logout-specific checks).

### Improvements made

- `ContactTeaser.tsx`'s contact info list is no longer duplicated between
  the homepage and the new Contact page (see `contact-content.ts` above).

## Files

### Created
```
src/
├── context/
│   ├── AuthContext.ts          (createContext, AuthContextValue, useAuth hook)
│   └── AuthProvider.tsx        (AuthProvider - mock signup/login/logout, localStorage)
├── components/
│   └── auth/
│       └── RequireAuth.tsx     (route guard, redirects to /login when signed out)
├── pages/
│   ├── Login.tsx                (combined login/signup)
│   └── Account.tsx              (profile + order history, protected)
├── lib/
│   ├── auth.ts                  (validateLogin, validateSignup)
│   └── orders.ts                (getOrdersForUser, saveOrderForUser)
├── data/
│   └── contact-content.ts       (CONTACT_POINTS, shared by ContactTeaser + Contact)
HANDOFF-PHASE-6.md
```

### Modified
- `src/App.tsx` — added `AuthProvider` (wrapping the router alongside
  `CartProvider`/`WishlistProvider`) and two new routes: `login`,
  `account` (the latter wrapped in `RequireAuth`).
- `src/components/layout/Navbar.tsx` — added the Account `IconButton`
  (desktop) and an account/logout section in the mobile menu; logout uses
  a hard navigation (see Bugs Fixed above).
- `src/pages/Checkout.tsx` — pre-fills `fullName`/`email` from the logged-
  in user; saves the placed order to their history via
  `saveOrderForUser()`.
- `src/pages/About.tsx` — full rewrite, real content (was
  `PagePlaceholder`).
- `src/pages/Contact.tsx` — full rewrite, real content (was
  `PagePlaceholder`).
- `src/components/home/ContactTeaser.tsx` — now imports `CONTACT_POINTS`
  from `@/data/contact-content` instead of defining it locally.

### Removed
None.

## Architecture Notes

- **New reusable components**: `RequireAuth` (`src/components/auth/`).
- **New utilities**: `src/lib/auth.ts` (`validateLogin`, `validateSignup`,
  `MIN_PASSWORD_LENGTH`), `src/lib/orders.ts` (`getOrdersForUser`,
  `saveOrderForUser`).
- **State management**: third global context, same shape as Phase 4/5's
  cart/wishlist. `AuthContext`/`AuthProvider` split into two files for the
  same `react/only-export-components` reason as the other two.
  `AuthProvider` wraps `<BrowserRouter>` in `App.tsx` alongside
  `CartProvider`/`WishlistProvider` - nesting order between the three
  doesn't matter, none of them read from each other.
- **Auth persistence**: `localStorage` keys `crafteevee-users` (mock user
  "database", keyed by lowercased email) and `crafteevee-session` (just
  the logged-in email, or absent). Passwords are plain text - see the
  heavy warning comments in `AuthProvider.tsx`; this is a client-only demo
  with no server, not a security reference.
- **Order history persistence**: `localStorage` key
  `crafteevee-orders:<email>`, an array of `Order` (reusing the `Order`
  type from Phase 5's `src/types/order.ts` - no changes needed there),
  most recent first.
- **Data model**: no new types this phase - `AuthUser` lives in
  `AuthContext.ts` (`{ name, email }`, deliberately not the same shape as
  the internal `StoredUser` which also carries the password).
- **API changes**: none - `login`/`signup` are documented mock calls with
  simulated latency (same `setTimeout`-wrapped-promise pattern as every
  other "network" call in the app).
- **Database changes**: none.
- **Configuration updates**: none - no new dependencies were installed.

## QA Checklist

Verified this session (headless Chromium via Playwright against a
production `vite build` + `vite preview`, scripted click-through — 19/19
Phase 6 checks passed, plus a Phase 5 regression re-run at 20/22 with the
2 "failures" being the same pre-existing test-harness artifacts already
documented in `HANDOFF-PHASE-5.md`, not real regressions):

- [x] `npm run build` succeeds, `npm run lint` (`oxlint src`) reports 0
      errors/warnings
- [x] Direct visit to `/account` while signed out redirects to `/login`
- [x] Signup (name/email/password/confirm) succeeds and redirects back to
      `/account` (the page `RequireAuth` sent the visitor from)
- [x] Account page shows a greeting with the first name and an empty
      order-history state for a brand-new account
- [x] Navbar account icon reflects auth state (Log in ↔ Account) after
      signup
- [x] **Logout correctly lands on `/` (not `/login`)** - see Bugs Fixed
      above for how thoroughly this was chased down
- [x] Navbar reverts to the "Log in" icon after logout, and `/account`
      redirects to `/login` again post-logout
- [x] Logging back in with the same credentials succeeds
- [x] Wrong password shows an inline error and stays on `/login`
- [x] Signing up with an already-registered email shows an inline error
- [x] Checkout pre-fills full name and email when signed in
- [x] A placed order while signed in shows up in that account's order
      history afterward
- [x] About page has a working `#story` anchor target and is not the old
      placeholder text
- [x] Contact page is not the old placeholder text
- [x] Contact form validates, shows a loading state, then a success state
- [x] Footer's existing "Our Story" link now actually lands on the story
      section (previously pointed at a placeholder page with no matching
      anchor)
- [x] Visual check via screenshots: Login (light desktop), About (light
      desktop, full page), Contact (light desktop) - all render cleanly
      and consistently with the existing design system
- [x] Regression check: Shop, Cart, Wishlist, Checkout,
      OrderConfirmation, and Home all still work exactly as they did at
      the end of Phase 5

Still needs a human pass:
- [ ] Real browser check on an actual mobile device
- [ ] Content review — About/Contact copy, process steps, and values are
      original but invented for this phase; swap in anything more
      specific to the real brand story whenever that's available
- [ ] Decide whether real password requirements (beyond the current
      6-character minimum) matter before any of this auth flow is treated
      as more than a demo - it explicitly is not production-grade auth,
      see Known Issues

## Known Issues

- **Mock auth is not secure and must not be treated as production-ready.**
  Passwords are stored in plain text in `localStorage`
  (`crafteevee-users`), visible to anyone with access to the browser's
  dev tools or any other script running on the page. This exists purely
  to demonstrate the auth *flow* (forms, validation, session persistence,
  protected routes) for a project with no real backend. If accounts are
  ever meant to be real, this entire provider needs replacing with actual
  server-side authentication - the shape of `useAuth()` was kept simple
  specifically so that swap wouldn't require touching any consuming page.
- **No password reset / "forgot password" flow.** Not in this phase's
  scope; there's also no real email delivery to reset with, so this would
  need a decision about how to fake it (or wait for real accounts).
- **No account editing** - name/email can't be changed after signup, and
  there's no way to delete an account. Not in this phase's scope.
- **Order history is per-browser, per-`localStorage`**, same caveat as
  cart/wishlist from Phases 4-5 - it doesn't sync across devices or
  browsers, since there's no real backend to sync through.
- **The logout race documented under Bugs Fixed is a good example of a
  React Router timing pitfall worth remembering**: don't assume
  `navigate()`'s effects on `useLocation()` consumers are synchronous or
  even resolved within a same-tick `setTimeout`/`flushSync` - if a guard
  component elsewhere in the tree reacts to the same state change that's
  driving the navigation, a real page navigation is the most reliable way
  to guarantee an ordering when client-side routing can't.
- `MAX_QTY` (10, from Phase 4's `CartProvider`) is unchanged and still a
  hardcoded constant - same known limitation as before.
- No test suite yet (unchanged from Phase 1-5 - still slated for Phase
  14... well, whatever the eventual final phase number ends up being).

## Remaining Tasks

- Nothing outstanding for Phase 6 as scoped. The human QA items above are
  worth a pass before calling it fully signed off.

## Next Phase

**Phase 7** — not yet defined/confirmed with the user. Every nav
destination in the app now has real content (Home, Shop, Product Detail,
Cart, Checkout, Order Confirmation, Wishlist, Login, Account, About,
Contact) - Phase 7 is a good point to step back and ask what's actually
still missing versus what's polish. Candidates worth raising: a real test
suite (flagged as outstanding since Phase 1), product search/filtering
refinements, or something entirely new the user has in mind. Do not begin
Phase 7 work until scope is confirmed.

## Context for the Next Claude Session

- **Stack**: unchanged from Phase 1-5 - Vite + React 19 + TypeScript +
  Tailwind v4 (CSS-first config via `@theme` in `src/index.css`) + React
  Router v7 + Framer Motion.
- **Tokens**: unchanged — still all in `src/index.css` under `@theme`. No
  new tokens were added this phase.
- **Product catalog**: unchanged from Phase 4 — `src/data/products.ts`
  exports `ALL_PRODUCTS` (24 items, prices ₱85-₱890).
- **Cart / Wishlist**: unchanged APIs from Phase 4/5 -
  `useCart()`/`useWishlist()`.
- **Auth** (new): `useAuth()` from `@/context/AuthContext` gives you
  `{ user, isAuthenticated, login, signup, logout }`. `user` is
  `{ name, email } | null`. `AuthProvider` is mounted once in `App.tsx` -
  don't mount it again anywhere else.
- **Order history** (new): `getOrdersForUser(email)` /
  `saveOrderForUser(email, order)` from `@/lib/orders`. Called from
  `Checkout.tsx` right after a successful `placeOrder()`, only when
  `user` is truthy.
- **⚠️ Logout gotcha - read before touching auth-related navigation
  again**: any code that needs to navigate away from a `RequireAuth`-
  guarded page *and* change `isAuthenticated` in the same action (i.e.
  logout) must use a real page navigation (`window.location.href = ...`),
  not React Router's `navigate()`. The SPA `navigate()` cannot reliably
  win a race against `RequireAuth`'s own redirect-on-`isAuthenticated`-
  change - confirmed this is true even with `flushSync` or a deferred
  `setTimeout`. See the full writeup under Bugs Fixed above before
  "fixing" this again with a client-side navigate.
- **Routing**: new routes this phase are `/login` and `/account` (the
  latter behind `RequireAuth`). All hang off the same `<Layout />` as
  everything else.
- **Known gotcha (repeated from Phase 1-5)**: lucide-react v1.x has no
  brand icons - use inline SVGs or a generic icon instead. Didn't come up
  this phase (only used existing/common icons plus `User`, `LogOut`,
  `Package`, `Gem`, `Sparkles`, `PackageCheck`, `Truck`, `Sticker`,
  `AtSign`, `Clock`, all standard lucide icons already available).
- **Completed**: full Phase 1 foundation + Phase 2 homepage + Phase 3
  shop + Phase 4 product detail/cart + Phase 5 wishlist and
  cart/checkout/order-confirmation + Phase 6 accounts and real
  About/Contact content, as listed above. Every nav destination now has
  real content - no `PagePlaceholder` usages remain anywhere in the route
  table.
- **Pending**: Phase 7 onward - not yet scoped, confirm with the user
  before starting anything.
- **No known bugs** as of this handoff — production build and lint both
  verified clean, and the one real bug found this session (the logout
  race) was tracked down to its actual root cause and fixed, not just
  patched around. See Known Issues for the full postmortem if a similar
  navigation-timing issue comes up again elsewhere.
