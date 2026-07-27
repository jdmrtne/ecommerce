# CrafteeVee — Phase 7 Handoff: Test Suite

## Progress Summary

**Current completed phase:** Phase 7 — a real automated test suite (scope
confirmed with the user up front: "real test suite", flagged as pending
since Phase 1).

Phase 6 (mock accounts/auth + real About/Contact content) arrived already
complete in the uploaded project zip, including its own
`HANDOFF-PHASE-6.md`. This session verified it (clean install, clean
`vite build`, clean `oxlint`) rather than rebuilding any of it, then
moved straight into Phase 7.

### New features added

- **Vitest test runner**, configured separately from the app's
  `vite.config.ts` (new `vitest.config.ts`, same plugins/alias) so
  test-only settings never touch the production build config.
- **`src/test/setup.ts`** — global test setup: registers
  `@testing-library/jest-dom` matchers and clears `localStorage` after
  every test, since every provider in this app (`CartProvider`,
  `WishlistProvider`, `AuthProvider`) reads/writes it - without this,
  state written in one test would leak into the next.
- **`src/test/utils.tsx`** — `AllProviders` (wraps children in
  `MemoryRouter` + `AuthProvider` + `CartProvider` + `WishlistProvider`,
  matching the nesting `App.tsx` mounts) and `renderWithProviders()`, so
  component/page tests don't each hand-roll the same wrapper.
- **Lib unit tests** (pure functions, no rendering):
  - `src/lib/currency.test.ts` - `formatPHP` peso formatting
  - `src/lib/cn.test.ts` - class merging incl. Tailwind conflict resolution
  - `src/lib/auth.test.ts` - `validateLogin`/`validateSignup`
  - `src/lib/checkout.test.ts` - `validateCheckout` + `placeOrder`
    (shipping-fee threshold, order shape) using fake timers for the
    900ms simulated delay
  - `src/lib/orders.test.ts` - `getOrdersForUser`/`saveOrderForUser`
    localStorage persistence, corrupt-data fallback, per-user isolation
  - `src/lib/productFilters.test.ts` - `filterAndSortProducts` category/
    query filtering and every sort mode, incl. a stable-sort check for
    items missing `salesRank`
- **Context provider tests** (via `renderHook`):
  - `src/context/CartProvider.test.tsx` - add/remove/update, the
    `MAX_QTY` (10) cap, `lines`/`subtotal`/`totalCount` derivations,
    localStorage persistence across remounts, dropping stored items for
    products no longer in the catalog, `useCart` throwing outside its
    provider
  - `src/context/WishlistProvider.test.tsx` - same shape of coverage for
    toggle/remove/clear, `items` join, persistence, catalog-drift
    filtering, `useWishlist` throwing outside its provider
  - `src/context/AuthProvider.test.tsx` - signup/login/logout, duplicate-
    email and wrong-password rejections (case-insensitive email
    matching), session persistence across remounts, using fake timers for
    the 700ms simulated delay
- **Component/page tests** (via Testing Library + `userEvent`, real
  timers):
  - `src/components/auth/RequireAuth.test.tsx` - unauthenticated visitor
    is redirected to `/login`
  - `src/pages/Login.test.tsx` - blank-form validation error, signup →
    successful account creation → redirect to the page `RequireAuth` sent
    the visitor from, mismatched confirm-password inline error, wrong-
    password error against a pre-seeded account, and the login/signup
    mode toggle
- **`npm test`** (single run, used in CI-style checks) and
  **`npm run test:watch`** scripts added to `package.json`.
- **`.oxlintrc.json`** - added a scoped override turning off
  `react/only-export-components` for `src/test/**` only, since
  `src/test/utils.tsx` intentionally exports both a wrapper component
  and a render helper function - that file is never part of the app's
  fast-refresh tree, so the rule doesn't apply there. No other rules or
  scopes changed.

### Bugs found and fixed this session

- **Unhandled-promise-rejection warnings in `AuthProvider.test.tsx`.**
  The duplicate-signup, unknown-login, and wrong-password tests were
  advancing fake timers (`vi.runAllTimersAsync()`) *before* attaching the
  `expect(promise).rejects.toThrow(...)` handler - the promise could
  settle (reject) in that gap, which Vitest correctly flagged as an
  unhandled rejection even though the test itself passed. Fixed by
  creating the `expect(...).rejects` assertion immediately after calling
  `login`/`signup` (before `await vi.runAllTimersAsync()`), so the
  rejection handler is always registered before the promise can settle.
  Verified clean - 0 unhandled-rejection warnings on the full suite
  re-run.

### Improvements made

- None beyond the test suite itself - no application code was changed
  this phase (Phase 6 was received already complete and correct).

## Files

### Created
```
vitest.config.ts
src/
├── test/
│   ├── setup.ts
│   └── utils.tsx
├── lib/
│   ├── currency.test.ts
│   ├── cn.test.ts
│   ├── auth.test.ts
│   ├── checkout.test.ts
│   ├── orders.test.ts
│   └── productFilters.test.ts
├── context/
│   ├── CartProvider.test.tsx
│   ├── WishlistProvider.test.tsx
│   └── AuthProvider.test.tsx
├── components/
│   └── auth/
│       └── RequireAuth.test.tsx
├── pages/
│   └── Login.test.tsx
HANDOFF-PHASE-7.md
```

### Modified
- `package.json` - added `test`/`test:watch` scripts and new
  `devDependencies`: `vitest`, `jsdom`, `@testing-library/react`,
  `@testing-library/jest-dom`, `@testing-library/user-event`.
- `.oxlintrc.json` - added the `src/test/**` override described above.

### Removed
- None.

## Architecture Notes

- **New reusable test utility**: `renderWithProviders()` /
  `AllProviders` in `src/test/utils.tsx` - use this for any future
  component/page test that needs cart, wishlist, or auth context (which
  is most of them, since `App.tsx` mounts all three globally).
- **No state management changes** - Cart/Wishlist/Auth context shapes are
  untouched; tests only exercise the existing public API (`useCart()`,
  `useWishlist()`, `useAuth()`).
- **No API or database changes** - this project has no real backend
  (everything is `localStorage`-backed mocks), so there was nothing to
  test at that layer beyond what `orders.test.ts` and the provider tests
  already cover.
- **Configuration**: `vitest.config.ts` is intentionally a separate file
  from `vite.config.ts` rather than merged via `mergeConfig` - keeps
  test-only settings (jsdom environment, setup files) from ever affecting
  the production build config, mirroring how `tsconfig.app.json` and
  `tsconfig.node.json` are already kept separate in this project.
- **Testing patterns established for future phases**:
  - Pure functions (`src/lib/*`) get plain Vitest unit tests, no
    rendering.
  - Context providers get `renderHook()` tests exercising the public
    hook API directly, not through a consuming component.
  - Pages/components that need real user interaction get
    `@testing-library/user-event` with `renderWithProviders()`.
  - Anything using `setTimeout`-based mock delays (`AuthProvider`,
    `checkout.ts`) uses `vi.useFakeTimers()` +
    `await vi.runAllTimersAsync()` - always attach any
    `expect(promise).rejects...` assertion *before* advancing timers (see
    Bugs Fixed above).

## QA Checklist

Automated (all passing as of this handoff - `npm test`, 11 test files,
77 tests, 0 unhandled errors/warnings):

- [x] `formatPHP` - whole-peso formatting, rounding, zero, thousands
      separators
- [x] `cn` - class joining, falsy-value dropping, Tailwind conflict
      resolution, conditional object syntax
- [x] `validateLogin`/`validateSignup` - every required-field and format
      error path, including the exact minimum password length
- [x] `validateCheckout` - every required field, notes optional
- [x] `placeOrder` - standard vs. free shipping fee, order number format,
      order line snapshot, shipping details carried through
- [x] `getOrdersForUser`/`saveOrderForUser` - empty state, corrupt-JSON
      fallback, non-array fallback, save+retrieve, most-recent-first
      ordering, case-insensitive email keys, per-user isolation
- [x] `filterAndSortProducts` - category filter, "all" category, name and
      category query matching, whitespace/empty query handling, combined
      filters, every sort mode (`price-asc`/`price-desc`/`newest`/
      `best-selling`/`featured`), stable-sort behavior for items without
      `salesRank`, non-mutation of the input array
- [x] `CartProvider` - empty start, add (new + existing item), `MAX_QTY`
      cap on both add and update, remove, quantity-to-zero removal,
      clear, `lines`/`subtotal`/`totalCount` derivations, localStorage
      persistence across remounts, catalog-drift filtering,
      `useCart`-outside-provider error
- [x] `WishlistProvider` - same shape of coverage as CartProvider above
- [x] `AuthProvider` - signed-out start, signup success + session write,
      duplicate-email rejection (case-insensitive), login success after
      signup, unknown-email rejection, wrong-password rejection, logout
      clearing user + session key, session restore across remounts
- [x] `RequireAuth` - unauthenticated visitor redirected to `/login`
- [x] `Login` page - blank-form validation error, mode toggle (login ↔
      signup) with error state reset, full signup flow ending in
      redirect, mismatched-confirm-password inline error, wrong-password
      error against a pre-seeded account
- [x] `npm run build` succeeds (`tsc -b && vite build`)
- [x] `npx oxlint src` reports 0 errors/0 warnings

Still needs a human pass:
- [ ] No coverage tool is wired up yet (`@vitest/coverage-v8` not
      installed) - line/branch coverage numbers aren't available, only
      "which behaviors are tested" as listed above
- [ ] No tests yet for: `Shop`/`ProductDetail`/`Cart`/`Checkout`/
      `OrderConfirmation`/`Wishlist`/`Account`/`About`/`Contact` pages,
      `Navbar`, or any `components/ui/*` primitives - this phase
      prioritized the highest-risk logic (auth, cart/wishlist state,
      checkout math, product filtering) over exhaustive page coverage;
      see Remaining Tasks
- [ ] No CI workflow wired up to run `npm test` automatically on push/PR
      (no `.github/workflows/` in this project yet)
- [ ] Real browser check on an actual mobile device (carried over from
      Phase 6, still outstanding - unrelated to this phase's test work)

## Known Issues

- Nothing new introduced this phase. All Known Issues from
  `HANDOFF-PHASE-6.md` (mock auth is not production-secure, no password
  reset, no account editing, per-browser order history, the
  logout-navigation gotcha, hardcoded `MAX_QTY`) are unchanged and still
  apply - see that file for the full detail if needed.
- The Login page tests use real timers (not fake ones) and wait out the
  actual 700ms `AuthProvider` delay via `waitFor`/`findBy*` - this makes
  those four tests the slowest in the suite (~400-1200ms each vs. single-
  digit ms for everything else). Acceptable for a suite this size (whole
  run is ~3.5s of actual test time); worth switching to fake timers with
  `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` if the
  suite grows large enough for this to matter.

## Remaining Tasks

- Nothing outstanding for Phase 7 as scoped (a real test suite now
  exists and is passing). Coverage is deliberately concentrated on
  state/logic rather than every page - broadening to page-level tests for
  Shop/Checkout/Account/etc., adding `@vitest/coverage-v8` for numeric
  coverage, and/or wiring a CI workflow are natural follow-ups but were
  not part of this phase's confirmed scope.

## Next Phase

**Phase 8** — not yet defined/confirmed with the user. Worth raising:
broader page-level test coverage (Shop, Checkout, Account, Cart flows),
wiring `npm test` into a CI workflow, adding coverage reporting, or
something new the user has in mind. Do not begin Phase 8 work until
scope is confirmed.

## Context for the Next Claude Session

- **Stack**: unchanged from Phase 1-6 - Vite + React 19 + TypeScript +
  Tailwind v4 (CSS-first config via `@theme` in `src/index.css`) + React
  Router v7 + Framer Motion. Testing stack (new): Vitest 4 + jsdom +
  `@testing-library/react` + `@testing-library/jest-dom` +
  `@testing-library/user-event`.
- **Running tests**: `npm test` (single run) or `npm run test:watch`
  (watch mode). Config is `vitest.config.ts` at the project root; global
  setup is `src/test/setup.ts`.
- **Writing new tests**: use `renderWithProviders()` from
  `@/test/utils` for anything needing Cart/Wishlist/Auth context or
  routing. Follow the established patterns (see Architecture Notes
  above) - plain unit tests for `src/lib/*`, `renderHook()` for
  contexts, `userEvent` + real timers for interactive pages.
- **The `deleted node_modules`/`dist` folders were stripped before
  zipping this deliverable** (standard practice for this project's
  handoffs) - run `npm install` before `npm test`/`npm run build`/
  `npm run dev` in the next session.
- **Completed**: full Phase 1 foundation + Phase 2 homepage + Phase 3
  shop + Phase 4 product detail/cart + Phase 5 wishlist and
  cart/checkout/order-confirmation + Phase 6 accounts and real
  About/Contact content + Phase 7 test suite (77 tests, 11 files), as
  listed above.
- **Pending**: Phase 8 onward - not yet scoped, confirm with the user
  before starting anything.
- **No known bugs** as of this handoff - production build, lint, and the
  full test suite are all verified clean. The one issue found this
  session (unhandled-rejection warnings in three `AuthProvider` tests)
  was a test-code timing issue, not an application bug, and was fixed by
  reordering when the rejection assertion is attached relative to
  advancing fake timers.
