# CrafteeVee — Phase 5 Handoff: Wishlist + Cart/Checkout

## Progress Summary

**Current completed phase:** Phase 5 — Wishlist feature and a full Cart →
Checkout → Order Confirmation flow (scope confirmed with the user up front:
"both", i.e. the two candidates the Phase 4 handoff had flagged).

### New features added

- **Wishlist, site-wide** — `WishlistContext` + `WishlistProvider` (new
  `src/context/` files), mounted in `App.tsx` alongside `CartProvider`.
  Persisted to `localStorage` (`crafteevee-wishlist`) using the exact same
  read-on-init / write-on-change pattern as `CartProvider`. Only product
  ids are stored; product data is joined from `ALL_PRODUCTS` at read time
  via `items`, mirroring how `CartProvider` joins `lines`.
- **`WishlistButton`** (new, `src/components/ui/`) — reusable heart toggle.
  Used on `ProductCard` (stacked with the tag badge in the top-right
  corner of the image) and on `ProductDetail` (next to "Add to cart").
  Stops event propagation so tapping it inside a `ProductCard`'s `<Link>`
  toggles the wishlist instead of navigating to the product page.
- **`/wishlist` page** (new) — grid of saved products, reusing
  `ProductCard` and `EmptyState`. No simulated fetch here (unlike
  Shop/ProductDetail) — wishlist data never left the browser, so there's
  nothing to "load."
- **Navbar wishlist icon is now real** — badge shows the live wishlist
  count and the icon navigates to `/wishlist` (a page, not a drawer —
  wishlists tend to get browsed, not glanced at, so a full page fit
  better than mirroring `CartDrawer`).
- **`/cart` page** (new) — full-page cart review: the roomier counterpart
  to the Navbar's `CartDrawer`. Same line-item editing (quantity, remove)
  as the drawer, plus an order-summary sidebar with "Proceed to checkout."
- **`/checkout` page** (new) — shipping form (contact + address), payment
  method (Cash on Delivery / GCash-or-bank-transfer — both plausible for a
  Philippines-based shop, no real payment processing exists), live order
  summary with shipping fee (₱80, free at ₱1,500+ subtotal), and a
  simulated order submission (`placeOrder()`, same fake-latency pattern as
  Newsletter's `subscribe()` from Phase 2). Redirects to `/cart` if
  there's nothing to check out.
- **`/order-confirmation` page** (new) — receipt shown after a successful
  order: order number, line items, totals, shipping address. Order data
  arrives via router `location.state` (set by Checkout's `navigate` call)
  rather than global state, since it's a one-time receipt. A visit with no
  state redirects to `/shop`.
- **`CartDrawer`'s missing checkout button is filled in** — the Phase 4
  handoff flagged this as an open question. The drawer's primary CTA is
  now "View cart & checkout" → `/cart` (a modal is the wrong place for a
  multi-field shipping form, so the drawer hands off to the full page
  rather than growing a form itself). "Continue shopping" is now a
  secondary text link below it.
- **`src/lib/checkout.ts`** (new) — `validateCheckout()` (required-field +
  email-format validation), `PAYMENT_METHODS`, `SHIPPING_FEE`/
  `FREE_SHIPPING_THRESHOLD` constants, and `placeOrder()` (the simulated
  submission). Keeping the shipping-fee math in one function means Cart,
  Checkout, and the confirmation page can't drift out of sync on the
  number shown.
- **`src/types/order.ts`** (new) — `CheckoutFormData`, `OrderLine`,
  `Order`, `PaymentMethod`. `OrderLine` is a snapshot (name/price copied
  at order time), not a live join back to `ALL_PRODUCTS`, since a real
  order shouldn't silently change if the catalog changes later.

### Bugs fixed

None found this session — Phase 4 was verified clean (build + lint
passed before any Phase 5 code was written).

### Improvements made

- `ProductCard`'s top-right corner now stacks the tag badge and the
  wishlist heart in a `flex-col` wrapper instead of each being
  independently `absolute`-positioned, so both can coexist without
  overlapping regardless of whether a tag is present.

## Files

### Created
```
src/
├── context/
│   ├── WishlistContext.ts     (createContext, WishlistContextValue, useWishlist hook)
│   └── WishlistProvider.tsx   (WishlistProvider component - state, localStorage, derived values)
├── components/
│   └── ui/
│       └── WishlistButton.tsx (heart toggle, used on ProductCard + ProductDetail)
├── pages/
│   ├── Wishlist.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   └── OrderConfirmation.tsx
├── lib/
│   └── checkout.ts            (validation, shipping constants, simulated placeOrder)
├── types/
│   └── order.ts                (CheckoutFormData, OrderLine, Order, PaymentMethod)
HANDOFF-PHASE-5.md
```

### Modified
- `src/App.tsx` — added `WishlistProvider` (wrapping the router alongside
  `CartProvider`) and four new routes: `wishlist`, `cart`, `checkout`,
  `order-confirmation`.
- `src/components/layout/Navbar.tsx` — Wishlist `IconButton` now shows the
  real `count` from `useWishlist()` and navigates to `/wishlist` instead
  of a no-op; updated the doc comment (both cart and wishlist are real now).
- `src/components/cart/CartDrawer.tsx` — primary action is now "View cart
  & checkout" (navigates to `/cart`), with "Continue shopping" demoted to
  a secondary text link; updated the doc comment.
- `src/components/ui/ProductCard.tsx` — added `WishlistButton`, stacked
  with the tag badge in the top-right corner.
- `src/pages/ProductDetail.tsx` — added `WishlistButton` next to
  "Add to cart."

### Removed
None.

## Architecture Notes

- **New reusable components**: `WishlistButton` (`src/components/ui/`).
- **New utilities**: `src/lib/checkout.ts` (`validateCheckout`,
  `placeOrder`, `PAYMENT_METHODS`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD`).
- **State management**: second global context, same shape as Phase 4's
  cart. `WishlistContext` + `WishlistProvider` (`src/context/`), split
  into two files for the same `react/only-export-components` /
  component-file-purity reason `CartContext`/`CartProvider` were split.
  `WishlistProvider` wraps `<BrowserRouter>` in `App.tsx`, same as
  `CartProvider` — nesting order between the two doesn't matter, since
  neither reads from the other.
- **Data model**: `CheckoutFormData`/`OrderLine`/`Order`/`PaymentMethod`
  added in `src/types/order.ts`. No changes to `Product` this phase.
- **Wishlist persistence**: `localStorage` key `crafteevee-wishlist`, an
  array of product ids (not full items) — same defensive
  stored-id-no-longer-in-catalog filtering as `CartProvider`.
- **Checkout flow / order placement**: no real backend, same as every
  other "form submit" in the app. `placeOrder()` in `src/lib/checkout.ts`
  is a documented `setTimeout`-wrapped promise, same pattern as
  `fetchProducts()`/`fetchProductById()` (Shop/ProductDetail) and
  `subscribe()` (Newsletter). Order data is handed to
  `OrderConfirmation` via React Router's `navigate(path, { state })`
  rather than stored anywhere global — it's a one-time receipt, not
  something that needs to survive independently of that specific
  navigation.
- **Shipping fee logic**: flat ₱80, free at a ₱1,500+ subtotal — both are
  named constants in `src/lib/checkout.ts` (`SHIPPING_FEE`,
  `FREE_SHIPPING_THRESHOLD`), not repeated magic numbers, so Cart,
  Checkout, and the confirmation receipt can't disagree.
- **API changes**: none — `placeOrder()` is a documented simulated call,
  matching the existing pattern.
- **Database changes**: none.
- **Configuration updates**: none — no new dependencies were installed,
  `package.json` is unchanged from Phase 4.

## QA Checklist

Verified this session (headless Chromium via Playwright against a
production `vite build` + `vite preview`, plus a scripted click-through
of every interactive flow — 21/22 automated checks passed; the one
"failure" turned out to be a correct browser behavior, not a bug, see
Known Issues):

- [x] `npm run build` succeeds, `npm run lint` (`oxlint src`) reports 0
      errors/warnings
- [x] Wishlist heart on a `ProductCard` toggles without navigating to the
      product page; Navbar wishlist badge updates immediately
- [x] Wishlist heart on `ProductDetail` toggles independently and stays in
      sync with the same product's card elsewhere
- [x] `/wishlist` shows saved products; persists across a full page reload
- [x] Empty wishlist shows `EmptyState` with a working "Browse the shop"
      action
- [x] Add to cart still works exactly as in Phase 4 (badge updates,
      confirmation message shows)
- [x] `CartDrawer` → "View cart & checkout" closes the drawer and lands on
      `/cart` with the same items and subtotal
- [x] `/cart` → "Proceed to checkout" lands on `/checkout`
- [x] Submitting the checkout form empty shows validation errors on every
      required field and does not navigate away
- [x] Filling the form correctly and submitting shows a loading state on
      the submit button, then navigates to `/order-confirmation` with the
      correct order number, line items, subtotal, shipping fee, total,
      and shipping address
- [x] Cart badge is cleared (back to no badge) immediately after an order
      is placed
- [x] Direct visit to `/checkout` with an empty cart redirects to `/cart`
- [x] Empty `/cart` shows `EmptyState` with a working "Browse the shop"
      action
- [x] A genuinely fresh visit to `/order-confirmation` (new browser
      context, no prior navigation) redirects to `/shop`
- [x] Light mode, dark mode, and mobile (390px) visual check via
      screenshots: Shop (with wishlist hearts), Cart, Wishlist, Product
      Detail (with wishlist button next to Add to cart), Checkout (full
      form + payment method group + order summary) — all render cleanly,
      zero console errors from the app itself (only pre-existing 403s
      from Google Fonts, which is a sandboxed-environment network
      restriction, not an app issue)
- [x] Homepage regression check: Home, Shop, and ProductDetail still work
      exactly as they did at the end of Phase 4

Still needs a human pass:
- [ ] Real browser check on an actual mobile device (Playwright's mobile
      viewport emulation was used here, not a physical device)
- [ ] Content review — shipping fee (₱80) and free-shipping threshold
      (₱1,500) are placeholder numbers chosen to feel plausible against
      the ₱85–₱890 catalog price range; swap for real numbers whenever
      they're decided
- [ ] Decide whether the GCash/bank-transfer payment option needs any
      additional confirmation step (e.g. "we'll email payment
      instructions") before this ships publicly — left simple this
      session since there's no real payment processing to hook up yet

## Known Issues

- **Refreshing `/order-confirmation` in the same tab right after
  placing an order still shows the receipt (does not redirect).** This
  is correct, expected browser behavior, not a bug: the browser's History
  API preserves `location.state` across a same-URL reload, so a user who
  accidentally hits refresh right after checkout doesn't lose their
  receipt. A genuinely fresh visit (new tab, or navigating in from
  elsewhere with no prior history entry for that URL) does redirect to
  `/shop` as intended — verified separately with a brand-new browser
  context. Worth knowing about if this ever gets debugged again, since a
  same-tab-refresh test will look like a "failure" against a naive
  "redirects to /shop" assertion when it's actually working as designed.
- No payment processing — "Place order" is a simulated submission with no
  real payment gateway behind either payment method. Intentional for this
  phase's scope (real checkout *flow* and *state*, not real payments).
- No order history — a placed order only exists as the receipt shown once
  on `/order-confirmation`; there's no account area or "my orders" list
  to look it up again afterward. Not part of this phase's scope (no
  accounts/auth exist yet at all).
- `MAX_QTY` (10, from Phase 4's `CartProvider`) is unchanged and still a
  hardcoded constant — same known limitation as before.
- The simulated `placeOrder()`/`fetchProductById()`/`fetchProducts()`
  can't actually fail, so their error-state retry paths remain untestable
  in a meaningful way until a real API exists (same known limitation
  since Phase 3).
- No test suite yet (unchanged from Phase 1-4 — still slated for Phase 14).

## Remaining Tasks

- Nothing outstanding for Phase 5 as scoped. The human QA items above are
  worth a pass before calling it fully signed off.

## Next Phase

**Phase 6** — not yet defined/confirmed with the user. Natural candidates
given what's now built: user accounts (needed for real order history,
which Phase 5's Known Issues flags as missing), or the About/Contact
pages (still `PagePlaceholder` stubs from Phase 1/2 and the only
remaining unbuilt nav destinations). Do not begin Phase 6 work until
scope is confirmed and Phase 5 is approved.

## Context for the Next Claude Session

- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config
  via `@theme` in `src/index.css`) + React Router v7 + Framer Motion.
  Unchanged from Phase 1-4.
- **Tokens**: unchanged — still all in `src/index.css` under `@theme`. No
  new tokens were added this phase.
- **Product catalog**: unchanged from Phase 4 — `src/data/products.ts`
  exports `ALL_PRODUCTS` (24 items, prices ₱85-₱890).
- **Cart**: unchanged API from Phase 4 — `useCart()` from
  `@/context/CartContext`. Still `{ items, lines, totalCount, subtotal,
  addItem, removeItem, updateQuantity, clearCart }`.
- **Wishlist** (new): `useWishlist()` from `@/context/WishlistContext`
  gives you `{ productIds, items, count, isWishlisted, toggleWishlist,
  removeItem, clearWishlist }`. Use `items` (not `productIds`) for
  anything that renders product info. `WishlistProvider` is mounted once
  in `App.tsx`, alongside `CartProvider` — don't mount it again anywhere
  else.
- **Checkout**: `useCart()`'s `clearCart()` is called right after a
  successful `placeOrder()`, before navigating to
  `/order-confirmation`. If you touch `Checkout.tsx`, keep the
  `placedOrder` state guard on the empty-cart redirect effect — without
  it, the redirect-to-`/cart` effect races the navigate-to-
  `/order-confirmation` call and can win, since `clearCart()` empties
  `lines` a render before the navigate takes effect.
- **Routing**: new routes this phase are `/wishlist`, `/cart`,
  `/checkout`, `/order-confirmation`. All hang off the same `<Layout />`
  as everything else.
- **Known gotcha (repeated from Phase 1-4)**: lucide-react v1.x has no
  brand icons — use inline SVGs or a generic icon instead. Didn't come up
  this phase (only used existing/common icons plus `Heart` and
  `CircleCheck`, both already used elsewhere in the app).
- **Completed**: full Phase 1 foundation + Phase 2 homepage + Phase 3 shop
  + Phase 4 product detail/cart + Phase 5 wishlist and cart/checkout/
  order-confirmation, as listed above.
- **Pending**: Phase 6 onward — likely accounts or About/Contact content,
  but confirm with the user before starting either.
- **No known bugs** as of this handoff — production build and lint both
  verified clean; the one thing that looked like a bug during this
  session's QA (refresh-preserves-receipt) turned out to be correct
  browser behavior on investigation, not a defect — see Known Issues for
  the full explanation if it comes up again.
