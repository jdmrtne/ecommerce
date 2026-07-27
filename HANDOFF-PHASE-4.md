# CrafteeVee — Phase 4 Handoff: Product Detail Pages + Cart

## Progress Summary

**Current completed phase:** Phase 4 — Product Detail Pages, with real cart
state/context (scope confirmed with the user before starting, since the
Phase 3 handoff didn't pin down Phase 4 in writing beyond flagging the
`ProductCard`-links-to-`/shop` gap).

Built `src/pages/ProductDetail.tsx` at a new `/shop/:id` route, and gave
the whole site a real, persisted cart (`CartContext` + `CartProvider`)
instead of the static `badge={0}` placeholder that's been in the Navbar
since Phase 1. `ProductCard` now links every card to its real detail page.

### New features added
- **Product detail page** (`/shop/:id`) — breadcrumb (Shop / Category /
  Product), large `CraftIcon` illustration (matches the site's established
  "no stock photos" visual language), rating, price, description, a spec
  bullet list (materials/dimensions/care), a quantity stepper, an "Add to
  cart" button with an auto-dismissing confirmation message, and a
  "More like this" related-products strip (same category, up to 4 items,
  reusing `ProductCard`).
- **Simulated fetch + loading/error/not-found states** — `fetchProductById()`
  follows the exact pattern `fetchProducts()` established in Shop (Phase 3):
  a `setTimeout`-wrapped promise standing in for a real API call.
  `ProductDetailSkeleton` (new, added to `Skeleton.tsx`) shows while
  "loading." An unmatched `:id` resolves to `undefined` and renders a
  friendly "Product not found" `EmptyState` with a "Back to shop" action,
  rather than a raw 404 — someone landing on a dead/old product link should
  get somewhere useful.
- **Real cart, site-wide** — `CartContext` + `CartProvider` (new
  `src/context/` folder), mounted once in `App.tsx` around the router.
  Persisted to `localStorage` using the exact same read-on-init /
  write-on-change pattern as `useTheme.ts`. Cart items store only
  `{ productId, quantity }`; product data (name/price/etc) is joined from
  `ALL_PRODUCTS` at read time via the `lines` field, so it can never drift
  from the catalog.
- **Navbar cart icon is now real** — badge shows `totalCount` from
  `CartContext` instead of a hardcoded `0`, and clicking it opens a new
  `CartDrawer` modal (built on the existing `Modal` component) instead of
  doing nothing. The drawer lists items with a thumbnail (`CraftIcon`),
  name (links to the detail page), price, a quantity stepper, a remove
  button, and a subtotal. No checkout button — checkout doesn't exist yet,
  so the drawer stops at "review and adjust what's in your cart," the same
  boundary the Phase 1 Navbar comment already drew around cart/wishlist.
- **New reusable `QuantityStepper`** (`src/components/ui/`) — used on both
  the product detail page and inside `CartDrawer`, so quantity controls
  look and behave identically everywhere. Accessible: real buttons with
  `aria-label`s that include the product name, `aria-live` count.

### Bugs fixed
None found this session — Phase 3 was verified clean (build + lint passed
before any Phase 4 code was written).

### Improvements made
- `ProductCard`'s stale "links to /shop for now" comment/behavior is gone —
  it now links to `/shop/${product.id}` everywhere it's used (Shop grid,
  homepage Featured/Best Sellers, and the new related-products strip),
  with no changes needed to the callers.
- Added a `ProductDetailSkeleton` to the existing `Skeleton.tsx` rather
  than starting a new file, keeping all skeleton variants in one place per
  the Phase 1/2/3 convention.

## Files

### Created
```
src/
├── context/
│   ├── CartContext.ts        (createContext, CartContextValue/CartLine types, useCart hook)
│   └── CartProvider.tsx      (CartProvider component - state, localStorage, derived values)
├── components/
│   ├── cart/
│   │   └── CartDrawer.tsx    (mini-cart modal opened from the Navbar)
│   └── ui/
│       └── QuantityStepper.tsx
├── pages/
│   └── ProductDetail.tsx
├── types/
│   └── cart.ts                (CartItem)
HANDOFF-PHASE-4.md
```

### Modified
- `src/types/product.ts` — added required `description: string` and
  optional `details?: string[]` to `Product`.
- `src/data/products.ts` — added `description`/`details` to all 24
  `ALL_PRODUCTS` entries. No products added/removed/reordered.
- `src/components/ui/ProductCard.tsx` — links to `/shop/${product.id}`
  instead of a bare `/shop`; updated the stale comment.
- `src/components/ui/Skeleton.tsx` — added `ProductDetailSkeleton`.
- `src/App.tsx` — added the `shop/:id` route and wrapped the router in
  `CartProvider`.
- `src/components/layout/Navbar.tsx` — cart `IconButton` now shows
  `totalCount` from `useCart()` and opens `CartDrawer` (new `isCartOpen`
  state) instead of a no-op; updated the stale Phase-1 comment about
  cart/wishlist being placeholders (wishlist still is; cart no longer is).

### Removed
None.

## Architecture Notes

- **New reusable components**: `QuantityStepper` (`src/components/ui/`),
  `CartDrawer` (`src/components/cart/` — new folder, following the same
  page/feature-grouping convention as `shop/`).
- **New utilities**: none beyond the context itself — no new `lib/` files
  needed this phase.
- **State management**: first global state in the app. `CartContext` +
  `CartProvider` (`src/context/`), split into two files on purpose —
  `CartContext.ts` holds the context object, types, and `useCart()` hook;
  `CartProvider.tsx` holds the actual provider component. This keeps
  `oxlint`'s `react/only-export-components` rule happy (component files
  exporting only components) and mirrors why Phase 3 kept `productFilters.ts`
  as a plain function file instead of inlining logic. `CartProvider` wraps
  `<BrowserRouter>` in `App.tsx`, not just `<Layout>`, since it has no
  routing dependency.
- **Data model**: `Product` gained `description` (required) and `details`
  (optional string array). Every catalog entry has both now, so no
  component needs to handle a missing `description`. `details` is
  genuinely optional (rendered conditionally) in case a future product
  entry doesn't have clean spec bullets.
- **Cart persistence**: `localStorage` key `crafteevee-cart`, read on init
  / written on every change — same shape as `useTheme.ts`'s
  `crafteevee-theme` key. On load, any stored item whose `productId` no
  longer exists in `ALL_PRODUCTS` is silently dropped (defensive; matters
  once the catalog becomes a real API and can change under a stale
  localStorage cart).
- **API changes**: none — `fetchProductById()` in `ProductDetail.tsx` is a
  documented simulated call, same pattern as `fetchProducts()` (Shop) and
  `subscribe()` (Newsletter, Phase 2).
- **Database changes**: none.
- **Configuration updates**: none — no new dependencies were installed,
  `package.json` is unchanged from Phase 3.

## QA Checklist

Verified this session (headless Chromium via Playwright against a
production `vite build` + `vite preview`, light + dark + 390px mobile,
plus live click-through of interactive flows):
- [x] `npm run build` succeeds, `npm run lint` reports 0 errors/warnings
- [x] Shop → clicking any `ProductCard` (grid, and previously featured/best
      seller cards) lands on the correct `/shop/:id`
- [x] Product detail renders correctly in light mode, dark mode, and
      mobile (390px) — two-column desktop layout collapses to a single
      stacked column on mobile
- [x] Breadcrumb links (Shop, category) navigate correctly; category link
      lands on `/shop?category=<id>` pre-filtered, reusing Phase 3's
      existing filter wiring
- [x] Quantity stepper: increments/decrements correctly, disables at
      min (1) / max (10)
- [x] Add to cart: adds the selected quantity, shows an auto-dismissing
      "Added N pieces" confirmation, Navbar badge updates immediately
- [x] Cart persists across a full page reload (`localStorage`) — verified
      badge count survives `page.reload()`
- [x] Cart drawer: opens from the Navbar cart icon, lists items with
      correct name/price/line subtotal, quantity stepper updates the line
      and the drawer subtotal live, remove button removes the line, empty
      state shows when the cart has nothing in it
- [x] Not-found product id (e.g. `/shop/does-not-exist`) shows a friendly
      "Product not found" state with a working "Back to shop" button,
      not a raw crash or a silent blank page
- [x] Related products section shows up to 4 same-category items,
      excluding the current product, and is hidden entirely (no empty
      section) when there are none
- [x] Loading state: `ProductDetailSkeleton` renders before the simulated
      fetch resolves
- [x] Homepage regression check: screenshotted the full homepage after
      this session's changes — Hero, Featured Products, Best Sellers, and
      every other section render with zero console errors
- [x] Keyboard/screen reader: quantity buttons and remove buttons have
      `aria-label`s that include the product name; the "Added to cart"
      message uses `role="status"`; breadcrumb uses `aria-current="page"`
      on the current item

Still needs a human pass:
- [ ] Real browser check on an actual mobile device (Playwright's mobile
      viewport emulation was used here, not a physical device)
- [ ] Content review — the descriptions/details added to all 24 products
      this session are placeholder copy in the same spirit as the mock
      catalog itself; swap for real product copy whenever it's ready
- [ ] Decide whether `CartDrawer`'s missing checkout button needs a
      "Checkout coming soon" affordance before this ships publicly, or
      whether it's fine to stay silent about it until a real checkout
      phase exists (left silent this session to avoid a dead-end button)

## Known Issues

- No checkout flow — `CartDrawer` shows a subtotal but has no checkout
  action. Intentional for this phase's scope (real cart *state*, not a
  full purchase flow); worth flagging clearly as the next likely
  cart-adjacent phase.
- Wishlist (`Heart` icon in the Navbar) is still an inert placeholder,
  unchanged from Phase 1 — not part of this phase's approved scope.
- `MAX_QTY` (10) is a hardcoded constant in `CartProvider.tsx` since there's
  no real stock/inventory field on `Product` yet. If a future phase adds
  per-product stock, quantity limits should read from that instead of a
  flat constant.
- The simulated `fetchProductById()` can't actually fail, so
  `ProductDetail`'s error-state retry path is untestable in a meaningful
  way until a real API exists (same known limitation Shop's `ErrorState`
  has since Phase 3).
- No test suite yet (unchanged from Phase 1/2/3 — still slated for Phase 14).

## Remaining Tasks

- Nothing outstanding for Phase 4 as scoped. The human QA items above are
  worth a pass before calling it fully signed off.

## Next Phase

**Phase 5** — not yet defined/confirmed with the user. Natural candidates
given what's now built: a full cart/checkout page (the `CartDrawer`'s
missing checkout button points directly at this), or the wishlist feature
the Navbar's `Heart` icon has been waiting on since Phase 1. Do not begin
Phase 5 work until scope is confirmed and Phase 4 is approved.

## Context for the Next Claude Session

- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config
  via `@theme` in `src/index.css`) + React Router v7 + Framer Motion.
  Unchanged from Phase 1-3.
- **Tokens**: unchanged — still all in `src/index.css` under `@theme`. No
  new tokens were added this phase.
- **Product catalog**: `src/data/products.ts` exports `ALL_PRODUCTS` (24
  items). Every entry now requires `description`; `details` is optional.
  If a future phase adds products, include both (or at least
  `description` — it's required by the `Product` type, so `tsc` will
  catch a missing one).
- **Cart**: `useCart()` from `@/context/CartContext` gives you
  `{ items, lines, totalCount, subtotal, addItem, removeItem,
  updateQuantity, clearCart }`. Use `lines` (not `items`) for anything
  that renders product info — it's the pre-joined, ready-to-render view.
  `CartProvider` is mounted once in `App.tsx`; don't mount it again
  anywhere else (context would just shadow itself).
- **Routing**: `/shop/:id` → `ProductDetail`. `useParams<{ id: string }>()`
  is how it reads the id; a missing/unmatched id is *not* routed to
  `NotFound` (the app-wide 404) — it renders its own in-page
  "Product not found" state instead, since the route itself is valid.
- **QuantityStepper** (`src/components/ui/QuantityStepper.tsx`) is generic
  — reuse it for any future numeric stepper (e.g. a future cart page)
  rather than writing another one.
- **Known gotcha (repeated from Phase 1-3)**: lucide-react v1.x has no
  brand icons — use inline SVGs or a generic icon instead. Didn't come up
  this phase (only used existing/common icons: `ChevronRight`, `Check`,
  `Star`, `Minus`, `Plus`, `X`).
- **Completed**: full Phase 1 foundation + Phase 2 homepage + Phase 3 shop
  + Phase 4 product detail pages and real cart state, as listed above.
- **Pending**: Phase 5 onward — likely cart/checkout or wishlist, but
  confirm with the user before starting either (this phase's scope was
  explicitly confirmed up front rather than assumed, and that worked well).
- **No known bugs** as of this handoff — production build and lint both
  verified clean, visual QA done in light/dark/mobile via headless
  Chromium screenshots against a production build, and the full
  shop → detail → add to cart → cart drawer → reload-persistence flow was
  click-tested end-to-end this session with zero console errors.
