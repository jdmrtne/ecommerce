# Changelog

All notable changes to this project are documented here, one entry per
phase. See `docs/MASTER_HANDOFF.md` for full current-state documentation
and `docs/ROADMAP.md` for what's next. This file now lives in `docs/`
alongside those two — the root-level copy has been replaced with a
pointer.

## Phase 30 — Customers

Admin-facing customer management, distinct from the account-holder's own
`/account` self-service view. Read-only: an admin can browse the
registered customer list and drill into one account's full order
history, but not edit/deactivate an account or change its role from
this UI.

### Added
- `hooks/useCustomers.ts` — same `{ data, status, reload }` shape as
  `useProducts()`/`useOrders()`, wrapping `apiGetCustomers()`
  (`lib/api/auth.ts` plumbing added in Phase 25, unused by any UI until
  now).
- `pages/admin/Customers.tsx` (`/admin/customers`) — list of every
  registered account, with client-side search (name/email) and a role
  filter, each row linking to that customer's detail page.
- `pages/admin/CustomerDetail.tsx` (`/admin/customers/:email`) — one
  account's profile fields (name/email/role) plus its full order
  history, reusing `hooks/useOrders.ts` (Phase 28) exactly as
  `Account.tsx` does for a signed-in customer's own view — just pointed
  at another account's email. The route param is the customer's
  URL-encoded email, since `AuthUser` has no id field to route on.
- `supabase/schema.sql`: two new admin-read RLS policies — "Admins can
  read every profile" (`profiles`) and "Admins can read every order"
  (`orders`). Without them, an admin's `apiGetCustomers()`/
  `apiGetOrdersForUser(otherEmail)` calls would have silently returned
  nothing against a real Supabase project, since both tables' prior
  policies only ever let a signed-in user read their own row. The
  `profiles` policy is self-referencing (a `profiles` policy whose check
  queries `profiles`) — safe here, since the subquery only ever needs to
  see the *caller's own* row to confirm `role = 'admin'`, and that row
  is already visible to them via the existing owner-only select policy
  (permissive policies on the same table are combined with OR).
  **Jude needs to run the updated schema once**, same as Media/Inventory
  before it — additive and safe to re-run.
- `config/adminNav.ts` gained a "Customers" entry; `App.tsx` registers
  both new routes under the existing `/admin` route tree.
- `content/states.ts`/`config/site.ts` gained matching empty/error/
  not-found copy and page-meta entries for both new pages.
- New test files: `hooks/useCustomers.test.ts`, `pages/admin/
  Customers.test.tsx`, `pages/admin/CustomerDetail.test.tsx`.

### Known Issues carried forward
- No create/edit/delete of a customer account or its role from this UI
  — out of this phase's scope.
- The list shows no order count/lifetime spend per row, to avoid an N+1
  fetch (one `orders` query per customer) on a page that's otherwise a
  single `apiGetCustomers()` call; order history is one click away on
  the detail page instead.

### QA
- `tsc -b`, `vite build`, `npx oxlint src`, and `npm test` (488/488
  tests, 77 files) all pass clean.

## Phase 29 — Inventory

Real stock tracking, replacing the hardcoded `MAX_QTY` cart cap:
`Product.stock` (present on the type since an earlier phase, but
"architecture only" until now) is wired all the way through Product
Manager → the storefront → checkout → an atomic backend decrement.
`undefined` stock still means untracked/unlimited, not 0 - a
white-label store that doesn't set it anywhere sees no behavior change.

### Added
- `lib/inventory.ts` - pure, shared stock helpers: `isStockTracked`,
  `availableStock`, `isOutOfStock`, `isLowStock`,
  `maxPurchasableQuantity` (accounts for quantity already in the cart),
  `checkStockForLines` (the pre-checkout gate), and the
  `MAX_CART_QTY`/`LOW_STOCK_THRESHOLD` constants.
- `supabase/schema.sql`: `orders_decrement_stock` trigger
  (`security definer`, `after insert on orders`) - the actual atomic
  guarantee against overselling. Row-locks each order line's product,
  re-checks stock, raises (rolling back the whole order) if
  insufficient, decrements if not - all inside the order insert's own
  transaction, so concurrent checkouts for the last unit serialize on
  the lock instead of both succeeding. **Jude needs to run the updated
  schema once**, same as the Media backend phase; it's additive and
  safe to re-run.
- Low/out-of-stock UI: an "Out of stock" badge on `ProductCard.tsx`
  (dimmed image); a matching badge plus a low-stock note and a
  stock-capped Add-to-cart on `ProductDetail.tsx`; per-line
  out-of-stock/low-stock/"only N available" notes and a
  stock-capped quantity stepper on `Cart.tsx`, which also disables
  "Proceed to checkout" while any line exceeds live stock; an itemized
  inline alert on `Checkout.tsx` if a final live-stock re-check right
  before submit finds a line that no longer fits, with a link back to
  `/cart`.
- `ProductManager.tsx`'s existing Stock field gains real validation
  (must be a non-negative whole number when provided) and clarified
  hint text; the product list rows now show an in-stock/out-of-stock
  count.
- New test files: `lib/inventory.test.ts`, `pages/Cart.test.tsx`.

### Changed
- `CartProvider.tsx` now imports its quantity cap (`MAX_CART_QTY`) from
  `lib/inventory.ts` instead of a private local constant - same value,
  same behavior, single source of truth shared with the real stock
  ceiling. It still doesn't fetch the live catalog itself (no access to
  it at that layer); the pages that already hold live product data
  (`ProductDetail`, `Cart`, `Checkout`) are what actually enforce real
  stock limits.
- `productValidation.ts` gained an optional `stock` field/error.
- `types/product.ts`'s doc comment on `stock` updated to reflect that
  it's now load-bearing, not architecture-only.
- `pages/ProductDetail.test.tsx`, `pages/Checkout.test.tsx`, and
  `lib/productValidation.test.ts` gained stock-aware test cases
  (low-stock note + capped stepper, out-of-stock disable, stock-
  exhausted checkout blocked with an itemized error vs. normal
  placement, stock validation).

### Known Issues carried forward
- `CartProvider.tsx` still joins cart lines from the static
  `ALL_PRODUCTS` catalog for price/name/image (pre-existing, see
  `MASTER_HANDOFF.md`) - this phase worked around that gap rather than
  closing it, by having the pages that need fresh stock fetch it
  themselves at the moments that matter (add, adjust quantity, submit).
- The `orders_decrement_stock` trigger is SQL, not exercised by the JS
  test suite - same pattern as this project's RLS policies. Needs
  manual verification against a real Supabase project.
- No stock-change audit trail or admin restock notification; out of
  this phase's scope.

### QA
- `tsc -b`, `vite build`, `npx oxlint src`, and `npm test` (475/475
  tests, 74 files) all pass clean.

## Media (Backend-Integrated)

Requested directly (not the next `ROADMAP.md` phase, which remains 29 —
Inventory): admin-uploaded images were still on Phase 24's stopgap store
(`lib/mediaStore.ts`) — base64 data URLs in `localStorage`, capped at
1MB per file and 4.5MB total across every uploaded image site-wide, a
cap that had nothing to do with the app and existed only because
`localStorage` itself is tiny. This phase moves uploads to a real,
public Supabase Storage bucket, removing that total-storage cap
entirely.

### Added
- A public `media` Storage bucket (`supabase/schema.sql`) — publicly
  readable, insert/delete restricted to signed-in admins via
  `storage.objects` RLS policies, same admin-role check every other
  write-gated table already uses.
- `lib/api/media.ts` — `apiListMedia`/`apiUploadMedia`/`apiDeleteMedia`
  against that bucket, same `client` parameter/test-injection shape as
  every other `lib/api/*` module.

### Changed
- `hooks/useMediaAssets.ts` rewritten as an async, backend-integrated
  hook (`loading`/`success`/`error` status, re-fetch after
  upload/remove) — same shape as `useProducts()`. `AssetPicker` and
  `MediaManager` updated to match: images render from a public URL
  (`asset.url`) instead of a `dataUrl`, and both show real loading/error
  states instead of assuming synchronous local reads.
- **The 4.5MB total-storage budget is gone** — real object storage has
  no equivalent app-level cap to enforce. A generous 10MB **per-file**
  guard remains client-side (`MAX_ASSET_SOURCE_BYTES` in
  `useMediaAssets.ts`) purely to catch an obviously-wrong upload, not as
  an architecture limit; Supabase's own project-level upload ceiling
  (50MB by default, raisable in Dashboard → Storage → Settings) is the
  real backstop above that.
- `src/test/fakeSupabaseAuth.ts` gained an in-memory `.storage.from("media")`
  fake alongside its existing table fakes, so every test that renders
  `AssetPicker`/`MediaManager` (via the shared global `supabase` mock)
  works with no network, same as the rest of the app.

### Removed
- `lib/mediaStore.ts` and its test file — fully superseded by
  `lib/api/media.ts`. No data migration path from old
  `localStorage`-stored images: any images an admin uploaded under
  Phase 24's version need re-uploading once against the new bucket
  (expected to be few, since Phase 24 was explicitly a pre-backend
  stopgap for exactly this eventuality).

### QA
- `tsc -b`, `vite build`, `npx oxlint src`, and `npm test` (445/445
  tests, 72 files) all pass clean.

## Bug Fix — Product Detail Image Missing / Added Full-Size Lightbox

Reported against the deployed build: a product with a real uploaded
image (e.g. an admin-added photo, as opposed to the seed catalog's
image-less placeholders) showed correctly in the Shop grid and search
results (`ProductCard.tsx` already handled this), but the image
disappeared entirely on that same product's detail page, replaced by
the generic `CraftIcon` illustration - `ProductDetail.tsx` never
checked `product.images?.[0]` at all, unlike `ProductCard`.

### Fixed
- `pages/ProductDetail.tsx` now renders the real image when
  `product.images?.[0]` exists, falling back to `CraftIcon` only when a
  product genuinely has no image - matching `ProductCard.tsx`'s existing
  behavior.

### Added
- The detail-page image is now clickable, opening a lightbox (reusing
  the existing `components/ui/Modal.tsx`) that shows the same image
  uncropped at its true aspect ratio (`object-contain`), rather than the
  square-cropped (`object-cover`) framing used for grid-tile consistency
  on the page itself. A "View full size" hint with an `Expand` icon
  appears on hover/focus.
- Tests in `pages/ProductDetail.test.tsx` covering: the real image
  rendering when present, the lightbox opening on click with the
  uncropped image, and the `CraftIcon` fallback for an image-less
  product.

### Known Issues (related, not fixed here)
- `components/cart/CartDrawer.tsx` and `pages/Cart.tsx` have the same
  underlying gap - both always render `CraftIcon` for a cart line item,
  never `line.product.images?.[0]`, even when a real image exists. Not
  in scope for this fix (which was reported specifically against the
  product detail page); worth the same treatment in a future pass.

## Merge — Deployed Build (Settings Sync)

This entry documents a merge between this project's phase-tracked
codebase (through Phase 28) and a separately-deployed build the user had
put on Vercel. The deployed build was based on the Phase 27 codebase but
included one feature built outside the numbered phase sequence, with no
`ROADMAP.md`/`CHANGELOG.md` entry of its own — recorded here now so the
docs match what's actually shipped. The deployed build's version of
every other file was identical to this project's own Phase 27 output, so
nothing else needed reconciling; Phase 28 (below) was then layered back
on top of the merged result.

### Added
- **Settings sync.** A new `site_settings` table (`supabase/schema.sql`)
  — a generic key/value store, one row per settings group
  (`"theme"`/`"store"`/`"homepage"`), each holding that group's own
  override object as a `jsonb` blob — plus `lib/api/settings.ts`
  (`apiGetSetting()`/`apiSaveSetting()`) and `lib/settingsSync.ts`
  (`syncSettingsFromServer()`, called once at boot from `main.tsx` right
  after the existing synchronous `applyPreset(resolveActivePreset())`
  call). `lib/themeSettingsStore.ts`, `lib/storeSettingsStore.ts`, and
  `lib/homepageSettingsStore.ts` were each updated to read/write through
  this instead of `localStorage` alone, so an admin's Theme/Store
  Settings/Homepage Editor save now syncs to other devices/browsers, not
  just the one that saved it. RLS on `site_settings` matches
  `products`': public read, admin-only insert/update.
- `vercel.json` — SPA rewrite config (`/(.*) → /index.html`) needed for
  client-side routing on Vercel's static hosting.
- `src/test/fakeSupabaseAuth.ts` gained a `site_settings` table
  alongside `products`/`orders` to back the above in tests.

### Known Issues
- Settings sync covers only Theme/Store Settings/Homepage — Navigation,
  Footer, Policies, and Media settings are all still `localStorage`-only
  and don't sync across devices. Not addressed by this feature's scope.
- Two unreferenced data files (`data/contact-content.ts`,
  `data/home-content.ts`) and one unused, long-superseded file
  (`config/homepageLayouts.ts`, replaced by `config/layouts/home.ts` back
  in Phase 11) were present in the deployed build with no importers
  anywhere. Left in place rather than removed as part of this merge —
  see `MASTER_HANDOFF.md` Known Issues.

## Phase 28 — Orders (Backend-Integrated)

### Added
- `hooks/useOrders.ts` — reactive hook fetching a signed-in user's order
  history from the real backend via `lib/api/orders.ts`'s
  `apiGetOrdersForUser()`. Mirrors `useProducts.ts`'s (Phase 27)
  `{ data, status, reload }` shape for an async list read; unlike
  `useProducts`, there's no `save`/`remove`, since orders are insert-only
  from Checkout.
- `ERROR_STATES.orders` in `content/states.ts` — copy for a failed
  order-history fetch on `/account`.
- `orders` table support in `src/test/fakeSupabaseAuth.ts` (the shared
  in-memory backend fake every test gets via `src/test/setup.ts`), with
  no seed data — an order only ever exists once a real checkout creates
  one, unlike the `products` table's static seed.
- Tests: `src/pages/Checkout.test.tsx` and `src/pages/Account.test.tsx`
  (neither existed before this phase) covering a signed-in order write
  reaching the backend, an inline error on a failed write, a signed-in
  order-history loading/empty/error/success cycle, and confirming a
  guest checkout does not write to the backend.

### Changed
- `lib/checkout.ts`'s `placeOrder()` (a fake `setTimeout`-wrapped
  simulation of network latency) is replaced with a synchronous
  `buildOrder()` — pure order-object construction with no artificial
  delay, since real latency now comes from the real API call for a
  signed-in checkout.
- `pages/Checkout.tsx` — `handleSubmit` now calls
  `apiSaveOrderForUser()` (Phase 25 plumbing, not previously called from
  the UI) to write the built order to the real `orders` table whenever
  someone's signed in, instead of the old simulated `placeOrder()` +
  `localStorage`-backed `saveOrderForUser()`. A failed write shows an
  inline error message and leaves the cart/form intact (no clear, no
  navigate) so the shopper can retry — the same per-action
  try/catch-with-inline-error shape `ProductManager.tsx` (Phase 27)
  established. Guest checkout (nobody signed in) is otherwise unchanged.
- `pages/Account.tsx` — order history now reads through `useOrders()`
  instead of a direct, synchronous `getOrdersForUser()` `localStorage`
  read; the page has its own loading skeleton (reusing `Skeleton`) and
  `ErrorState`-with-retry around the order list.
- `pages/OrderConfirmation.tsx` — doc comment updated only; the page is
  structurally unchanged (still a one-time receipt read from router
  location state, not re-fetched), but for a signed-in checkout the
  order it renders is now the exact record that was just written to the
  real backend, since Checkout only navigates here after that write
  succeeds.
- `lib/orders.ts` (the pre-backend `localStorage` order store) — doc
  comments updated to mark both functions deprecated; `saveOrderForUser`
  is no longer called by `Checkout.tsx`. Kept only because
  `lib/adminStats.ts`'s dashboard order count still reads
  `getOrdersForUser()` (out of this phase's scope — see Known Issues).
- `src/lib/checkout.test.ts` — rewritten for the new synchronous
  `buildOrder()`; the fake-timer plumbing (`vi.useFakeTimers()`/
  `vi.runAllTimersAsync()`) the old async `placeOrder()` tests needed is
  gone.
- `src/components/contact/ContactDetails.tsx` — stale doc-comment
  reference to `Checkout`'s (now-removed) `placeOrder()` updated; the
  contact form's own simulated-latency pattern is unaffected.

### Known Issues
- Guest checkout still doesn't persist an order anywhere. The `orders`
  table's RLS insert policy (`supabase/schema.sql`, unchanged this
  phase) only allows a signed-in user to insert a row for their own
  email, so there's nowhere for an unauthenticated write to go — the
  same guest limitation the pre-Phase-28 `localStorage` version had, now
  enforced by the database instead of by `Checkout.tsx` choosing not to
  call a local write. Not addressed by this phase's scope.
- `lib/adminStats.ts`'s dashboard order count still reads the deprecated
  `lib/orders.ts` `localStorage` store, not the real backend — this
  phase's scope was Checkout/Account only, not the admin dashboard. Same
  pattern Phase 27 left for the product/category counts.

## Phase 27 — Products (Backend-Integrated)

### Added
- `supabase/seed_products.sql` — seeds a fresh Supabase project's
  `products` table with the template's existing 24-product placeholder
  catalog. Generated directly from `data/products.ts`'s `ALL_PRODUCTS` so
  the two stay in sync; idempotent (`on conflict (id) do update`).
- Admin-only RLS write policies (`insert`/`update`/`delete`, gated on the
  signed-in user's own `profiles.role = 'admin'`) on `supabase/schema.sql`'s
  `products` table, replacing the Phase 25 placeholder comment that left
  writes ungated pending this phase.
- `lib/productsStore.ts`'s `deriveFeaturedProducts()`/`deriveBestSellers()`/
  `deriveNewArrivals()` — pure functions applying the same
  featured/best-seller/new-arrival rules `data/products.ts`'s
  `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS` use, but re-derivable
  from *any* product list so the homepage sections can re-derive from
  whatever the API just returned instead of a static export.
- `getCachedProducts()`/`setProductsCache()` in `lib/productsStore.ts` — a
  small in-memory (not `localStorage`; doesn't survive a reload) product
  cache. Deprecated on arrival: it exists only so
  `lib/adminStats.ts`/`lib/categoriesStore.ts` (both still synchronous,
  since Category Manager isn't backend-integrated yet) keep working
  without this phase also having to migrate Category Manager. Starts
  seeded with the static catalog, overwritten with real data the first
  time any page fetches it. See Known Issues.
- `src/test/fakeSupabaseAuth.ts` — the shared in-memory backend fake
  every test file gets (see Phase 26) now also serves a `products` table,
  seeded from `ALL_PRODUCTS`, with the same `select().order()`/
  `select().eq().maybeSingle()`/`upsert().select().single()`/
  `delete().eq()` shape `lib/api/products.ts` calls against it.
- Tests: `src/pages/Shop.test.tsx` and `src/pages/ProductDetail.test.tsx`
  (neither existed before this phase) covering loading/success/error
  states against the (mocked) real API client, plus an equivalent error-
  state case added to `src/pages/admin/ProductManager.test.tsx`.

### Changed
- `hooks/useProducts.ts` rewritten to be async: reads/writes go through
  `lib/api/products.ts` (`apiGetProducts`/`apiSaveProduct`/
  `apiDeleteProduct`) against the real backend, exposing
  `{ products, status, reload, save, remove }` instead of the old
  synchronous `{ products, isOverridden, save, remove, reset }`. Used by
  `pages/admin/ProductManager.tsx`.
- `pages/admin/ProductManager.tsx` — list now has its own loading/error
  state (skeleton rows / `ErrorState` with retry, sourced from
  `ERROR_STATES.adminProducts`); "Reset to defaults" is removed (no
  static default to reset to once the catalog is in the database); save
  and delete are `async`, each showing an inline error message in its
  modal on failure rather than silently no-oping.
- `pages/Shop.tsx` — the simulated `fetchProducts()` wrapper (a
  `setTimeout` around `resolveAllProducts()`) is replaced with a real
  `apiGetProducts()` call; the loading/error UI around it needed no
  changes.
- `pages/ProductDetail.tsx` — same swap for `fetchProductById()`, now
  `apiGetProducts()` (fetching the whole catalog, same as before, so
  "related products" can still be derived from the same response) with
  the match done client-side by id.
- `components/home/FeaturedProducts.tsx`/`BestSellers.tsx`/
  `NewArrivals.tsx` — each now fetches the live catalog itself via
  `apiGetProducts()` and re-derives its list with the new
  `deriveFeaturedProducts()`/`deriveBestSellers()`/`deriveNewArrivals()`
  helpers, rather than reading a synchronously-resolved catalog at
  render time. Each section always renders its outer `<section>`
  (skeleton while loading, `ErrorState` with retry on failure) so a
  failed/slow product fetch degrades that one section instead of hiding
  it or breaking layout — and so `Home.test.tsx`'s section-count
  assertion, which runs synchronously right after render, is unaffected
  by the fetch being in flight.
- `lib/adminStats.ts`'s `productCount` and
  `lib/categoriesStore.ts`'s `countProductsInCategory()` now read
  `productsStore.ts`'s deprecated in-memory cache instead of the removed
  `resolveAllProducts()`. Both stay synchronous on purpose — see Known
  Issues.

### Removed
- `lib/productsStore.ts`'s entire Phase 19 `localStorage` override layer:
  `saveProductOverride`, `deleteProductOverride`, `resetProductsOverride`,
  `getProductsOverride`, `resolveAllProducts`, `resolveProductById`,
  `resolveFeaturedProducts`, `resolveBestSellers`, `resolveNewArrivals`,
  and `PRODUCTS_CHANGE_EVENT`. The product catalog now lives in the
  backend; nothing in the app persists a product edit to `localStorage`
  anymore.
- Product Manager's "Reset to defaults" button/behavior (see Changed).

### Known Issues
- `lib/adminStats.ts`'s dashboard product count and
  `lib/categoriesStore.ts`'s `countProductsInCategory()` (the Category
  Manager delete-guard) read a deprecated, non-persistent in-memory
  cache rather than the live backend, since Category Manager itself
  isn't backend-integrated yet (tracked for whichever future phase does
  that). The cache is accurate once any page has fetched the real
  catalog this session (Shop, Product Manager, ProductDetail, or a
  homepage product section), but starts seeded with the static
  placeholder catalog as a bootstrap default before that — so, e.g., a
  freshly-loaded `/admin` dashboard with no prior product fetch this
  session could show a stale count until some other page loads live
  data. Not a correctness issue for the real storefront/admin flows
  (which all fetch live data), just a known gap in these two read-only,
  out-of-scope call sites.

## Phase 26 — Authentication (Backend-Integrated)

### Added
- `src/test/fakeSupabaseAuth.ts` — an in-memory fake of Supabase Auth
  plus the `profiles` table, exported as a shared `fakeSupabase`
  singleton. Globally mocked in via `src/test/setup.ts` (replacing
  `@/lib/api/client`'s `supabase` export for every test file) since
  `AuthProvider` is now mounted by dozens of unrelated component tests
  (anything using `renderWithProviders`), not just its own — a real
  in-memory backend across a whole journey (signup, persisted session,
  login, logout) rather than `mockSupabaseClient.ts`'s one-canned-
  response-per-test shape.
- `AuthContext`'s `isInitializing` field — true until the initial
  Supabase session check resolves. `RequireAuth`/`RequireAdmin` wait on
  it before judging `isAuthenticated`/`role`, showing `LoadingState`
  meanwhile, so an already-signed-in visitor loading `/account` or
  `/admin` directly on a hard refresh isn't judged "signed out" before
  the real (async) session check has had a chance to answer.

### Changed
- `AuthProvider.tsx` rewritten to call Phase 25's `apiLogin`/`apiSignup`/
  `apiLogout`/`apiGetCurrentUser` (`lib/api/auth.ts`) against the real
  `supabase` singleton, replacing the Phase 6 mock's `localStorage` user
  table + plaintext passwords entirely. Also subscribes to
  `supabase.auth.onAuthStateChange` for `SIGNED_OUT` events (e.g. a
  session revoked or expired in another tab) — deliberately *not*
  `SIGNED_IN`, since `login`/`signup` already set `user` themselves once
  their own work is complete; reacting to `SIGNED_IN` here too raced
  against signup's own profile-row insert (Supabase fires the event
  before the app has had a chance to create that row) and could clobber
  the correct freshly-signed-up user with a false "no profile found"
  `null`.
- `AuthContext.ts`'s `logout` is now `logout: () => Promise<void>` (a
  real `signOut()` network call, not a synchronous mock). Every call
  site (`Account.tsx`, `AdminLayout.tsx`, `Navbar.tsx`) now `await`s it
  before its `window.location.href` hard navigation, so the sign-out
  request can't be aborted by the page unload before it reaches
  Supabase.
- `RequireAuth.tsx`/`RequireAdmin.tsx` now check `isInitializing` first
  (see Added, above) before deciding to redirect or render.
- `src/test/setup.ts` mocks `@/lib/api/client` globally (see
  `fakeSupabaseAuth.ts` above) and resets the fake between tests
  alongside the existing `localStorage.clear()`.
- `AuthProvider.test.tsx`, `RequireAdmin.test.tsx`, `Login.test.tsx`,
  `RequireAuth.test.tsx` rewritten/updated to seed and assert through
  the fake Supabase backend instead of writing directly to
  `localStorage`, and to `await`/`findBy`/`waitFor` state that's now
  async instead of assuming synchronous availability.

### Fixed
- No admin bootstrapping path existed against a real backend (the old
  mock auto-seeded a fixed admin login on first read — meaningless
  against Supabase, where a project owner provisions accounts). README's
  Backend section now documents the manual step (sign up normally, then
  flip that account's `profiles.role` to `admin` in the Supabase
  dashboard).

### Known Issues (see `MASTER_HANDOFF.md` for full detail)
- `AuthProvider`'s initial session check is async and only
  `RequireAuth`/`RequireAdmin` wait for it — `Checkout.tsx`'s account
  pre-fill and `Navbar`'s account-menu-vs-Login-link can briefly render
  signed-out on a hard refresh before flipping to signed-in.
- `lib/adminStats.ts`'s admin customer count still reads the old mock's
  `lib/userStore.ts`, disconnected from real Supabase signups — awaits
  Phase 30 (Customers).
- No password reset / account editing / deletion UI yet, though
  Supabase Auth supports all three.

---

## Phase 25 — Backend Integration

### Added
- Backend decision (per `ROADMAP.md`'s "confirmed with the user before
  implementation" rule): **Supabase** (Postgres + Auth), confirmed by the
  project owner along with the project's own URL + anon/publishable key.
- `src/lib/api/client.ts` — the Supabase client singleton. Reads
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; warns (doesn't throw)
  when they're missing, since this file is imported transitively by
  every other `lib/api/*` module and a hard failure there would break
  test collection or the whole app before `.env` is even configured.
- `src/lib/api/types.ts` — row contracts (`ProductRow`, `CategoryRow`,
  `OrderRow`, `ProfileRow`) matching `supabase/schema.sql`, plus
  `mapXRow()`/`toXRow()` functions translating to/from this app's
  existing camelCase model types (`Product`, `Category`, `Order`,
  `AuthUser`). Every `lib/api/*` module maps at its own boundary, so
  nothing above the API layer ever sees a raw snake_case row.
- `src/lib/api/products.ts`, `categories.ts` — `apiGetProducts`/
  `apiGetProductById`/`apiSaveProduct`/`apiDeleteProduct` and their
  category equivalents, matching `productsStore.ts`/`categoriesStore.ts`'s
  `resolveX`/`saveXOverride`/`deleteXOverride` function shapes 1:1 (`api`-
  prefixed), backed by the `products`/`categories` tables instead of
  `localStorage`.
- `src/lib/api/orders.ts` — `apiGetOrdersForUser`/`apiSaveOrderForUser`,
  matching `lib/orders.ts`'s `getOrdersForUser`/`saveOrderForUser`.
- `src/lib/api/auth.ts` — `apiLogin`/`apiSignup`/`apiLogout`/
  `apiGetCurrentUser`, matching `AuthProvider.tsx`'s mock `login`/
  `signup`/`logout` shapes, backed by Supabase Auth plus a `profiles`
  table row (name/role - fields `auth.users` doesn't have) read/written
  alongside every call. Also `apiGetCustomers`, matching `userStore.ts`'s
  `getRegisteredUsers()`, for a future admin customer list.
- `src/lib/api/index.ts` — barrel export for the whole layer.
- `supabase/schema.sql` — table definitions for `profiles`/`products`/
  `categories`/`orders`, matching `types.ts`'s row shapes exactly. Row
  Level Security enabled on every table: public read for the catalog
  (products/categories), owner-only read/write for profiles/orders (via
  `auth.uid()`/`auth.jwt() ->> 'email'`). No write policy yet for
  products/categories - deliberately left to the dashboard/service-role
  until a future phase actually migrates an admin editor onto these
  tables, so writes aren't opened to the anon key prematurely.
- `.env.example` (committed template) and `.env` (the project owner's
  actual Supabase URL + anon key, gitignored) — `src/vite-env.d.ts`
  types both as `ImportMetaEnv` fields.
- `.gitignore` — the project had none; added one covering `node_modules/`,
  `dist/`, and every `.env*` variant except `.env.example`.
- `README.md` — new "Backend (Supabase)" section: setup steps (copy
  `.env.example`, run `supabase/schema.sql`, optional Supabase CLI for
  fully-local dev), and a map of where everything lives.
- `src/test/mockSupabaseClient.ts` — `chainableResult()`, a reusable fake
  of Supabase's chainable query builder (same "thenable at any point in
  the chain" behavior as the real one) and `createMockSupabaseClient()`,
  a fake `SupabaseClient` with overridable `.auth` methods. Shared by
  every `lib/api/*.test.ts` file.
- Tests: `src/lib/api/products.test.ts`, `categories.test.ts`,
  `orders.test.ts`, `auth.test.ts` (25 tests total) — success path,
  not-found/empty-result path, and Supabase-error-message-propagates
  path for every exported function, all against the mock client above
  (no real network or env vars touched).

### Changed
- Nothing existing changed behavior - this phase is plumbing only, per
  its own completion criteria. No component imports `lib/api/` yet;
  `AuthProvider`, `productsStore.ts`, `categoriesStore.ts`, and
  `lib/orders.ts` are all untouched. Confirmed via unchanged production
  bundle size (`vite build` output is byte-for-byte the same JS size as
  before this phase - the whole `lib/api/` tree tree-shakes out since
  nothing imports it).
- `package.json` — added `@supabase/supabase-js`.

### Verified
- `tsc -b`, `vite build`, `oxlint src` clean.
- `npm test` — 437/437 tests passing across 67 files (up from 412/63
  before this phase).

## Phase 24 — Media Manager

### Added
- `src/lib/mediaStore.ts` — the Phase 24 asset store: a basic pre-backend
  asset manager storing uploads as base64 data URLs in `localStorage`
  (`storageKey("media-assets")`). Unlike every Phase 16-23 override, there
  is no static seed data to layer on top of - every `MediaAsset` was
  created by an admin, so this is a plain persisted list (`getAllAssets()`/
  `addAsset()`/`removeAsset()`), not an `override ?? default` resolver.
  Documents the `localStorage`-over-IndexedDB decision the phase brief
  asked for, and enforces two size guards with a clear returned error
  (not a thrown exception or a silent failure): `MAX_ASSET_SOURCE_BYTES`
  (1MB per original file) and `MAX_TOTAL_MEDIA_BYTES` (4.5MB total,
  measured by the actual stored `dataUrl` length) - both checked before
  `addAsset()` attempts to persist, with a `try/catch` around the
  `localStorage.setItem()` call itself as a last-resort safety net for a
  quota smaller than assumed. Also exports `fileToDataUrl()` (wraps
  `FileReader`) and `formatBytes()` (human-readable size, e.g. "482 KB").
  Dispatches `MEDIA_CHANGE_EVENT` on add/remove for same-tab reactivity.
- `src/hooks/useMediaAssets.ts` — reactive hook wrapping the store, same
  subscription shape (`MEDIA_CHANGE_EVENT` + native `storage` event) as
  every prior editor hook. Returns `assets`, `totalBytes`, `budgetBytes`,
  and `upload(file)`/`remove(id)`; `upload()` combines `fileToDataUrl()` +
  `addAsset()` into one async call.
- `src/components/admin/AssetPicker.tsx` — the reusable "attach an image"
  control: a trigger button (with a small preview of the current value)
  that opens a modal combining an upload dropzone and a grid of every
  previously-uploaded asset. Selecting or uploading calls
  `onSelect(dataUrl)` with the data URL directly, since every field this
  attaches to already stores a plain string URL. Used from Store Settings
  (Logo/Favicon) and Product Manager (a "Browse" button per image row,
  plus an "Add from library" action) - both read/write the same store, so
  an image uploaded from either is immediately available to the other.
- `src/pages/admin/MediaManager.tsx` — the `/admin/media` page: the full
  library view (browse/upload/delete every asset site-wide), with a
  storage-usage bar (`totalBytes`/`budgetBytes`) and a delete-confirmation
  modal. Deliberately separate from `AssetPicker` ("browse and manage
  everything" vs. "pick one image for this field"), sharing the same
  store so neither can drift out of sync with the other.
- `src/config/site.ts`: `PAGE_META.adminMedia` entry.
- `src/config/adminNav.ts`: "Media" flipped from `available: false` to
  `available: true` with `path: "/admin/media"` - the last placeholder
  admin-nav entry from Phase 15 is now wired up.
- `App.tsx`: new `<Route path="media">` under the `/admin` tree.
- Tests: `src/lib/mediaStore.test.ts` (empty-library default; adding and
  persisting a valid asset across a fresh read; rejecting a file over the
  per-file size limit with no persistence side effect; accepting a file
  exactly at the limit; rejecting an asset that would push the running
  total over the media storage budget, with the earlier valid asset left
  untouched; removing an asset by id and a no-op remove for an unknown
  id; `MEDIA_CHANGE_EVENT` dispatched on add/remove but not on a rejected
  upload; corrupted/non-array `localStorage` handled defensively;
  malformed entries filtered out of an otherwise-valid array;
  `formatBytes()` at B/KB/MB scales), `src/hooks/useMediaAssets.test.ts`
  (empty default and documented budget; `upload()` reading a real `File`
  through `FileReader` and re-rendering with it in the same tab;
  `upload()` rejecting an oversized file without adding it; `remove()`
  re-rendering immediately), `src/components/admin/AssetPicker.test.tsx`
  (trigger renders with its label; preview shown only when a value is
  set; opening the modal shows an empty-library state; uploading a valid
  image calls `onSelect` with its data URL and closes the modal;
  uploading an oversized image shows an inline error and keeps the modal
  open; selecting an existing library asset calls `onSelect` and closes;
  deleting a library asset removes it from the grid),
  `src/pages/admin/MediaManager.test.tsx` (page title; empty state;
  listing an asset with its formatted size; uploading via the page-level
  button; an inline error for an oversized upload; delete-confirm and
  delete-cancel flows; the storage-usage fraction display).

### Changed
- `src/lib/storeSettingsStore.ts`: `StoreSettingsOverride` gained
  `logo`/`logoAlt`/`favicon` fields (previously explicitly out of scope -
  Phase 16's original doc comment called them out by name), and
  `resolveBranding()` now resolves all three the same
  `override ?? default` way as every other branding field. `logo`/
  `favicon` values are typically `AssetPicker` data URLs, but a static
  default's imported asset path resolves the same way.
- `src/pages/admin/StoreSettings.tsx`: new "Logo" and "Favicon" fields in
  the Branding card, each an `AssetPicker`, plus a "Logo alt text" input.
  Saved/reset through the same form as every other Store Settings field.
- `src/pages/admin/ProductManager.tsx`: the "Image URLs" list (renamed
  "Images") gained a per-row `AssetPicker` "Browse" button and a page-level
  "Add from library" action, alongside the existing manual URL entry.
- `src/hooks/useSiteMeta.ts`: gained a live favicon swap (writes
  `<link rel="icon">`'s `href` from `resolveBranding().favicon`) on every
  call, matching the title/meta-tag updates it already applied - a Store
  Settings favicon save now takes effect with no reload, the same as
  every other Store Settings field. `index.html`'s static favicon tag is
  unchanged (still synced from `brandingMeta.ts` at build time, for the
  pre-JS instant); this only affects the live DOM once the app has
  mounted, same split the file already used for title/description.
- `src/components/admin/AdminLayout.test.tsx`: the "marks unavailable
  sections as coming soon" test now uses `queryAllByText` instead of
  `getAllByText`, since Media completing this run means `ADMIN_NAV` can
  now have zero unavailable sections (`getAllByText` throws on no match;
  `queryAllByText` doesn't).
- `src/lib/storeSettingsStore.test.ts`: added a case for the new Phase 24
  logo/logoAlt/favicon override fields; corrected a stale comment that
  called `logo` "non-overridable" now that it is.

### Verified
- `tsc -b`, `vite build`, `oxlint src` clean.
- `npm test` — 412/412 tests passing across 63 files (up from 379/59
  before this phase).

## Phase 23 — Policy Editor

### Added
- `src/lib/policySettingsStore.ts` — the Phase 23 override/persistence
  layer for the four policy documents in `content/policies.ts`'s
  `POLICY_PAGES`. `PolicySettingsOverride` is
  `Partial<Record<PolicySlug, PolicyDocument>>` - the first editor override
  shaped around a fixed, closed set of records (exactly four known slugs,
  no admin flow to add or remove one) rather than a growable list
  (Products/Categories) or a single settings object (Store Settings/Theme/
  Homepage/Navigation/Footer). No deletion sentinel is needed, since every
  slug always has a guaranteed static default to fall back to.
  `savePolicyOverride(slug, doc)`/`resetPolicyOverride(slug)` act on one
  slug at a time; `resetPolicySettingsOverride()` clears every slug at
  once. `resolvePolicyDocument(slug)`/`resolvePolicyPages()` resolve the
  live value(s), and persist to `localStorage`
  (`storageKey("policy-settings")`), dispatching
  `POLICY_SETTINGS_CHANGE_EVENT`.
- `src/lib/policyValidation.ts` — `validatePolicySection()` (non-empty
  heading and body), `validatePolicyTitle()`/`validatePolicyLastUpdated()`
  (non-empty), `validatePolicyDocument()` (all of the above plus a
  "needs at least one section" error), and `hasPolicyDocumentErrors()`.
- `src/hooks/usePolicySettings.ts` — reactive hook wrapping the store,
  same subscription shape as every prior editor hook, returning `pages`
  (`resolvePolicyPages()`), `isOverridden(slug)`, and
  `save(slug, doc)`/`reset(slug)`/`resetAll()`.
- `src/pages/admin/PolicyEditor.tsx` — the `/admin/policies` page. A
  small tab-style picker (visual style borrowed from `ThemeEditor.tsx`'s
  preset picker) selects one of the four policies; the selected
  document's title, last-updated date, and ordered section list (each an
  editable heading + body, with up/down reorder, delete, and an "Add
  section" button) are edited as local draft state and saved with one
  `save(slug, doc)` call per slug. Blocked, with inline errors, from
  saving an empty title, an empty last-updated date, a section missing
  either its heading or its body, or a document with zero sections. A
  "Reset this policy" action clears just the active slug's override;
  a page-level "Reset all policies" action clears every slug's override
  at once. Sets its own page title via
  `useSiteMeta(PAGE_META.adminPolicies)`.
- `src/config/site.ts`: `PAGE_META.adminPolicies` entry.
- `src/config/adminNav.ts`: "Policies" marked `available: true` with
  `path: "/admin/policies"`.
- `App.tsx`: new `<Route path="policies">` under the `/admin` tree.
- Tests: `src/lib/policySettingsStore.test.ts` (resolves to `POLICY_PAGES`
  with an empty override; saving/resolving one slug independently of the
  others; saving multiple slugs; persistence across a fresh read;
  per-slug reset vs. reset-all; change-event dispatch on
  save/reset(slug)/resetAll; corrupted/malformed-`localStorage` handling,
  including a per-slug value with the wrong document shape; saving a
  document with an explicitly empty section list),
  `src/lib/policyValidation.test.ts` (title/date/section required-field
  checks; per-section errors at the matching index;
  `hasPolicyDocumentErrors()` for each individual failure mode),
  `src/hooks/usePolicySettings.test.ts` (resolves to `POLICY_PAGES`
  initially with no slug overridden; re-renders immediately after
  `save()`/`reset(slug)`/`resetAll()` in the same tab; an edit to one slug
  never affects another), `src/pages/admin/PolicyEditor.test.tsx` (page
  title; form prefilled from the Privacy policy by default; switching
  tabs loads the selected policy; both reset buttons disabled until
  overridden; saving an edited title persists only that slug and shows a
  confirmation; adding/removing/reordering a section persists on save;
  blocking an empty title, empty date, a section missing its body, or
  zero sections; reset-this-policy restores only the active slug;
  reset-all clears every slug).

### Changed
- `src/pages/Policy.tsx` now reads through `resolvePolicyDocument()`
  instead of importing `POLICY_PAGES` directly, so a Policy Editor save
  is reflected the next time `/policies/:slug` is visited. No reactive
  hook is used here (a plain resolver call is enough) - the admin and
  storefront route trees are separate, so this page always mounts fresh,
  the same reasoning `Home.tsx` relies on for Phase 18's Homepage Editor.
  `POLICY_PAGES` is still imported directly to validate an unknown slug
  against the fixed set of four before resolving.

### Verified
- `tsc -b`, `vite build`, `oxlint src` clean.
- `npm test` — 379/379 tests passing across 59 files (up from 344/55
  before this phase).

## Phase 22 — Footer Editor

### Added
- `src/lib/footerSettingsStore.ts` — the Phase 22 override/persistence
  layer for the footer's link columns and copyright line.
  `FooterSettingsOverride` is `{ groups?: FooterLinkGroup[]; copyrightHolder?:
  string }`. `FOOTER_LINK_GROUPS` is a list of groups each holding a list of
  links — one level deeper than Phase 21's flat `MAIN_NAV` — but since a
  group has no id referenced elsewhere and there's only one list to edit,
  this reuses Phase 21's whole-array-as-one-field shape at the group level
  rather than Phase 19/20's id-keyed map. `copyrightHolder` (off
  `config/branding.ts`, never made overridable by Phase 16 Store Settings)
  is a second, independent optional field on the same override, saved and
  reset together with `groups` but resolved separately
  (`resolveFooterLinkGroups()`/`resolveCopyrightHolder()`).
  `saveFooterSettingsOverride()`/`resetFooterSettingsOverride()` persist to
  `localStorage` (`storageKey("footer-settings")`) and dispatch
  `FOOTER_SETTINGS_CHANGE_EVENT`. Social links (`business.social`) are
  deliberately NOT included in this store even though the phase brief
  mentions them — Phase 16 already made them fully editable/overridable
  and `Footer.tsx` already reads them live via `useStoreSettings()`; adding
  a second override for the same data would create two competing sources
  of truth. See the module comment for the full reasoning.
- `src/lib/footerValidation.ts` — `validateFooterLink()` (reuses Phase 21's
  `validateNavLink()` rule: non-empty label, `to` starting with "/" or a
  full URL), `validateFooterGroup()` (non-empty title + per-link
  validation), and `validateFooterLinkGroups()` (every group via
  `validateFooterGroup()`, plus a per-group "needs at least one link"
  error — unlike the header nav, an empty *overall* group list is allowed,
  since `footerStyle: "minimal"` shows no link groups at all, but a titled
  group with zero links never is), and `validateCopyrightHolder()`
  (non-empty).
- `src/hooks/useFooterSettings.ts` — reactive hook wrapping the store, same
  subscription shape as every prior editor hook, returning `linkGroups`
  (`resolveFooterLinkGroups()`), `copyrightHolder`
  (`resolveCopyrightHolder()`), `isOverridden`, and `save()`/`reset()`.
- `src/pages/admin/FooterEditor.tsx` — the `/admin/footer` page. A list of
  editable footer link columns (each an editable title, up/down
  reorder/delete for the column itself, and a nested list of editable
  label/link rows with their own up/down/delete and an "Add link"
  button), an "Add column" button, a copyright-name field, and a "Reset to
  defaults" action scoped to this page's own override (link columns +
  copyright) — disabled until that override exists. Saving edits local
  copies of the group list and copyright string and calls `save()` once
  with both. Blocked, with inline errors, from saving an empty column
  title, a column with a title but zero links, or an empty copyright name;
  an empty *list* of columns is allowed to save. Also includes a Social
  Links card that edits `business.social` directly through
  `useStoreSettings()` — the same override Store Settings itself uses, not
  a duplicate — with its own independent "Save social links" action and a
  link to the Store Settings page. Sets its own page title via
  `useSiteMeta(PAGE_META.adminFooter)`.
- `src/config/site.ts`: `PAGE_META.adminFooter` entry.
- `src/config/adminNav.ts`: "Footer" marked `available: true` with
  `path: "/admin/footer"`.
- `App.tsx`: new `<Route path="footer">` under the `/admin` tree.
- Tests: `src/lib/footerSettingsStore.test.ts` (resolves to
  `FOOTER_LINK_GROUPS`/`branding.copyrightHolder` with an empty override;
  saving/resolving groups and copyright independently and merged; partial
  saves merge over an existing override rather than replacing it;
  persistence across a fresh read; reset restores both defaults;
  change-event dispatch on save/reset; corrupted/malformed-`localStorage`
  handling per field; saving an explicitly empty group list),
  `src/lib/footerValidation.test.ts` (valid internal/query-string/hash/
  external links; empty label/link rejected; a link with no leading slash
  and no protocol rejected; empty group title rejected; per-link errors at
  the matching index; empty overall group list allowed; a titled group
  with zero links flagged; the zero-links flag suppressed when the title
  itself is also invalid; empty/whitespace-only copyright rejected),
  `src/hooks/useFooterSettings.test.ts` (resolves to the static defaults
  initially with `isOverridden` false; re-renders immediately after
  `save()`/`reset()` in the same tab), `src/pages/admin/FooterEditor.test.tsx`
  (page title; prefills from `FOOTER_LINK_GROUPS`/`branding.copyrightHolder`;
  Reset disabled until overridden; editing a column title and the
  copyright line and saving persists both; adding a column with a link
  end-to-end; removing a column end-to-end; reordering a column and
  persisting the new order; blocking a save with an empty column title;
  blocking a save with a titled-but-linkless column; blocking a save with
  an empty copyright name; reset clears the override and restores the
  original groups/copyright; editing social links writes to the Store
  Settings override, not the Footer Editor's own), and an expanded
  `src/components/layout/Footer.test.tsx` (default `FOOTER_LINK_GROUPS`/
  copyright render with no override; a saved override's groups/copyright
  render instead, verified separately for `columns` and `stacked`
  `footerStyle`, and — for `minimal`, which renders no link groups at all —
  confirming the overridden copyright still shows while the overridden
  groups correctly do not).

### Changed
- `src/components/layout/Footer.tsx`: link groups and the copyright-line
  name switched from the static `FOOTER_LINK_GROUPS` import and
  `branding.copyrightHolder` to `useFooterSettings()`'s resolved values,
  so a Footer Editor save is reflected immediately across all three
  `footerStyle` variants, no reload.
- `src/config/adminNav.ts`: doc comment updated to note Phase 22 added
  Footer.

### Verified
- `tsc -b`, `vite build`, `oxlint src` (0 issues), `npm test` (344 tests,
  55 files) clean.

## Phase 21 — Navigation Editor

### Added
- `src/lib/navigationSettingsStore.ts` — the Phase 21 override/persistence
  layer for the header nav, the simplest override shape of any editor so
  far. `NavigationSettingsOverride` is `{ links?: NavLink[] }` — a single
  optional whole-array field, since `config/navigation.ts`'s `MAIN_NAV` is
  already a flat array with no per-entry id (unlike Products/Categories'
  id-keyed maps) and no named variant to pick between (unlike Theme/
  Homepage's paired "variant + its customization" shape). `resolveMainNav()`
  returns `override.links ?? MAIN_NAV`. `saveNavigationSettingsOverride()`/
  `resetNavigationSettingsOverride()` persist to `localStorage`
  (`storageKey("navigation-settings")`) and dispatch
  `NAVIGATION_SETTINGS_CHANGE_EVENT`.
- `src/lib/navigationValidation.ts` — `validateNavLink()` for a single row
  (non-empty label; a `to` that's non-empty and either starts with "/" or
  looks like a full URL) and `validateNavLinks()` for the whole list (every
  row via `validateNavLink()`, plus a list-level error if it would be
  saved empty).
- `src/hooks/useNavigation.ts` — reactive hook wrapping the store: same
  subscription shape as every prior editor hook
  (`NAVIGATION_SETTINGS_CHANGE_EVENT` for same-tab saves, the native
  `storage` event for cross-tab), returning `mainNav`
  (`resolveMainNav()`), `isOverridden`, and `save()`/`reset()`.
- `src/pages/admin/NavigationEditor.tsx` — the `/admin/navigation` page. A
  list of editable label/link row pairs (up/down reorder buttons, a
  per-row delete button), an "Add link" button appending a blank row, and
  a "Reset to defaults" action disabled until an override exists. Saving
  edits a local copy of the full list and calls `save()` once with the
  complete array — no per-row persistence, matching how the list is
  always read as one unit. Blocked, with inline errors, from saving an
  empty label/link on any row or an empty list. Sets its own page title
  via `useSiteMeta(PAGE_META.adminNavigation)`. `NavLink`'s `{ label, to }`
  shape has no nested-link field, so no nesting support was added — the
  scope note ("support nested links if the current structure allows it")
  doesn't apply since it doesn't.
- `src/config/site.ts`: `PAGE_META.adminNavigation` entry.
- `src/config/adminNav.ts`: "Navigation" marked `available: true` with
  `path: "/admin/navigation"`.
- `App.tsx`: new `<Route path="navigation">` under the `/admin` tree.
- Tests: `src/lib/navigationSettingsStore.test.ts` (resolves to `MAIN_NAV`
  with an empty override; saving/resolving a full replacement list;
  persistence across a fresh read; reset restores `MAIN_NAV`; change-event
  dispatch on save/reset; corrupted/malformed-`localStorage` handling;
  saving an explicitly empty list), `src/lib/navigationValidation.test.ts`
  (valid internal/query-string/hash/external links; empty label/link
  rejected; a link with no leading slash and no protocol rejected;
  per-row error indices; the empty-list list-level error),
  `src/hooks/useNavigation.test.ts` (resolves to `MAIN_NAV` initially with
  `isOverridden` false; re-renders immediately after `save()`/`reset()` in
  the same tab), `src/pages/admin/NavigationEditor.test.tsx` (page title;
  prefills from `MAIN_NAV`; Reset disabled until overridden; editing a
  label and saving persists it; adding a link end-to-end; removing a link
  end-to-end; reordering a link and persisting the new order; blocking a
  save with an empty label; blocking a save down to zero links; reset
  clears the override and restores the original list), and a new
  `src/components/layout/Navbar.test.tsx` (default `MAIN_NAV` links
  render with no override; a saved override's links render instead,
  verified separately for all three `navStyle` variants — `standard`,
  `centered`, and `minimal`, the last requiring the mobile-style menu
  panel to be opened first since `minimal` tucks links behind the menu
  toggle at every breakpoint).

### Changed
- `src/components/layout/Navbar.tsx`: both the desktop link list and the
  mobile/minimal menu panel link list switched from the static `MAIN_NAV`
  import to `useNavigation()`'s resolved list, so a Navigation Editor save
  is reflected immediately across all three `navStyle` variants, no
  reload.

### Verified
- `tsc -b`, `vite build`, `oxlint src` (0 issues), `npm test` (300 tests,
  51 files) clean.

## Phase 20 — Category Manager

### Added
- `src/lib/categoriesStore.ts` — the Phase 20 override/persistence layer
  for the category catalog, extending Phase 19's `productsStore.ts` list
  pattern. `CategoriesOverride` is `{ entries: Record<string, Category |
  { deleted: true }> }` - an id-keyed map where a `Category` value means
  created/edited and a `{ deleted: true }` sentinel means removed, layered
  over the static `data/categories.ts` seed list rather than replacing
  it. `resolveAllCategories()` walks the static list applying
  edits/exclusions, then appends any admin-created categories (ids with
  no static counterpart) in creation order; `resolveCategoryById()` looks
  up a single one. `saveCategoryOverride()`/`deleteCategoryOverride()`/
  `resetCategoriesOverride()` persist to `localStorage`
  (`storageKey("categories")`) and dispatch `CATEGORIES_CHANGE_EVENT`.
  `generateCategoryId()` slugifies a category name into a unique id/slug
  (e.g. "Home Decor" -> `home-decor`, appending `-2`/`-3`/... on
  collision). `countProductsInCategory()` counts how many products (via
  `resolveAllProducts()`, the live product catalog) currently reference a
  given category id - the basis for the delete guard below.
- `src/lib/categoryValidation.ts` — `validateCategory()` for the Category
  Manager form: requires a non-empty `label`/`description`, and an `icon`
  that's both non-empty and a real key in `lib/iconRegistry.ts`'s
  `ICON_REGISTRY` (an invalid icon name silently falls back to a generic
  package icon everywhere that category is rendered, so this is checked
  rather than left free-form). `tone`/`itemCount`/`image`/`featured` are
  either cosmetic, optional, or (in `tone`'s case) constrained by a
  `<select>` rather than free text, so none needs validation.
- `src/hooks/useCategories.ts` — reactive hook wrapping the store: same
  subscription shape as `useProducts`/`useStoreSettings`/
  `useThemeSettings`/`useHomepageSettings` (`CATEGORIES_CHANGE_EVENT` for
  same-tab saves, the native `storage` event for cross-tab), returning
  `categories` (`resolveAllCategories()`), `isOverridden`,
  `countProductsInCategory`, and `save()`/`remove()`/`reset()`.
- `src/pages/admin/CategoryManager.tsx` — the `/admin/categories` page. A
  list of every resolved category (icon-tile preview, name, description,
  live product count, edit/delete buttons); an "Add category" button and
  a create/edit modal form covering every meaningfully-consumed
  `Category` field (name, description, icon picked from
  `ICON_REGISTRY`, accent tone, item count, optional image URL, featured
  checkbox - the id/slug field is shown read-only in edit mode, generated
  automatically on create); a separate delete-confirmation modal for the
  unblocked case; and a "Reset to defaults" action disabled until an
  override exists. **Guard against deleting a category still referenced
  by a product: blocked, not just warned** - a category with
  `countProductsInCategory(id) > 0` has its delete button disabled
  (with an explanatory `aria-label`/tooltip) so the confirmation modal
  never opens for it in the first place, rather than allowing the delete
  and leaving products pointing at a category id that no longer resolves
  to anything. A footer note explains the rule whenever at least one
  category is currently locked. Sets its own page title via
  `useSiteMeta(PAGE_META.adminCategories)`.
- `src/config/site.ts`: `PAGE_META.adminCategories` entry.
- `src/config/adminNav.ts`: "Categories" marked `available: true` with
  `path: "/admin/categories"`.
- `App.tsx`: new `<Route path="categories">` under the `/admin` tree.
- Tests: `src/lib/categoriesStore.test.ts` (empty-override resolves to
  the static list; creating a new category; editing a static category
  without duplicating it; deleting a static category; deleting an
  admin-created category; reset restores the static list; change-event
  dispatch on save/delete/reset; corrupted-`localStorage` handling;
  `countProductsInCategory()` correctly counting against the live product
  catalog and updating after a product save/delete; `generateCategoryId()`
  slugification, collision suffixing, and its fallback for a label with
  no alphanumeric characters), `src/lib/categoryValidation.test.ts`,
  `src/hooks/useCategories.test.ts` (resolves to the static list
  initially with `isOverridden` false; re-renders immediately after
  `save()`/`remove()`/`reset()` in the same tab; exposes
  `countProductsInCategory`), `src/pages/admin/CategoryManager.test.tsx`
  (page title; lists every category; Reset disabled until overridden;
  creating a category end-to-end and persisting it to the store; blocking
  a submit with an empty name; editing a category updates the list and
  store; the delete button is disabled for a category with products
  assigned; deleting an unused category after confirmation succeeds;
  reset clears every override and restores the full list).

### Changed
- Every existing consumer of the static `CATEGORIES` export switched to
  the live, override-aware resolver so a Category Manager edit shows up
  without a reload:
  - `src/components/shop/CategoryFilter.tsx`: builds its option list and
    labels from `resolveAllCategories()` at render time instead of a
    module-load-frozen constant.
  - `src/pages/Shop.tsx`: `categories`/`validCategories`/`categoryTitle`
    are now computed inside the component (via `useMemo`, resolved once
    per mount - Shop isn't mounted while the admin is on
    `/admin/categories`, so a fresh mount already picks up any save) from
    `resolveAllCategories()`, instead of module-scope constants built
    from the static `CATEGORIES` import.
  - `src/components/home/Categories.tsx`: calls `resolveAllCategories()`
    at render time instead of importing the static `CATEGORIES` array
    (matching the Phase 19 "plain data, not a DOM side effect" precedent
    used for `FeaturedProducts`/`BestSellers`/`NewArrivals`).
  - `src/components/ui/CraftIcon.tsx`: looks up category metadata via
    `resolveCategoryById()` instead of `CATEGORIES.find()`.
  - `src/components/ui/CategoryMosaic.tsx`: builds its tiles from
    `resolveAllCategories()` instead of the static `CATEGORIES` import.
  - `src/pages/ProductDetail.tsx`: the category-metadata lookup uses
    `resolveCategoryById()` instead of `CATEGORIES.find()`.
  - `src/pages/admin/ProductManager.tsx`: its own category `<select>`
    (both the filter and the create/edit form) and default-category logic
    now read from `resolveAllCategories()`, so a category renamed/added/
    removed in Category Manager is reflected the next time Product
    Manager is opened.
  - `src/lib/adminStats.ts`: `categoryCount` now resolves through
    `resolveAllCategories().length` instead of the static
    `CATEGORIES.length` import.
- `src/lib/productFilters.ts`: `CATEGORY_FILTER_LABELS` (a module-load-
  frozen constant built from the static `CATEGORIES` import) became
  `getCategoryFilterLabels(categories)`, a function over a passed-in
  category list, so it can be built from the live resolver instead.
- `src/config/adminNav.ts` (doc comment): reflects the above.

### Notes
- Category `id`/`slug` are always kept equal, matching every static
  category in `data/categories.ts` - `generateCategoryId()` enforces this
  for admin-created categories too.
- `Category.image` was already an unused field before this phase (no
  renderer reads it - `CraftIcon`/`CategoryMosaic` only ever use
  `icon`/`tone`); it's exposed as an optional form field for API
  completeness/future-proofing, matching Phase 19's "cover every field"
  approach on `Product`, but nothing currently displays it.
- `Category.featured` was likewise already unused; exposed as a checkbox
  for the same reason.

---

## Phase 19 — Product Manager

### Added
- `src/lib/productsStore.ts` — the Phase 19 override/persistence layer,
  extending Phase 16-18's pattern to a *list* of records instead of one
  settings object. `ProductsOverride` is `{ entries: Record<string,
  Product | { deleted: true }> }` - an id-keyed map where a `Product`
  value means created/edited and a `{ deleted: true }` sentinel means
  removed, layered over the static `data/products.ts` seed catalog rather
  than replacing it. `resolveAllProducts()` walks the static list applying
  edits/exclusions, then appends any admin-created products (ids with no
  static counterpart) in creation order. `resolveProductById()`,
  `resolveFeaturedProducts()`, `resolveBestSellers()`, and
  `resolveNewArrivals()` are live equivalents of `data/products.ts`'s
  `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS`, re-deriving each
  list's existing rule (`deriveProductFlags()`, `salesRank` sort,
  `createdAt` sort) against the resolved catalog - so an edit that changes
  a product's tag/sales rank/date automatically moves it in/out of the
  right derived lists, with no separate override needed per list.
  `saveProductOverride()`/`deleteProductOverride()`/
  `resetProductsOverride()` persist to `localStorage`
  (`storageKey("products")`) and dispatch `PRODUCTS_CHANGE_EVENT`.
  `generateProductId()` slugifies a product name into a unique id (e.g.
  "Woven Basket" -> `p-woven-basket`, appending `-2`/`-3`/... on
  collision).
- `src/lib/productValidation.ts` — `validateProduct()` for the Product
  Manager form: requires a non-empty `name`/`category`/`description`, a
  `price` greater than 0, and a `rating` between 0 and 5. Deliberately
  covers only the fields the rest of the app depends on being well-formed
  - everything else on `Product` (tag, salesRank, details, images,
  variants, stock, tags) is optional, free-form data with no downstream
  parsing that would break on an empty value.
- `src/hooks/useProducts.ts` — reactive hook wrapping the store: same
  subscription shape as `useStoreSettings`/`useThemeSettings`/
  `useHomepageSettings` (`PRODUCTS_CHANGE_EVENT` for same-tab saves, the
  native `storage` event for cross-tab), returning `products`
  (`resolveAllProducts()`), `isOverridden`, and `save()`/`remove()`/
  `reset()`.
- `src/pages/admin/ProductManager.tsx` — the `/admin/products` page. A
  search box (matches name or id) plus a category `<select>` filter over
  a list of every resolved product (thumbnail/placeholder icon, name,
  category, rating, price, edit/delete buttons); an "Add product" button
  and a create/edit modal form covering every `Product` field (name,
  category, price, rating, tag, date added, sales rank, stock,
  description, add/remove detail-bullet rows, add/remove image-URL rows,
  add/remove variant rows with comma-separated options, comma-separated
  search tags); a separate delete-confirmation modal; and a "Reset to
  defaults" action disabled until an override exists. Sets its own page
  title via `useSiteMeta(PAGE_META.adminProducts)`.
- `src/config/site.ts`: `PAGE_META.adminProducts` entry.
- `src/config/adminNav.ts`: "Products" marked `available: true` with
  `path: "/admin/products"`.
- `App.tsx`: new `<Route path="products">` under the `/admin` tree.
- Tests: `src/lib/productsStore.test.ts` (empty-override resolves to the
  static catalog; creating a new product; editing a static product
  without duplicating it; deleting a static product; deleting an
  admin-created product; reset restores the static catalog; change-event
  dispatch on save/delete/reset; corrupted-`localStorage` handling;
  `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS` correctly re-deriving
  after a tag/sales-rank/date edit, and correctly dropping a deleted
  product from all three; `generateProductId()` slugification, collision
  suffixing, and its fallback for a name with no alphanumeric
  characters), `src/lib/productValidation.test.ts`,
  `src/hooks/useProducts.test.ts` (resolves to the static catalog
  initially with `isOverridden` false; re-renders immediately after
  `save()`/`remove()`/`reset()` in the same tab), `src/pages/admin/
  ProductManager.test.tsx` (page title; lists every product; Reset
  disabled until overridden; search and category filtering; creating a
  product end-to-end and persisting it to the store; blocking a submit
  with an empty name; editing a product updates the list and store;
  deleting after confirmation; reset clears every override and restores
  the full catalog).

### Changed
- `src/pages/Shop.tsx`: `fetchProducts()` resolves `resolveAllProducts()`
  instead of the static `ALL_PRODUCTS` import.
- `src/pages/ProductDetail.tsx`: `fetchProductById()` and the "related
  products" lookup both resolve through `resolveAllProducts()` instead of
  the static `ALL_PRODUCTS` import.
- `src/components/home/FeaturedProducts.tsx`,
  `src/components/home/BestSellers.tsx`,
  `src/components/home/NewArrivals.tsx`: each now calls its matching
  `resolveFeaturedProducts()`/`resolveBestSellers()`/
  `resolveNewArrivals()` at render time instead of importing the static
  `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS` arrays. No hook
  needed (matching the Phase 18 "plain data, not a DOM side effect"
  precedent) - neither is mounted while the admin is editing, so a fresh
  mount already resolves current data.
- `src/lib/adminStats.ts`: `productCount` now resolves through
  `resolveAllProducts().length` instead of the static `ALL_PRODUCTS.length`
  import, so the `/admin` dashboard's stat reflects a Product Manager
  save.
- `src/config/adminNav.ts` (doc comment): reflects the above.

### Fixed
- `src/components/ui/Modal.tsx` was already correct, but this phase
  surfaced and fixed a bug in how `ProductManager.tsx` used it:
  `Modal`'s focus-management `useEffect` depends on `[isOpen, onClose]`,
  so an inline (non-memoized) `onClose`/`closeModal` handler gets a new
  function identity every parent re-render - including the re-render
  every keystroke causes in a controlled form - which re-fires
  `dialogRef.current?.focus()` and steals focus back to the dialog
  wrapper mid-typing, silently dropping all but the first character
  typed into any field. Fixed by wrapping both `closeModal` (the create/
  edit form modal) and `closeDeleteModal` (the delete-confirmation modal)
  in `useCallback`. No change to `Modal.tsx` itself; documented in
  `MASTER_HANDOFF.md`'s Developer Notes as a pattern to watch for in any
  future `Modal`-based form.

### Notes
- **Decision made this phase**: Cart (`CartProvider.tsx`), Wishlist
  (`WishlistProvider.tsx`), and `data/collections.ts` were left reading
  the static `ALL_PRODUCTS` export directly, not the new
  `resolveAllProducts()`. The Phase 19 brief's Completion Criteria named
  only `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS` staying correct
  after edits - Cart/Wishlist/Collections are a different, unscoped
  concern (an already-added cart line or wishlisted id referencing a
  since-edited-or-deleted product). Tracked in `MASTER_HANDOFF.md` Known
  Issues; worth closing before Phase 27 (Products, backend-integrated) if
  not folded in earlier.
- Every list-row "Edit"/"Delete" icon button is `aria-label`'d with the
  product's name (e.g. `Edit Woven Basket`) rather than a generic label,
  since a plain icon button with no visible text needs a unique
  accessible name per row - this is also what makes the row's action
  reliably targetable in tests without relying on DOM order.
- Price is stored and edited as a whole number of pesos (matching the
  existing `formatPHP()`/`Product.price` convention already used
  throughout the app, e.g. `999`, `1299`) - no cents/centavos field was
  introduced.

## Phase 18 — Homepage Editor

### Added
- `src/lib/homepageSettingsStore.ts` — the Phase 18 override/persistence
  layer, mirroring Phase 16/17's pattern for a third slice of config.
  `HomepageSettingsOverride` covers `activeLayoutId` (which of the 4
  named homepage layouts - `classic`/`minimal`/`modern`/`luxury` - is the
  starting point, replacing the Phase 11 code-level `ACTIVE_HOME_LAYOUT`
  edit) and, optionally, a full customized `sections` array for that
  specific layout (saved as a whole array, not merged entry-by-entry -
  matching Phase 17's `theme`). `resolveActiveHomeLayoutId()` falls back
  to `ACTIVE_HOME_LAYOUT` if the saved id is no longer a valid layout key.
  `resolveHomeLayout()` returns the selected layout with its `sections`
  replaced by the saved customization when one exists for that same
  layout. `saveHomepageSettingsOverride()` explicitly drops a stale
  `sections` array when `activeLayoutId` changes without an accompanying
  new `sections` in the same call - the same "matched pair" guard Phase
  17 established for `activePresetId`/`theme`. `buildFullSectionList()`
  expands a layout's (possibly partial, e.g. `minimal`'s 4-entry)
  `sections` into all 12 registered `HomepageSectionKey`s, appending any
  missing ones as disabled with `order` renumbered sequentially across
  the whole list - this is what the editor's section-list UI actually
  edits, so every section is always shown and toggleable, not just the
  ones a given layout happens to enable. Dispatches
  `HOMEPAGE_SETTINGS_CHANGE_EVENT` on save/reset, namespaced via
  `storageKey("homepage-settings")`.
- `src/hooks/useHomepageSettings.ts` — reactive hook wrapping the store:
  subscribes to `HOMEPAGE_SETTINGS_CHANGE_EVENT` and the native `storage`
  event, returns the resolved `layout`, `save()`/`reset()`, and
  `isOverridden`. Unlike `useThemeSettings.ts`, there's no DOM side effect
  to reapply - a section arrangement is just data `pages/Home.tsx` reads
  at render time, so this hook only touches `localStorage`, never the
  document.
- `src/config/layouts/home.ts`: `HOMEPAGE_SECTION_LABELS` (friendly
  display name per section key) and `ALL_HOMEPAGE_SECTION_KEYS` (the
  canonical 12-key order), both for the Homepage Editor's section-list UI.
- `src/pages/admin/HomepageEditor.tsx` — the `/admin/homepage` page. A
  layout picker (all 4 named layouts as selectable cards with
  label/description and an `aria-pressed` selected state - selecting a
  different layout resets the section list below to that layout's own
  shipped arrangement), then a 12-row section list: an enable checkbox,
  up/down reorder buttons (chosen over drag-and-drop for reliability -
  the Phase 18 brief explicitly allows either), and an expandable
  per-section settings panel (title override, subtitle override, and
  `SectionSettings`' `padding`/`background`/`width`/`align`, each a
  `<select>` with a "Default" option that saves as `undefined` rather
  than forcing every section to specify every field). Unlike Theme
  Editor, there's no live in-page preview - a section arrangement has no
  DOM side effect to reapply, so this page is a more conventional list
  editor; saved changes are visible by actually visiting `/`. Sets its
  own page title via `useSiteMeta(PAGE_META.adminHomepage)`.
- `src/config/site.ts`: `PAGE_META.adminHomepage` entry.
- `src/config/adminNav.ts`: "Homepage" marked `available: true` with
  `path: "/admin/homepage"`.
- `App.tsx`: new `<Route path="homepage">` under the `/admin` tree.
- Tests: `src/lib/homepageSettingsStore.test.ts` (defaults when nothing
  saved, switching layout id, layering a custom section arrangement over
  the selected layout, dropping a stale arrangement when the layout id
  changes without a matching new one, falling back to
  `ACTIVE_HOME_LAYOUT` for an invalid saved layout id, refresh-
  persistence, reset, change-event dispatch on both save and reset,
  corrupted-`localStorage` handling; `buildFullSectionList()` expanding a
  partial layout to all 12 keys with only that layout's own sections
  enabled, renumbering order sequentially, and leaving a full layout's 12
  sections all enabled), `src/hooks/useHomepageSettings.test.ts` (resolves
  to `ACTIVE_HOME_LAYOUT` initially; re-renders immediately after
  `save()`/`reset()` in the same tab), `src/pages/admin/
  HomepageEditor.test.tsx` (page title; every named layout renders with
  the active one `aria-pressed`; all 12 sections render, enabled for the
  default layout; Reset disabled until overridden; switching layout
  disables sections the new layout doesn't include; toggling a checkbox
  flips enabled state; saving persists the layout + full 12-section list
  and shows a confirmation; moving a section up changes its saved
  `order`; Reset clears the override and re-selects the default layout),
  plus two new cases in `src/pages/Home.test.tsx` (unchanged default
  rendering still asserted; a saved override switching to `minimal` is
  reflected in the rendered section count on the next mount).

### Changed
- `src/pages/Home.tsx`: reads `resolveHomeLayout()` instead of
  `HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]` - the only change; the rendering
  logic itself (resolve enabled sections, sort by order, render each from
  `SECTION_REGISTRY`) is untouched, per the phase brief's explicit scope.
- `src/lib/adminStats.ts`: `activeHomeLayout` now resolves through
  `resolveActiveHomeLayoutId()` instead of the static `ACTIVE_HOME_LAYOUT`
  import, so the `/admin` dashboard's stat reflects a Homepage Editor
  save.
- `src/config/adminNav.ts` (doc comment): reflects the above.

### Notes
- **Decision made this phase**: no live in-page preview, unlike Theme
  Editor. This is a direct consequence of what's being edited - a section
  arrangement is inert data with no DOM side effect to reapply, unlike
  `applyPreset()` - not a scope cut. Saved changes are visible by
  visiting `/`, which is enough to satisfy "changes reflect on `/`
  immediately" (no rebuild required) without building a parallel preview
  renderer for data that has no live-mutation hook to piggyback on.
- **Decision made this phase**: reordering uses up/down buttons, not
  drag-and-drop. The Phase 18 brief explicitly allows either; up/down
  buttons are simpler to implement reliably, fully keyboard-accessible,
  and straightforward to test deterministically.
- Build/lint/tests all verified clean: `tsc -b`, `npx vite build`,
  `npx oxlint src` (0 warnings/errors), `npm test` (203/203 passing, 38
  files, up from 178/35).

## Phase 17 — Theme Editor

### Added
- `src/lib/themeSettingsStore.ts` — the Phase 17 override/persistence
  layer, mirroring Phase 16's pattern for a different slice of config.
  `ThemeSettingsOverride` covers `activePresetId` (which of the 10
  shipped presets is active - replaces the Phase 12 code-level
  `ACTIVE_PRESET_ID` edit) and, optionally, a full `theme: ThemeConfig`
  customization for that specific preset (saved as a whole object, not
  merged field-by-field - matching how Phase 16 saved `hours`/`social`).
  `resolveActivePresetId()` falls back to `ACTIVE_PRESET_ID` if the saved
  id is no longer a valid preset key. `resolveActivePreset()` returns the
  selected preset with its `theme` replaced by the saved customization
  when one exists for that same preset; `navStyle`/`footerStyle`/
  `heroStyle`/`sectionSpacing` always come from the preset itself, never
  independently overridable. `saveThemeSettingsOverride()` explicitly
  drops a stale `theme` field when `activePresetId` changes without an
  accompanying new `theme` in the same call - otherwise a bare
  object-merge would let a color customization made for one preset
  silently reattach to a different, newly-selected preset. Dispatches
  `THEME_SETTINGS_CHANGE_EVENT` on save/reset, namespaced via
  `storageKey("theme-settings")`.
- `src/hooks/useThemeSettings.ts` — reactive hook wrapping the store:
  subscribes to `THEME_SETTINGS_CHANGE_EVENT` and the native `storage`
  event, returns the resolved `activePreset`, `save()`/`reset()`, and
  `isOverridden`; also calls `applyPreset()` (the same CSS-custom-
  property + data-attribute mechanism `main.tsx` already uses at boot)
  in a `useEffect` whenever the resolved preset changes, so a save is
  visible on the live document immediately.
- `src/config/fontOptions.ts` — `DISPLAY_FONT_OPTIONS`/`BODY_FONT_OPTIONS`,
  one curated entry per distinct font stack already used by one of the 10
  shipped presets (all loaded up front by `index.css`'s Google Fonts
  `@import`, regardless of active preset), so every Theme Editor font
  choice is guaranteed to render correctly - no free-text font-family
  field that could reference an unloaded family.
- `src/config/radiusScales.ts` — `RADIUS_SCALE_OPTIONS`, 5 curated
  `sm`/`md`/`lg`/`xl`/`full` radius scales (sharp → round), each matching
  one of the 10 shipped presets' own values, plus `matchRadiusScaleId()`
  to find which curated scale (if any) matches a given radius object -
  used to preselect the right `<select>` option. Trades individually
  editable radius fields (which could produce a visually inconsistent,
  non-proportional scale) for a small closed set of good-looking options.
- `src/components/ui/Select.tsx` — reusable labeled native `<select>`,
  styled to match `Input`'s field conventions (border/radius/focus ring,
  optional `label`/`hint`), following the same "native element, custom
  styling" approach as the pre-existing `components/shop/SortSelect.tsx`.
- `src/pages/admin/ThemeEditor.tsx` — the `/admin/theme` page. A preset
  picker (all 10 shipped presets as selectable cards with name/
  description/4-color swatch preview and an `aria-pressed` selected
  state - selecting a different preset resets the customization below to
  that preset's own shipped `theme`), a Typography & Shape card (display/
  body font selects, radius-scale select, card-style select, button-style
  select), and a Colors card (all 14 `ThemeConfig.colors` fields, grouped
  into Backgrounds/Text/Primary accent/Secondary accent/Status, each an
  `<input type="color">` paired with its label and current hex value).
  Every field change calls `applyPreset()` directly against the live
  document for a genuinely live, whole-page preview - no separate preview
  widget. Nothing is written to `localStorage` until "Save changes"; an
  unmount effect re-applies whatever's actually persisted, so leaving the
  page without saving reverts the visual state. "Reset to defaults"
  clears the override and re-seeds the form from `PRESETS[ACTIVE_PRESET_ID]`;
  disabled while `isOverridden` is false. Sets its own page title via
  `useSiteMeta(PAGE_META.adminTheme)`.
- `src/config/site.ts`: `PAGE_META.adminTheme` entry.
- `src/config/adminNav.ts`: "Theme" marked `available: true` with
  `path: "/admin/theme"`.
- `App.tsx`: new `<Route path="theme">` under the `/admin` tree.
- Tests: `src/lib/themeSettingsStore.test.ts` (defaults when nothing
  saved, switching preset id, layering a custom theme over the selected
  preset while leaving nav/footer/hero/spacing untouched, dropping a
  stale theme when the preset id changes without a matching new theme,
  falling back to `ACTIVE_PRESET_ID` for an invalid saved preset id,
  refresh-persistence, reset, change-event dispatch on both save and
  reset, corrupted-`localStorage` handling), `src/hooks/
  useThemeSettings.test.ts` (resolves to `ACTIVE_PRESET_ID` initially;
  re-renders immediately after `save()`/`reset()` in the same tab;
  applies the resolved theme's CSS custom properties to the document),
  `src/config/radiusScales.test.ts` (every curated scale round-trips
  through `matchRadiusScaleId()`; `minimal`'s non-curated radius
  correctly reports no match; `classic`'s matches "standard" exactly),
  `src/pages/admin/ThemeEditor.test.tsx` (page title; every shipped
  preset renders with the active one `aria-pressed`; Reset disabled until
  overridden; switching preset updates selection and `aria-pressed`;
  saving persists the selected preset + full theme object and shows a
  confirmation; editing a color field persists on save; Reset clears the
  override and re-selects the default preset).

### Changed
- `src/main.tsx`: boots from `resolveActivePreset()` (Theme Editor-aware)
  instead of the static `activePreset`, so a saved preset/theme choice
  survives a refresh with no flash of the wrong style.
- `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`,
  `src/components/home/Hero.tsx`: read `activePreset` from
  `useThemeSettings()` instead of the static `config/presets` import, so
  a Theme Editor save is reflected the moment the component next renders.
- `src/lib/sectionStyle.ts`: `paddingClass()` now resolves the active
  preset's `sectionSpacing` fresh on every call (via
  `resolveActivePreset()`) instead of a module-load-frozen constant, so a
  saved preset switch is reflected in every section's vertical spacing
  without a reload.
- `src/lib/adminStats.ts`: `activePresetName`/`activePresetId` now resolve
  through `resolveActivePreset()` instead of the static `activePreset`
  import, so the `/admin` dashboard's "Active preset" stat reflects a
  Theme Editor save.
- `src/config/adminNav.ts`, `src/config/site.ts`, `src/config/theme.ts`
  (doc comment), `src/config/presets/index.ts` (doc comment): comment
  updates only, reflecting the above.

### Notes
- **Decision made this phase**: `navStyle`/`footerStyle`/`heroStyle`/
  `sectionSpacing` are NOT independently customizable - only `ThemeConfig`
  fields (colors/fonts/radius/card/button style) can be tweaked on top of
  a selected preset, matching the phase brief's stated scope exactly.
  Switching presets is the only way to change layout-shape axes, and
  doing so resets any in-progress `ThemeConfig` customization to that new
  preset's own shipped values.
- **Known gap carried into `MASTER_HANDOFF.md`**: the live preview
  mutates the whole document (including the admin shell itself) rather
  than a scoped preview panel, since it reuses `applyPreset()` directly;
  and the radius control is a 5-option curated scale rather than four
  independently editable fields, so 3 of the 10 presets (`minimal`/
  `bakery`/`handmade`) show "Custom (preset default)" until the admin
  actively picks one of the curated scales. Both are intentional,
  documented trade-offs, not bugs.
- Build/lint/tests all verified clean: `tsc -b`, `npx vite build`,
  `npx oxlint src` (0 warnings/errors), `npm test` (178/178 passing, 35
  files, up from 154/31).

## Phase 16 — Store Settings

### Added
- `src/lib/storeSettingsStore.ts` — the Phase 16 override/persistence
  layer. `StoreSettingsOverride` covers the subset of `branding.ts`
  (`businessName`/`tagline`/`businessDescription`) and `business.ts`
  (`legalName`/`address`/`email`/`phone`/`hours`/`social`/
  `googleMapsUrl`/`responseTime`) the admin form edits.
  `getStoreSettingsOverride()`/`saveStoreSettingsOverride()`/
  `resetStoreSettingsOverride()` read/write it to `localStorage`,
  namespaced via `storageKey("store-settings")` (same pattern as Cart/
  Wishlist/Auth). `resolveBranding()`/`resolveBusiness()` layer the saved
  override over the static default per field (`override ?? default`) and
  return a full `BrandingConfig`/`BusinessConfig`, so every field not
  exposed by the form (logo, `storageKeyPrefix`, favicon, theme color,
  ...) always resolves to its static default. `saveStoreSettingsOverride`/
  `resetStoreSettingsOverride` dispatch a `STORE_SETTINGS_CHANGE_EVENT` on
  `window` for same-tab reactivity.
- `src/hooks/useStoreSettings.ts` — reactive hook wrapping the store:
  subscribes to `STORE_SETTINGS_CHANGE_EVENT` and the native `storage`
  event, returning the currently-resolved `branding`/`business`, the raw
  `override`, an `isOverridden` flag, and `save()`/`reset()`. Any
  component showing admin-editable branding/business info now uses this
  instead of importing `branding`/`business` directly.
- `src/lib/storeSettingsValidation.ts` — `validateStoreSettings()`:
  requires a non-blank business name, validates email format only when
  non-empty (contact email is optional on the form).
- `src/pages/admin/StoreSettings.tsx` — the `/admin/store-settings` page.
  Four grouped `Card`s (Branding, Business info, Business hours, Social
  links); business hours support add/remove rows (`BusinessHours[]`).
  Form state is prefilled from the currently-resolved config (whichever
  is in effect, default or already-overridden) via `useStoreSettings()`.
  "Save changes" validates, then calls `save()` with every field's
  current form value and shows an inline confirmation. "Reset to
  defaults" calls `reset()` (clearing the override entirely, not writing
  the defaults back as an override) and re-seeds the form from the raw
  static defaults; disabled while `isOverridden` is false. Sets its own
  page title via `useSiteMeta(PAGE_META.adminStoreSettings)`.
- `src/config/site.ts`: `PAGE_META.adminStoreSettings` entry.
- `src/config/adminNav.ts`: "Store Settings" marked `available: true`
  with `path: "/admin/store-settings"`.
- `App.tsx`: new `<Route path="store-settings">` under the `/admin` tree.
- Tests: `src/lib/storeSettingsStore.test.ts` (empty-override defaults,
  override layering, merging successive saves, refresh-persistence,
  reset, corrupted-`localStorage` handling, change-event dispatch on both
  save and reset, whole-value — not per-field-merged — nested `hours`/
  `social` overrides), `src/lib/storeSettingsValidation.test.ts`,
  `src/hooks/useStoreSettings.test.ts` (resolves to defaults initially;
  re-renders with the new value immediately after `save()`/`reset()`, in
  the same tab), `src/pages/admin/StoreSettings.test.tsx` (page title;
  form prefilled from current config; Reset disabled until overridden;
  saving persists to `localStorage` and shows a confirmation; a blank
  business name is blocked with no write; Reset clears the override and
  restores the default form), `src/components/layout/Footer.test.tsx`
  (renders the default tagline with no override; reflects a saved
  override immediately, with no reload — the phase's headline "live
  reflection across the site" completion criterion).

### Changed
- `src/components/layout/Footer.tsx`, `src/components/layout/Navbar.tsx`,
  `src/components/admin/AdminLayout.tsx`: read `branding`/`business` from
  `useStoreSettings()` instead of the static `config/branding`/
  `config/business` imports, so a Store Settings save is reflected the
  moment the component next renders. `Footer`'s `SocialLinks` sub-
  component now takes `business` as a prop instead of importing it.
- `src/content/contact.ts`: `CONTACT_POINTS` (a module-load-frozen array)
  replaced with `getContactPoints(business: BusinessConfig)`, a function
  taking the resolved config as a parameter, so it can be recomputed from
  `useStoreSettings()`'s live value instead of the static default.
- `src/components/contact/ContactDetails.tsx`,
  `src/components/home/ContactTeaser.tsx`: call `getContactPoints()` with
  `useStoreSettings()`'s resolved `business` instead of importing the old
  static `CONTACT_POINTS`.
- `src/hooks/useSiteMeta.ts`: the live `document.title`/meta description/
  `og:site_name` are now built from `resolveBranding()` (Store Settings-
  aware) instead of the frozen `site.siteName`/`site.titleTemplate`/
  `site.defaultDescription`, which were computed once from the static
  branding default at module load and would otherwise never reflect an
  override. `site.locale`/`site.defaultOgImage`/`site.twitterHandle` are
  unaffected and still read from the static `config/site.ts`.
- `src/config/adminNav.ts`, `src/config/site.ts`: doc-comment updates
  only, reflecting the above.

### Notes
- **Decision made this phase**: only the fields actually exposed by the
  Store Settings form are overridable (`StoreSettingsOverride`); every
  other `BrandingConfig`/`BusinessConfig` field (logo, favicon, theme
  color, `storageKeyPrefix`, ...) always comes from the static default,
  matching the phase brief's stated scope (business name/tagline/
  description/contact info/site metadata defaults) rather than making the
  entire config object overridable.
- **Known gap carried into `MASTER_HANDOFF.md`**: `config/site.ts`'s
  `PAGE_META` per-route description strings (e.g. shop/about/contact) are
  still frozen at module load with the static business name baked in —
  only the live document title, default (homepage) description, and
  `og:site_name` are override-aware. Each affected route already supplies
  its own explicit description, so this is a narrow, documented gap, not
  a broken feature.
- Build/lint/tests all verified clean: `tsc -b`, `npx vite build`,
  `npx oxlint src` (0 warnings/errors), `npm test` (154/154 passing, 31
  files, up from 131/26).

## Phase 15 — Admin Foundation

### Added
- `src/lib/userStore.ts` — storage layer for the mock user record,
  extracted out of `AuthProvider.tsx` so anything (not just the provider)
  can read the user list. Owns `StoredUser` (now with a `role: "admin" |
  "customer"` field), `readUsers()`/`writeUsers()`, and
  `getRegisteredUsers()` (password-stripped, safe for admin UI). Also owns
  `ensureSeedAdmin()`: since there's no admin-signup UI yet, one demo
  admin account (`admin@example.com` / `admin12345`, exported as
  `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) is created automatically the
  first time the user store is read, if no admin-role account exists yet.
- `src/components/auth/RequireAdmin.tsx` — route guard for the whole
  `/admin` tree, mirroring `RequireAuth` but with an extra state: signed
  out redirects to `/login` (remembering `/admin` to return to); signed in
  but not an admin renders an access-denied panel in place, rather than a
  silent redirect, so it's clear *why* access was denied.
- `src/config/adminNav.ts` — `ADMIN_NAV`, the sidebar section list (
  Dashboard, Store Settings, Theme, Homepage, Products, Categories,
  Navigation, Footer, Policies, Media). Every future admin phase's section
  is listed now, each with an `available` flag; only `available` entries
  carry a `path` and are clickable.
- `src/components/admin/AdminLayout.tsx` — standalone admin shell (own
  top-level route, not nested under the storefront `Layout` — no navbar/
  footer/announcement bar). Sidebar built from `ADMIN_NAV`: available
  sections render as `NavLink`s, unavailable ones render as inert rows
  with a "Soon" badge instead of a dead link. Header shows the signed-in
  admin's name and a log-out action; sidebar footer links back to `/`.
- `src/lib/adminStats.ts` — `getAdminStats()`, a pure function computing a
  live dashboard snapshot from existing config/data: active preset name/
  id, active home layout, product/category/collection/dynamic-page
  counts, registered customer count, and total orders placed (summed
  across every registered account's own `lib/orders.ts` history, since
  orders are namespaced per user with no single global list yet). Nothing
  here is hardcoded or stubbed.
- `src/pages/admin/AdminDashboard.tsx` — the `/admin` index page: eight
  stat cards rendering `getAdminStats()`'s output, plus a short "what's
  next" note pointing at `ROADMAP.md`. Sets its own page title via
  `useSiteMeta(PAGE_META.admin)`.
- `App.tsx`: new top-level `<Route path="admin">` tree (sibling to the
  storefront's `<Layout />` route, not nested inside it), wrapped in
  `RequireAdmin`, with `AdminLayout` as its element and `AdminDashboard`
  as its index route.
- `config/site.ts`: `PAGE_META.admin` entry.
- Tests: `src/lib/userStore.test.ts` (seeds exactly one admin account on
  first read, never duplicates/overwrites an existing one, strips
  passwords in `getRegisteredUsers()`), `src/lib/adminStats.test.ts`
  (live counts match underlying data, customer-role filtering, order
  summation across multiple accounts), `src/components/auth/
  RequireAdmin.test.tsx` (all three states: signed out → redirect;
  signed in non-admin → access-denied panel; signed in admin → protected
  content renders), `src/components/admin/AdminLayout.test.tsx` (every
  `ADMIN_NAV` entry appears; every unavailable one shows "Soon"),
  `src/pages/admin/AdminDashboard.test.tsx` (live counts render; page
  title set). `src/context/AuthProvider.test.tsx` gained two new tests
  (signup defaults to `role: "customer"`; the seeded admin can log in with
  its documented credentials).

### Changed
- `src/context/AuthContext.ts`: `AuthUser` gained a `role: "admin" |
  "customer"` field.
- `src/context/AuthProvider.tsx`: delegates all user-record storage to
  `lib/userStore.ts` instead of owning `readUsers`/`writeUsers`/
  `StoredUser` inline; `signup()` now always creates a `"customer"`-role
  account (no signup-time role picker); `login()`/`getInitialUser()` carry
  `role` through into the session's `AuthUser`.
- `src/context/AuthProvider.test.tsx`: existing `toEqual(...)` assertions
  on `result.current.user` updated to include `role: "customer"` — no
  other behavior changed.

### Notes
- **Decision made this phase** (per the brief's instruction to "decide and
  document the approach"): gate `/admin` with a `role` field on the
  existing mock user record rather than building a separate admin-only
  auth system. This keeps a single sign-in flow for the whole site and
  reuses all of Phase 6's existing session-persistence/validation work.
- The seeded admin account is a known, documented limitation, not a
  finished feature — there's no admin-user-management UI to create
  additional admins, promote a customer account, or rotate the seed
  credentials from within the app yet. Tracked in `MASTER_HANDOFF.md`
  Known Issues and slated for real hardening once `ROADMAP.md` Phase 26
  (Authentication, backend-integrated) lands.
- `AdminLayout` is a deliberately separate top-level route tree from the
  storefront's `<Layout />`-wrapped routes, not a nested child of it — the
  admin area has no use for the public navbar/footer/announcement bar, and
  keeping it separate makes it visually obvious you've left the storefront.
- Order count on the dashboard has the same limitation `Account.tsx`'s own
  order history already has: guest checkouts (nobody signed in) aren't
  persisted anywhere, so they aren't counted. Only orders placed while
  signed in are visible to `getOrdersForUser()`, and therefore to
  `getAdminStats()`.
- Build/lint/tests all verified clean: `tsc -b`, `npm run build`,
  `npx oxlint src` (0 warnings/errors), `npm test` (131/131 passing, 26
  files, up from 115/21).

## Phase 14 — Dynamic Pages

### Added
- `src/config/layouts/pages/types.ts` — `DynamicPageDefinition`, a
  `PageLayout` (Phase 11) plus `slug`, root-relative `path`, and `meta`
  (`title`/`description` for `useSiteMeta`). Unlike `AboutSectionKey`/
  `HomepageSectionKey`, its section-key union is the full `SectionKey`
  from `SECTION_REGISTRY` — a dynamic page isn't restricted to one page's
  curated subset.
- `src/config/layouts/pages/faq.ts` — `FAQ_PAGE`, the first real dynamic
  page definition. Reuses the existing `faq` section (unchanged) as its
  only section; closes the Phase 11/13 Known Issue that the FAQ accordion
  only existed as a homepage section with no routed page.
- `src/config/layouts/pages/index.ts` — `DYNAMIC_PAGES`, a `Record<string,
  DynamicPageDefinition>` registry keyed by slug. The one place a new
  standalone page gets registered.
- `src/pages/DynamicPage.tsx` — generic route component, the dynamic-page
  counterpart to `Home.tsx`/`About.tsx`/`Contact.tsx`'s Phase 11 rendering
  engines. Takes a `slug` prop (supplied by the `<Route>` that mounts it),
  looks the definition up in `DYNAMIC_PAGES`, and renders its
  `resolveLayoutSections()` output through `SECTION_REGISTRY` exactly like
  the three existing page-builder pages do. Falls back to the shared
  `NotFoundPanel` (from `pages/NotFound.tsx`) if the slug isn't
  registered.
- `App.tsx`: one new route, `<Route path="faq" element={<DynamicPage
  slug="faq" />} />`. Confirms the completion criterion: a second new page
  needs only a new `DynamicPageDefinition` object plus one route line —
  never a new page component.
- Tests: `src/pages/DynamicPage.test.tsx` (renders `/faq`'s sections;
  every registered page renders without the not-found fallback; an
  unregistered slug does fall back), `src/config/layouts/pages/
  index.test.ts` (registry shape: each entry's key matches its own
  `slug`, `path` is root-relative, `meta.title`/`meta.description` are
  non-empty, `sections` reference only known `SECTION_REGISTRY` keys with
  no duplicates, and resolve to at least one enabled section).

### Changed
- `src/config/navigation.ts`: footer "Help" group's "FAQ" link now points
  at `/faq` instead of the `/#faq` homepage-anchor link.

### Notes
- Home/About/Contact are untouched this phase — their own Phase 11
  rendering engines and layout configs (`config/layouts/{home,about,
  contact}.ts`) are unchanged, since each has a fixed, page-specific
  section-key union that `DynamicPage`/`DYNAMIC_PAGES` deliberately don't
  replace.
- The FAQ accordion still appears in two places (the homepage's `faq`
  section and the new standalone `/faq` page) - both are just the same
  registered `faq` component rendered from two different layout configs,
  not a duplicated component.
- Build/lint/tests all verified clean: `tsc -b`, `npm run build`,
  `npx oxlint src` (0 warnings/errors), `npm test` (115/115 passing, 21
  files, up from 109/19).

## Phase 13 — Content Architecture Completion

### Added
- `components/home/NewArrivals.tsx` — new homepage section, registered in
  `sectionRegistry.tsx` as `newArrivals`. Renders `data/products.ts`'s
  `NEW_ARRIVALS` (newest 8 by `createdAt`, most recent first) as a 2/4-col
  responsive grid of `ProductCard`s, deliberately date-driven rather than
  reusing `FeaturedProducts`'s tag-based list, so the two sections show
  genuinely different content.
- `data/products.ts`: `NEW_ARRIVALS` export — sorts the full catalog by
  `createdAt` descending and takes the top 8.
- `components/home/Collections.tsx` — new homepage section, registered as
  `collections`. Renders `data/collections.ts`'s `COLLECTIONS` as curated
  cards (title/description/item count), reusing the `CraftIcon`
  blob-illustration motif already used by `Categories`. Each card links to
  `/shop` today; a real `/collections/:slug` browsing page is left for
  Phase 14 (Dynamic Pages).
- `content/homepage.ts`: `NEW_ARRIVALS_SECTION`/`COLLECTIONS_SECTION`
  eyebrow/title/description copy for the two new sections.
- Both new sections added to `config/layouts/home.ts`'s `classic` layout
  (between Categories/Featured and Best Sellers/About respectively) and to
  the `HomepageSectionKey` union; not added to `minimal`/`modern`/`luxury`
  (each layout's section curation is a separate, per-layout decision).
- `pages/Policy.tsx` — new generic page, routed at `/policies/:slug`.
  Looks up `content/policies.ts`'s new `POLICY_PAGES` slug registry
  (`privacy`/`terms`/`shipping`/`returns`) and renders whichever
  `PolicyDocument` matches; an unknown slug renders the shared
  `NotFoundPanel` instead of a 404 redirect, so the URL stays intact.
- `content/policies.ts`: `POLICY_PAGES: Record<PolicySlug, PolicyDocument>`
  + `PolicySlug` type — the one place a new policy needs registering.
- `pages/NotFound.tsx`: extracted a `NotFoundPanel` presentational
  component (markup only, no `useSiteMeta` call) so `Policy.tsx` can reuse
  the exact 404 markup for an unknown slug without duplicating it or
  double-calling the site-meta hook.
- `config/navigation.ts`: footer "Help" group gained "Returns & Exchanges"
  (`/policies/returns`), "Privacy Policy" (`/policies/privacy`), and "Terms
  of Service" (`/policies/terms`) links; "Shipping Info" now correctly
  points at `/policies/shipping` (previously a dead `/shipping` link with
  no matching route — see Known Issues note below).
- `config/brandingMeta.ts` — new module holding just the pure-text
  branding fields (`businessName`/`tagline`/`businessDescription`/
  `favicon`/`themeColor`), deliberately free of the logo image import and
  the `@/` path alias so it can be loaded by a plain Node script outside
  Vite's module graph. `config/branding.ts` now spreads `BRANDING_META`
  into `BrandingConfig` rather than redeclaring those fields, so nothing
  else in the app needs to know they moved.
- `config/titleTemplate.ts` — new `buildTitle(businessName, tagline,
  pageTitle)` helper, extracted from the inline template that used to live
  directly in `config/site.ts`'s `titleTemplate`, so both the runtime
  `useSiteMeta` path and the new build-time sync script format page
  titles identically.
- `scripts/sync-index-html.mjs` — new build-time script that rewrites
  `index.html`'s static `<title>`, `<meta name="description">`,
  `<meta name="theme-color">`, and favicon `<link>` tags from
  `brandingMeta.ts`/`titleTemplate.ts`, so non-JS crawlers and
  pre-hydration social scrapers see correct metadata (previously only
  `useSiteMeta` kept these current, and only after React mounted). Wired
  into `npm run build` as its first step (`package.json`). Requires
  Node 22.6+ for native, unflagged TypeScript import support; no new
  dependency was added.
- Tests: `data/products.test.ts` (NEW_ARRIVALS derivation/ordering/cap),
  `components/home/NewArrivals.test.tsx`, `components/home/
  Collections.test.tsx`, `pages/Policy.test.tsx` (all 4 slugs + the
  not-found fallback), `config/titleTemplate.test.ts`.

### Changed
- `config/layouts/home.test.ts`: `ALL_SECTION_KEYS` now includes
  `newArrivals`/`collections`, keeping the "classic covers every section"
  assertion accurate.
- `config/branding.ts`, `config/site.ts`: refactored to source their pure
  text fields from `brandingMeta.ts`/`titleTemplate.ts` respectively (see
  Added) — no behavior change for any existing consumer of `branding` or
  `PAGE_META`.
- `index.html`: header comment updated to describe the new sync script
  instead of proposing one; running the script also fixed a pre-existing
  casing mismatch between the static `<title>` (`"Your Business
  Tagline"`) and the runtime-generated one (`"Your business tagline"`).
- `data/collections.ts`, `content/policies.ts`: doc comments updated now
  that both are actually consumed (previously noted as data-only/
  unwired).

### Notes
- QA: `tsc -b` clean; `npm run build` (including the new sync step) clean;
  `npx oxlint src` — 0 warnings/errors; `npm test` — **109/109 tests
  passing, 19 files** (up from 93/14).
- Collection detail browsing (`/collections/:slug`) was deliberately left
  for Phase 14 (Dynamic Pages) rather than built ahead of scope here — see
  the note in `components/home/Collections.tsx`.
- `minimal`/`modern`/`luxury` home layouts were not changed; only
  `classic` gained the two new sections in this phase.

---



Not a numbered feature phase — no application code changed. Preparation
for long-term, multi-session, multi-account development.

### Added
- `docs/` directory as the new home for the project's documentation chain.
- `docs/ROADMAP.md` — new single source of truth for phase sequencing.
  Broke every remaining large feature area (Content Architecture, Dynamic
  Pages, Admin CMS, Backend Integration, Authentication, Products, Orders,
  Inventory, Customers, Payments, Shipping, Notifications, Analytics, SEO,
  Performance, Commercial Release, Documentation) into 26 small,
  self-contained phases (13 through 38), each with Objective/Scope/
  Expected Deliverables/Completion Criteria and sized to fit one Claude
  session. Appended the permanent "Future Development Rules" every future
  session must follow (read the three docs, determine next phase,
  complete only one, verify build/lint/tests, update docs, stop for
  approval; split further if a phase proves too large).
- `docs/CONTINUE_DEVELOPMENT_PROMPT.md` — the standard prompt to paste at
  the start of every future session; requires no other context.

### Changed
- `docs/MASTER_HANDOFF.md` — carried forward from the root-level version
  with no loss of history (all 12 completed-phase summaries, architecture,
  folder/config structure, coding standards, design system, known issues,
  and technical debt preserved verbatim or updated only where a Known
  Issue is now scheduled against a specific `ROADMAP.md` phase). Added new
  **Development Workflow** and **Design Principles** sections. Removed
  embedded "Next Phase Objectives" detail — that planning now lives
  exclusively in `ROADMAP.md`; this file points to it instead of
  duplicating it, so the plan only has to be updated in one place.
- `docs/CHANGELOG.md` (this file) — copied forward from the root-level
  `CHANGELOG.md` with full Phase 1–12 history intact; this entry appended.
- Root `MASTER_HANDOFF.md` and `CHANGELOG.md` replaced with short pointer
  files directing to their `docs/` equivalents, so there's exactly one
  copy of the truth going forward.
- `README.md` updated to point contributors at `docs/` and the Continue
  Development prompt.

### Notes
- No `.tsx`/`.ts` source file was touched. `tsc -b`, `vite build`,
  `oxlint`, and `vitest run` are all unaffected by this pass (still 93/93
  tests passing, same production build output as Phase 12).
- Per project rules, no new feature work, UI redesign, refactor, Admin
  CMS, backend, payments, or shipping work was started in this pass.

---

## Phase 12 — Template Variants & Theme Presets

### Added
- `types/preset.ts` — `TemplatePreset` type (`id`, `name`, `description`,
  `theme: ThemeConfig`, `navStyle`, `footerStyle`, `heroStyle`,
  `sectionSpacing`) plus the `NavStyle`/`FooterStyle`/`HeroStyle`/
  `SectionSpacing` union types.
- `config/presets/` — 10 complete template presets, each a self-contained
  color palette + font pairing + radius scale + card/button style +
  nav/footer/hero layout + section spacing scale: `classic` (the
  template's original look, values unchanged), `minimal`, `modern`,
  `cute`, `luxury`, `fashion`, `bakery`, `restaurant`, `electronics`,
  `handmade`. `config/presets/index.ts` holds the `PRESETS` registry,
  `TEMPLATE_PRESETS` list, `ACTIVE_PRESET_ID` (the one line a
  white-labeled deployment edits to reskin the whole site), `activePreset`,
  and `applyPreset()`.
- `config/presets/index.test.ts` — validates every preset: id matches its
  registry key, no duplicate ids, non-empty name/description, every style
  field is a known variant, every color is a valid hex value, every radius
  is a valid CSS length, every font has a fallback stack; also asserts
  `classic` matches the original template's exact values.
- CSS hooks in `index.css` (`--btn-radius`, `--card-radius`,
  `--card-shadow`, `--card-border-color`) driven by the `data-button-style`/
  `data-card-style` attributes `applyTheme()` already wrote on `<html>`
  since Phase 1 but that nothing previously consumed.
- Google Fonts import in `index.css` expanded to cover every font family
  used across the 10 presets (Inter, Space Grotesk, Quicksand, Nunito,
  Playfair Display, Lato, Cormorant Garamond, Jost, alongside the existing
  Fraunces/Manrope).

### Changed
- `config/theme.ts` — dropped the single hardcoded default `theme` object
  (its values now live unchanged as `classic`'s `theme` field); `applyTheme()`
  now requires an explicit `ThemeConfig` argument instead of defaulting to
  the removed module-level constant.
- `main.tsx` — calls `applyPreset()` (from `config/presets`) instead of
  `applyTheme()` directly.
- `lib/sectionStyle.ts` — `PADDING_CLASS` is now one of four
  `SPACING_SCALES` rows (`compact`/`cozy`/`relaxed`/`spacious`), selected
  by `activePreset.sectionSpacing`. The `cozy` row is byte-for-byte the
  original Phase 11 values, so `classic` (`sectionSpacing: "cozy"`) renders
  identical padding to before this phase.
- `components/ui/Button.tsx` — shape is now `rounded-[var(--btn-radius)]`
  instead of a hardcoded `rounded-full`, so the active preset's
  `buttonStyle` (`rounded`/`pill`/`square`) actually changes the rendered
  radius.
- `components/ui/Card.tsx` — radius/shadow/border now read
  `--card-radius`/`--card-shadow`/`--card-border-color` instead of a
  hardcoded `rounded-lg border border-beige shadow-soft`, so the active
  preset's `cardStyle` (`soft`/`flat`/`outlined`) actually changes the
  rendered card, including a real visible border for `outlined`.
- `components/layout/Navbar.tsx` — rewritten to branch on
  `activePreset.navStyle`: `standard` (unchanged - logo left, links
  center, full icon cluster right), `centered` (logo on its own row,
  links + icons below), `minimal` (compact single row, links and
  secondary icons tucked behind the menu toggle at every breakpoint, not
  just mobile). All three variants share the same state, search panel,
  and `CartDrawer`.
- `components/layout/Footer.tsx` — rewritten to branch on
  `activePreset.footerStyle`: `columns` (unchanged - logo column + one
  column per `FOOTER_LINK_GROUPS` entry), `stacked` (everything centered
  in one column, link groups flattened to a wrapped row each), `minimal`
  (logo + social + copyright only, no link columns or squiggle). All
  three read the same `branding`/`business`/`FOOTER_LINK_GROUPS` config;
  social icons extracted into a shared `SocialLinks` subcomponent.
- `components/home/Hero.tsx` — rewritten to branch on
  `activePreset.heroStyle`: `illustrated` (unchanged - text left, three
  floating "blob" pieces right), `bold` (centered, larger type, tinted
  background block, no side visual), `minimal` (left-aligned, quiet,
  single primary CTA button plus a text-link secondary CTA, no blobs or
  squiggle). All three read the same `HERO` content and
  `title`/`subtitle`/`settings` overrides.

### Fixed
- N/A this phase.

### Removed
- `config/theme.ts`'s module-level `theme` constant (superseded by
  `config/presets/classic.ts`'s `theme` field - same values, new home).

### Refactored
- N/A beyond the Changed items above.

## Phase 11 — Dynamic Page Builder & Layout Manager

### Added
- `types/layout.ts` — `SectionSettings`, `SectionInstance<Key>`,
  `PageLayout<Key>`, `SectionOverrideProps`, and `resolveLayoutSections()`
  (filters to `enabled`, sorts by `order`). Shared by every page's layout
  config.
- `lib/sectionStyle.ts` — resolves a section's `settings` against its own
  hardcoded pre-Phase-11 defaults into Tailwind `py-*`/background/`max-w-*`
  classes, so an unconfigured section renders exactly as before.
- `config/sectionRegistry.tsx` — the single central section-key → component
  map (Part 4 of the phase brief), covering all 10 homepage sections plus
  the 5 new About sections and 2 new Contact sections below.
- `config/layouts/home.ts` — replaces `config/homepageLayouts.ts`.
  `HOME_LAYOUTS` preserves all four Phase 10 presets
  (`classic`/`minimal`/`modern`/`luxury`), now expressed as `SectionInstance`
  arrays (each with its own `enabled`/`order`/optional `title`/`subtitle`/
  `settings`) instead of plain key lists. `ACTIVE_HOME_LAYOUT` replaces
  `ACTIVE_HOMEPAGE_LAYOUT`.
- `config/layouts/about.ts` — `ABOUT_LAYOUT`, the `/about` page's section
  order/config.
- `config/layouts/contact.ts` — `CONTACT_LAYOUT`, the `/contact` page's
  section order/config.
- `config/layouts/shop.ts` — `SHOP_SETTINGS`, page-level display settings
  for `/shop` (`showSearch`, `showCategoryFilter`, `showSort`,
  `defaultSort`, `desktopColumns`). Deliberately a different, simpler shape
  than `PageLayout` — see below and `MASTER_HANDOFF.md` Known Issues.
- Five new About section components (`components/about/`): `AboutIntro`,
  `AboutStorySection` (keeps `id="story"` for the existing footer anchor
  link), `AboutProcess`, `AboutValuesSection`, `AboutCtaSection` — split out
  of the old monolithic `About.tsx`.
- Two new Contact section components (`components/contact/`):
  `ContactIntro` and `ContactDetails` (info cards + message form, kept as
  one section since they share a single responsive grid in the current
  design).
- `content/contact.ts` gained `CONTACT_INTRO` (eyebrow/title/description)
  — the `/contact` heading copy, previously hardcoded directly in
  `Contact.tsx`.
- `config/layouts/home.test.ts` — replaces `homepageLayouts.test.ts`;
  same coverage (every layout non-empty/hero-first/valid-keys/no-dupes,
  `classic` = full section set) plus a new test for
  `resolveLayoutSections()`'s sort/filter behavior.

### Changed
- All 10 homepage section components (`Hero`, `Categories`,
  `FeaturedProducts`, `BestSellers`, `AboutBrand`, `Testimonials`,
  `InstagramGallery`, `Newsletter`, `FAQ`, `ContactTeaser`) now accept
  optional `{ title, subtitle, settings }` overrides (`SectionOverrideProps`)
  on top of their existing `content/homepage.ts`-driven defaults, and
  compute their padding/background/width classes through
  `lib/sectionStyle.ts` instead of hardcoding them.
- `pages/Home.tsx` rewritten to resolve `HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]`
  via `resolveLayoutSections()` and render each enabled section from
  `SECTION_REGISTRY`, passing its `title`/`subtitle`/`settings` through.
- `pages/About.tsx` and `pages/Contact.tsx` rewritten the same way, over
  `ABOUT_LAYOUT`/`CONTACT_LAYOUT` — both were previously monolithic JSX
  pages with hardcoded section order.
- `pages/About.tsx`'s process-steps heading now reads `PROCESS_SECTION`
  from `content/about.ts` (via the new `AboutProcess` component) instead
  of a hardcoded string that had silently drifted from that same content
  file's `PROCESS_SECTION.title`. Its values-section heading now
  explicitly reads `VALUES_SECTION` too (previously coincidentally
  matching text hardcoded in the page).
- `pages/Shop.tsx` now reads `SHOP_SETTINGS` for its default sort order and
  gates the search input / category filter / sort dropdown on
  `showSearch`/`showCategoryFilter`/`showSort`; product grid column count
  at the `lg` breakpoint now follows `desktopColumns` instead of a
  hardcoded `lg:grid-cols-4`.
- `Home.test.tsx` updated to import from `config/layouts/home.ts` and
  assert against `resolveLayoutSections()`'s enabled-section count.

### Removed
- `config/homepageLayouts.ts` and `config/homepageLayouts.test.ts` —
  superseded by `config/layouts/home.ts` and `config/layouts/home.test.ts`.
  All prior functionality (named presets, `ACTIVE_HOMEPAGE_LAYOUT`)
  preserved under new names.

### Scope decisions (see `MASTER_HANDOFF.md` Known Issues for detail)
- Chose typed `.ts` config files under `config/layouts/` over literal
  `.json` files (the phase brief's example naming) since the project
  doesn't have `resolveJsonModule` enabled and this matches the existing
  `config/`/`content/` convention of typed, documented TS modules.
- Shop was deliberately **not** converted into the section-registry system
  — it's one interactive, URL-query-driven view rather than a stack of
  independent content blocks, and forcing it into reorderable sections
  would mean redesigning its layout. It gets page-level `settings` instead.
- No standalone `/faq` route or `faq.json`-equivalent was added — the FAQ
  section only exists today as a homepage section (already registry-backed
  and reorderable on `/`). Adding a new routed page is a feature addition,
  not a layout refactor, so it wasn't done without confirming scope.
- Consolidating every section's width/padding onto one 5-value shared scale
  moved two sections' default widths by one step from their exact
  pre-Phase-11 value (Newsletter and About's CTA: `max-w-2xl` →
  `max-w-3xl`), and splitting Contact into two sections changed its
  internal spacing slightly (one shared `py-16` block → `py-16` + `py-8`).
  Both are flagged as follow-up visual-QA items rather than silently
  accepted.

## Phase 10 — Multiple Homepage Layouts

### Documentation
- Consolidated all prior `HANDOFF-PHASE-N.md` files into this single
  `MASTER_HANDOFF.md` + `CHANGELOG.md` pair per project documentation
  rules, done at the start of this session before Phase 10 work began. Old
  phase handoff files retained for history, no longer updated going
  forward.

### Added
- `config/homepageLayouts.ts` — `HomepageSectionKey`/`HomepageLayoutId`
  types, `HOMEPAGE_LAYOUTS` registry (`classic`, `minimal`, `modern`,
  `luxury`, each an ordered list of section keys), and
  `ACTIVE_HOMEPAGE_LAYOUT` (the single config value that selects the live
  template; defaults to `classic`, preserving the exact prior homepage).
- `src/config/homepageLayouts.test.ts` — validates every layout is
  non-empty, opens with `hero`, references only known section keys with no
  duplicates, and that `classic` covers every section.
- `src/pages/Home.test.tsx` — asserts the number of rendered `<section>`
  elements matches the active layout's section count.

### Changed
- `pages/Home.tsx` rewritten from a fixed list of ten sections into a
  rendering engine: a `SECTION_COMPONENTS` registry maps every section key
  to its (single, shared) component, and `Home` maps over
  `HOMEPAGE_LAYOUTS[ACTIVE_HOMEPAGE_LAYOUT].sections` to render them in
  order. No section component was duplicated, forked, or rewritten to
  support this — `classic` renders pixel-identical output to pre-Phase-10
  `Home.tsx`.

### Fixed
- **Root cause**: `src/test/setup.ts` had no `IntersectionObserver`
  polyfill for jsdom. `useInView` (used by `Categories`, `BestSellers`,
  `AboutBrand`, `Testimonials`) calls `IntersectionObserver` on mount; no
  test before Phase 10 rendered a full page composed of those sections
  together, so the gap went unnoticed through Phases 1–9.
- **Fix**: added a minimal `MockIntersectionObserver` stub, installed via
  `vi.stubGlobal` in `src/test/setup.ts`, applied globally to every test.
- **Files changed**: `src/test/setup.ts` only.
- **Regression testing**: full suite re-run after the fix — 82/82 tests
  passing across 13 files (up from 77/11 pre-Phase-10), `tsc -b` clean,
  `vite build` clean, `oxlint src` clean (0 warnings/errors).

### Verified
- Manually toggled `ACTIVE_HOMEPAGE_LAYOUT` to `minimal` and confirmed
  `Home.test.tsx`'s section-count assertion tracked the change correctly,
  then reverted to `classic` before shipping.

## Phase 9 — Template Customization System

### Added
- `config/site.ts` — site-wide SEO/metadata config + per-route `PAGE_META`.
- `hooks/useSiteMeta.ts` — runtime hook setting `document.title` and meta/OG
  tags per page.
- `content/notFound.ts` — 404 page copy.
- `content/states.ts` — centralized loading/empty/error/offline copy.
- `data/collections.ts` — curated product collections (data layer only).
- `components/layout/AnnouncementBar.tsx` — dismissible site-wide banner,
  wired to the previously-inert `ANNOUNCEMENT` config.
- `SECTION_HEADINGS` in `content/homepage.ts`.
- `NEW_ARRIVALS` derived export in `data/products.ts`.

### Changed
- All home section components now read heading copy from
  `SECTION_HEADINGS` instead of hardcoded props.
- Every route now calls `useSiteMeta` to set its own title/description.
- `Loading`, `OfflineBanner`, `NotFound`, and all Empty/Error states across
  Cart/Wishlist/Account/Shop/ProductDetail/CartDrawer/ErrorBoundary now read
  copy from `content/states.ts`/`content/notFound.ts`.
- `Layout.tsx` mounts `AnnouncementBar`.

### Verified
- `tsc -b`, `vite build`, `oxlint src` (0 warnings/errors), `npm test`
  (77/77, 11 files) all clean.

## Phase 8A — Strip Branding to a Blank White-Label Template

### Changed
- Replaced all real CrafteeVee-specific strings, the real product/category
  catalog, the real logo/favicon, and CrafteeVee-derived code comments with
  generic placeholder content across `config/`, `content/`, `data/`, and
  `assets/`. No `.tsx` component touched.

### Verified
- `tsc -b`, `vite build`, `oxlint src`, `npm test` (77/77, 11 files) clean.

## Phase 8 — White-Label Architecture Conversion

### Added
- `src/config/` (branding, business, navigation, theme).
- `src/content/` (homepage, about, contact, policies).

### Changed
- Moved all business-specific content, branding, and category data out of
  component code into `config/`/`content/`/`data/`. Config layer still held
  real CrafteeVee values as defaults at end of this phase (addressed in 8A).
- `Navbar.tsx`, `Footer.tsx` and home section components made config/
  content-driven.
- `components/ui/CraftIcon.tsx` rewritten; `CategoryMosaic.tsx` added.

### Removed
- `src/data/home-content.ts` (moved into `content/homepage.ts`).
- `src/data/contact-content.ts` (moved into `content/contact.ts`, now
  derived from `config/business.ts`).

### Moved
- `src/assets/images/logo.png` → `src/assets/logo/logo.png` (assets split
  into `logo/`, `hero/`, `categories/`, `products/`, `icons/` subfolders).

### Verified
- `tsc -b`, `vite build`, `oxlint src`, `npm test` (77 tests, 11 files)
  clean.

## Phase 7 — Test Suite

### Added
- Vitest test runner (`vitest.config.ts`, separate from `vite.config.ts`).
- `src/test/setup.ts`, `src/test/utils.tsx`.
- Test files for `AuthProvider`, `CartProvider`, `WishlistProvider`,
  `RequireAuth`, `Login` page, and `lib/` utilities (`productFilters`,
  `checkout`, `orders`, `auth`, `cn`, `currency`).

### Verified
- 77 tests passing across 11 files. Coverage concentrated on state/logic
  rather than every page.

## Phase 6 — Accounts + About/Contact

### Added
- `AuthContext`/`AuthProvider` — mock signup/login/logout,
  `localStorage`-backed user records and session, protected `/account`
  route with per-user order history. Explicitly documented as not
  production-secure (plaintext passwords, no real backend).
- Real content for About and Contact pages.

## Phase 5 — Wishlist + Cart/Checkout

### Added
- `WishlistContext`/`WishlistProvider`, `localStorage`-persisted
  (`crafteevee-wishlist` at the time), product ids only.
- `WishlistButton` reusable component (`ProductCard`, `ProductDetail`).
- Full Cart → Checkout → Order Confirmation flow.

## Phase 4 — Product Detail Pages + Cart

### Added
- `pages/ProductDetail.tsx` at `/shop/:id`.
- `CartContext`/`CartProvider`, `localStorage`-persisted real cart state.
- Quantity stepper, add-to-cart confirmation messaging.

### Changed
- `ProductCard` now links to real product detail pages instead of `/shop`.

## Phase 3 — Shop

### Added
- Full `Shop.tsx`: category filtering, sorting, search — all wired into URL
  query params.
- Catalog expanded from 8 to 24 products (6 per category) in
  `data/products.ts`.

### Changed
- `FEATURED_PRODUCTS`/`BEST_SELLERS` now derived from the full catalog
  instead of separately hand-written.

## Phase 2 — Homepage

### Added
- Full `Home.tsx`: hero, categories, featured products, best sellers,
  about-brand, testimonials, Instagram gallery, newsletter signup, FAQ,
  contact teaser.
- `CraftIcon` illustrated "blob + icon" motif for product/category art (no
  stock photography).

## Phase 1 — Foundation

### Added
- Project scaffold (Vite + React 19 + TypeScript + Tailwind v4 + React
  Router v7 + Framer Motion).
- Design token system (colors/type/radius/shadow/motion) in `index.css`
  under `@theme`.
- Global layout (navbar + footer), dark mode.
- Core reusable UI kit: Button, Card, Input, Textarea, Modal, Spinner/
  LoadingState, Skeleton loaders, EmptyState/ErrorState/OfflineState,
  ErrorBoundary.
- `Squiggle` signature motif component.
