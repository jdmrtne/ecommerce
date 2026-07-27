# CrafteeVee — Phase 3 Handoff: Shop

## Progress Summary

**Current completed phase:** Phase 3 — Shop.

Built the full Shop page inside `src/pages/Shop.tsx`, replacing the
`<PagePlaceholder />` left over from Phase 1. Category filtering, sorting,
and search all landed as scoped, wired end-to-end into the URL so every
existing link that pointed at `/shop` with query params (the Footer's
`?sort=best-selling` / `?sort=newest`, the Navbar's previously-inert search
icon) now actually does something.

The mock catalog was the main prerequisite: Phase 2 only had 8 products
total (4 "featured," 4 "best sellers"), not enough for a real shop grid, so
`src/data/products.ts` was extended into a 24-product catalog (6 per
category) rather than replaced. `FEATURED_PRODUCTS` and `BEST_SELLERS` are
now *derived* from the full catalog instead of being separately hand-written,
so the Phase 2 homepage sections render pixel-identical output without any
changes to `Hero.tsx`, `FeaturedProducts.tsx`, or `BestSellers.tsx` —
verified by screenshot diff against the Phase 2 homepage.

### New features added
- **Category filter** (`CategoryFilter.tsx`) — pill row (All / Resin /
  Crochet / Candles / Stickers), horizontally scrollable on mobile, synced
  to `?category=`.
- **Sort** (`SortSelect.tsx`) — Featured (default/curated order), Best
  selling, Newest, Price low→high, Price high→low. Synced to `?sort=`, using
  the exact `best-selling` / `newest` values the Footer's Phase 1 links
  already used, so those links now work correctly instead of landing on an
  unsorted placeholder.
- **Search** — text input on the Shop page itself, plus the Navbar's search
  icon now opens an expandable search bar (was a no-op `onClick={() => {}}`
  since Phase 1/2 — this was explicitly called out as Phase 3 work in the
  Phase 2 handoff). Both write to the same `?q=` param, so searching from
  the Navbar or refining on the Shop page stay in sync without duplicated
  state.
- **Loading / empty / error states** — `fetchProducts()` simulates an async
  catalog load (same pattern as `Newsletter.subscribe()` from Phase 2) and
  shows `ProductGridSkeleton` while "loading," `EmptyState` with a "Clear
  filters" action when a filter/search combination matches nothing, and
  `ErrorState` with a "Retry" action wired to re-run the fetch (there's no
  real backend yet, so this can't actually fail today, but the UI and retry
  path are ready for when it's a real request).
- **Homepage category cards now filter Shop** — `Categories.tsx` links
  changed from a bare `/shop` to `/shop?category=<id>`, a one-line change
  that makes the homepage category grid actually useful now that Shop
  supports filtering.

### Bugs fixed
None found this session — Phase 2 was verified clean (build + lint both
passed before any Phase 3 code was written).

### Improvements made
- Lifted the PHP currency formatter out of `ProductCard.tsx` into
  `src/lib/currency.ts` (`formatPHP`), exactly as flagged as a "consider"
  in the Phase 2 handoff, since Shop needed it too. `ProductCard.tsx` now
  imports it instead of keeping a private copy.
- Added `src/lib/productFilters.ts` as a pure, dependency-free filter/sort
  function (`filterAndSortProducts`) instead of writing the logic inline in
  `Shop.tsx` — keeps it unit-testable and reusable if a future page needs
  the same filtering (e.g. a category landing page).

## Files

### Created
```
src/
├── components/
│   └── shop/
│       ├── CategoryFilter.tsx        (pill-style category filter)
│       └── SortSelect.tsx            (native <select>, styled to match Input)
├── lib/
│   ├── currency.ts                   (formatPHP - lifted out of ProductCard)
│   └── productFilters.ts             (filterAndSortProducts + label maps)
HANDOFF-PHASE-3.md
```

### Modified
- `src/pages/Shop.tsx` — replaced `<PagePlaceholder />` with the full shop
  experience (filter/sort/search + loading/empty/error states).
- `src/data/products.ts` — expanded from 8 mock products to a 24-product
  `ALL_PRODUCTS` catalog; `FEATURED_PRODUCTS`/`BEST_SELLERS` now derived
  from it (see Architecture Notes below).
- `src/types/product.ts` — added `createdAt: string` (required) and
  `salesRank?: number` (optional) to `Product`; added a `SortOption` type.
- `src/components/ui/ProductCard.tsx` — now imports `formatPHP` from
  `src/lib/currency.ts` instead of defining its own `Intl.NumberFormat`.
  No visual or behavioral change.
- `src/components/layout/Navbar.tsx` — search icon now toggles an
  expandable search bar (was inert). Icon swaps to an X while open. Submits
  to `/shop?q=<value>` via `useNavigate`.
- `src/components/home/Categories.tsx` — category cards link to
  `/shop?category=<id>` instead of a bare `/shop`.

### Removed
None.

## Architecture Notes

- **New reusable components**: `CategoryFilter`, `SortSelect` in
  `src/components/shop/` — a new folder alongside `home/` and `ui/`,
  following the same convention (page-section-specific components grouped
  by the page they belong to; generic ones stay in `ui/`).
- **New utilities**: `src/lib/currency.ts` (`formatPHP`), `src/lib/productFilters.ts`
  (`filterAndSortProducts`, `SORT_LABELS`, `CATEGORY_FILTER_LABELS`).
- **Data model change**: `ALL_PRODUCTS` in `src/data/products.ts` is now the
  single source of truth for every product on the site. `FEATURED_PRODUCTS`
  (`.filter(p => p.tag === "New")`) and `BEST_SELLERS`
  (`.filter(salesRank set).sort(by salesRank)`) are derived views, not
  separate arrays — if a future phase needs to add/remove a featured or
  best-selling item, do it by editing `tag`/`salesRank` on the entry in
  `ALL_PRODUCTS`, not by touching a second list.
- **State management**: still no global state. Shop's filter/sort/search
  state lives entirely in the URL (`useSearchParams`) rather than component
  state, so filtered views are shareable/bookmarkable and the Footer's
  existing sort links and the Navbar's search both "just work" by
  navigating to a URL rather than needing to reach into Shop's internals.
- **API changes**: none — `fetchProducts()` in `Shop.tsx` is a documented
  simulated call, same pattern as Newsletter's `subscribe()`.
- **Database changes**: none.
- **Configuration updates**: none — no new dependencies were installed,
  `package.json` is unchanged.

## QA Checklist

Verified this session (headless Chromium via Playwright, light + dark +
390px mobile, plus live click-through of interactive flows):
- [x] `npm run build` succeeds, `npm run lint` reports 0 errors/warnings
- [x] Shop renders correctly in light mode, dark mode, and mobile (390px) —
      2-column grid on mobile, 3-column at `sm`, 4-column at `lg`
- [x] Category filter: clicking a pill updates the URL, the grid, and the
      page heading (e.g. "Crochet & Plushies" when that category is active)
- [x] Sort: verified "Newest" surfaces the four July-2026-dated "New" items
      first; "Best selling" reproduces the exact same #1–#4 order as the
      homepage's Best Sellers section
- [x] Search: typing "candle" filters to only candle products; searching a
      nonsense string ("zzznotfound") shows `EmptyState` with a working
      "Clear filters" button that resets the URL and the local search input
- [x] End-to-end click-through: Footer's "Best Sellers" link → lands on
      `/shop?sort=best-selling` with correct order. Navbar search icon →
      bar opens → typing "earrings" + Enter → lands on `/shop?q=earrings`
      showing exactly the one matching product
- [x] Loading state: `ProductGridSkeleton` shimmer renders correctly before
      the simulated fetch resolves
- [x] Homepage regression check: screenshotted the full homepage after the
      `products.ts` refactor — Hero, Featured Products, and Best Sellers
      sections are pixel-identical to the Phase 2 handoff's described output
- [x] Keyboard: category filter buttons and the sort `<select>` are both
      natively focusable/operable; search input is a real `<input>` with
      `aria-label`

Still needs a human pass:
- [ ] Real browser check for the Navbar's expandable search bar on mobile
      Safari specifically (the `autoFocus` on open can behave inconsistently
      with the mobile keyboard across browsers)
- [ ] Content review — the 16 new mock products (names/prices/dates) I
      added to extend the catalog are placeholder copy; swap for the real
      catalog whenever it's ready, same as Phase 2's note about product data
- [ ] Decide whether `ProductCard` should keep linking every card to
      `/shop` once product detail pages exist — still a known, expected gap
      (see Known Issues)

## Known Issues

- `ProductCard` still links every card to `/shop` (not a real product
  detail page) since detail pages don't exist yet — unchanged from Phase 2,
  expected until a later phase builds them. Clicking a product while
  already on `/shop` currently does nothing useful (lands back on the same
  unfiltered `/shop`); worth revisiting once detail routes exist.
- No debounce on the Shop search input — filtering re-runs on every
  keystroke via `useMemo`. Not a real performance problem at 24 products,
  but worth adding a debounce if the catalog grows significantly.
- The simulated `fetchProducts()` can't actually fail, so `ErrorState`'s
  retry path is untestable in a meaningful way until a real API exists.
- No test suite yet (unchanged from Phase 1/2 — still slated for Phase 14).

## Remaining Tasks

- Nothing outstanding for Phase 3 as scoped. The human QA items above are
  worth a pass before calling it fully signed off.

## Next Phase

**Phase 4** — not yet defined in this handoff chain; check the original
project spec for what comes after Shop (likely product detail pages, given
`ProductCard`'s `/shop`-only linking is called out as a known gap in both
this and the Phase 2 handoff). Do not begin Phase 4 work until Phase 3 is
approved.

## Context for the Next Claude Session

- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config
  via `@theme` in `src/index.css`) + React Router v7 + Framer Motion.
  Unchanged from Phase 2.
- **Tokens**: unchanged from Phase 1/2 — still all in `src/index.css` under
  `@theme`. No new tokens were added this phase.
- **Product catalog**: `src/data/products.ts` now exports `ALL_PRODUCTS`
  (24 items, the real source of truth), plus `FEATURED_PRODUCTS` and
  `BEST_SELLERS` which are *derived* from it, not separate data. Any future
  phase adding/editing products should edit `ALL_PRODUCTS` entries directly
  — set `tag: "New"` to make something show up in Featured, or `salesRank`
  (1 = best) to make it show up in Best Sellers.
- **`Product` type** (`src/types/product.ts`) now requires `createdAt`
  (ISO date string) on every entry, and has an optional `salesRank`. A new
  `SortOption` type lives in the same file.
- **Currency formatting**: use `formatPHP()` from `src/lib/currency.ts`
  everywhere a price is displayed — don't redefine `Intl.NumberFormat`
  locally like Phase 2 did in `ProductCard.tsx`.
- **Filtering/sorting**: use `filterAndSortProducts()` from
  `src/lib/productFilters.ts` for any future page that needs the same
  category/search/sort behavior — it's a pure function, easy to reuse.
- **Shop's state lives in the URL**, not component state
  (`useSearchParams`). If a future phase adds e.g. pagination, follow the
  same pattern (a `?page=` param) rather than introducing local state that
  would make filtered views unshareable.
- **Navbar search** (`src/components/layout/Navbar.tsx`) now has real
  behavior: `isSearchOpen`/`searchValue` state, an expandable bar using the
  same `AnimatePresence`/`motion.div` height-animation pattern as the
  existing mobile menu, submits via `useNavigate` to `/shop?q=...`.
- **Known gotcha (repeated from Phase 1 & 2)**: lucide-react v1.x has no
  brand icons — use inline SVGs or a generic icon instead. Didn't come up
  this phase (no new icons needed beyond existing lucide imports:
  `Search`, `X`, `ChevronDown`) but still worth checking before Phase 4.
- **Completed**: full Phase 1 foundation + full Phase 2 homepage + full
  Phase 3 shop (filter/sort/search/loading/empty/error) as listed above.
- **Pending**: Phase 4 onward — likely product detail pages given the
  `ProductCard`-links-to-`/shop` gap flagged above, but confirm against the
  original project spec before starting.
- **No known bugs** as of this handoff — production build and lint both
  verified clean, visual QA done in light/dark/mobile via headless
  Chromium screenshots, and the Footer sort links + Navbar search were
  click-tested end-to-end this session.
