# CrafteeVee — Phase 2 Handoff: Homepage

## Progress Summary

**Current completed phase:** Phase 2 — Homepage.

Built full homepage content inside `src/pages/Home.tsx`, replacing the
`<PagePlaceholder />` left over from Phase 1. All ten sections scoped for
this phase are in: hero, categories, featured products, best sellers,
about-brand, testimonials, Instagram gallery, newsletter signup, FAQ, and a
contact teaser. About.tsx, Contact.tsx, and Shop.tsx were intentionally
**not** touched — they stay on their Phase 1 placeholders since those pages
belong to later phases; the homepage's `#story`, `#faq`, and `#contact`
anchors satisfy the Footer's existing links to those sections in the
meantime.

No real product photography exists yet, so rather than dropping in
unrelated stock photos, product/category art is an illustrated "blob +
icon" motif (`CraftIcon`) built from the existing design tokens — it echoes
the sparkle/squiggle signature from Phase 1 and reads as intentional rather
than a placeholder.

### New features added
- **Hero** — headline, subhead, two CTAs, and an illustrated composition of
  three floating craft-icon blobs (gentle bob animation, respects
  `prefers-reduced-motion` via the global rule already in `index.css`).
- **Categories** — 4-card grid (resin, crochet, candles, stickers), links to
  `/shop`.
- **Featured Products** — horizontal scroll-snap strip of 4 "New" tagged
  items.
- **Best Sellers** — 4-card ranked grid (#1–#4 badges), genuinely ordered by
  mock sales rank.
- **About Brand** (`#story`) — brand story copy + icon mosaic, links to
  `/about`.
- **Testimonials** — 3 customer quote cards with star ratings and initials
  avatars (no fake photos).
- **Instagram Gallery** — 6 decorative tiles with caption/like-count,
  external links point to `#` for now (matches the Footer's existing
  Instagram placeholder from Phase 1).
- **Newsletter** — real client-side flow: email validation, loading state,
  success state, error state. No backend exists yet, so `subscribe()` in
  `Newsletter.tsx` simulates the request — swapping in a real API call is a
  one-function change.
- **FAQ** (`#faq`) — accessible single-open accordion, 5 questions.
- **Contact Teaser** (`#contact`) — quick contact info cards + CTA to
  `/contact`.

### Bugs fixed
- Caught before it shipped: used the `Instagram` icon from `lucide-react`
  in a first draft of `ContactTeaser`, which doesn't exist in the installed
  v1.x (the exact gotcha flagged in the Phase 1 handoff). Swapped for
  `AtSign`.
- `ProductCard`'s focus ring used `focus-within:ring-2`, but the `<Link>`
  wrapping the `<Card>` is itself the focusable element, not a descendant,
  so the ring never would have shown on keyboard focus. Changed to
  `group-focus-visible:ring-2` on the `<Card>` with `group` on the `<Link>`.

### Improvements made
- Added a reusable `useInView` hook (IntersectionObserver-based) so
  sections fade in on scroll using the existing `animate-fade-up` token,
  instead of reaching for `framer-motion` on every section and adding more
  bundle weight.

## Files

### Created
```
src/
├── types/
│   └── product.ts                    (Product, Category, CraftCategory types)
├── data/
│   ├── products.ts                   (CATEGORIES, FEATURED_PRODUCTS, BEST_SELLERS mock data)
│   └── home-content.ts               (TESTIMONIALS, FAQS, INSTAGRAM_TILES mock data)
├── hooks/
│   └── useInView.ts                  (scroll-into-view reveal hook)
├── components/
│   ├── ui/
│   │   ├── SectionHeading.tsx        (eyebrow + heading + squiggle, reused by every section)
│   │   ├── CraftIcon.tsx             (illustrated blob+icon, stands in for product photos)
│   │   ├── ProductCard.tsx           (reusable - will serve Phase 3 Shop grid too)
│   │   └── Accordion.tsx             (accessible single-open accordion)
│   └── home/
│       ├── Hero.tsx
│       ├── Categories.tsx
│       ├── FeaturedProducts.tsx
│       ├── BestSellers.tsx
│       ├── AboutBrand.tsx
│       ├── Testimonials.tsx
│       ├── InstagramGallery.tsx
│       ├── Newsletter.tsx
│       ├── FAQ.tsx
│       └── ContactTeaser.tsx
```

### Modified
- `src/pages/Home.tsx` — replaced `<PagePlaceholder />` with the composed
  section list.
- `src/index.css` — added one new token, `--animate-float` (+ its
  `@keyframes float`), following the existing `@theme` pattern, used only
  by the hero's floating illustration.

### Removed
None.

## Architecture Notes

- **New reusable components**: `SectionHeading`, `ProductCard`, `CraftIcon`,
  `Accordion` — all live in `src/components/ui/` alongside the Phase 1 kit
  and follow the same prop/style conventions (`cn()`, `className` overrides,
  `forwardRef` where interactive).
- **New utility**: `useInView` hook in `src/hooks/`, same pattern as
  `useTheme`/`useOnlineStatus`.
- **State management**: still none beyond local component state
  (`useState` in `Newsletter.tsx` for the form, `useState` in `Accordion`
  for open/closed). No cart/auth touched — that decision is still pending
  for Phase 5/7 as noted in the Phase 1 handoff.
- **API changes**: none — `Newsletter.tsx`'s `subscribe()` is a documented
  simulated call, not a real endpoint.
- **Database changes**: none.
- **Configuration updates**: none — no new dependencies were installed,
  `package.json` is unchanged.
- **Data model**: `Product`/`Category` types in `src/types/product.ts` are
  intentionally shop-agnostic so Phase 3 (Shop) can import and extend the
  same mock catalog in `src/data/products.ts` rather than inventing a
  second one.

## QA Checklist

Verified this session (headless Chromium screenshots, light + dark +
375px mobile):
- [x] `npm run build` succeeds, `npm run lint` reports 0 errors/warnings
- [x] All sections render in both light and dark mode with correct token
      remapping (no hardcoded colors were introduced)
- [x] Mobile layout (390px): hero stacks, category/best-seller grids drop
      to 2 columns, featured strip scrolls horizontally
- [x] Newsletter: empty/invalid email shows inline error via `Input`'s
      `error` prop; valid email shows loading spinner then success state
- [x] FAQ accordion: keyboard-operable button triggers, `aria-expanded`/
      `aria-controls` wired, only one panel open at a time
- [x] Reduced-motion: hero float and fade-up reveals both fall under the
      global `prefers-reduced-motion` rule from Phase 1's `index.css`

Still needs a human pass:
- [ ] Real browser check (not headless) for the horizontal scroll-snap
      strip in `FeaturedProducts` on mobile Safari specifically — scroll-snap
      can behave differently there
- [ ] Confirm the Newsletter's simulated failure case: type any email
      ending in `@fail.com` to see the error state on purpose
- [ ] Content review — all product names/prices/testimonials/FAQ answers
      are placeholder copy I wrote; swap for real catalog content whenever
      it's ready
- [ ] Decide real URLs for the Instagram tile links and the Footer/Contact
      Instagram link (both still point to `#`)

## Known Issues

- Instagram gallery and social links are decorative (`href="#"`) — no
  Instagram API integration exists, consistent with the Footer's existing
  Phase 1 placeholder.
- `ProductCard` and category cards all link to `/shop` since individual
  product pages don't exist yet — expected until Shop (Phase 3) and product
  detail pages are built.
- Newsletter subscription is simulated client-side only; needs a real
  endpoint before launch.
- No test suite yet (unchanged from Phase 1 — still slated for Phase 14).

## Remaining Tasks

- Nothing outstanding for Phase 2 as scoped. The human QA items above are
  worth a pass before calling it fully signed off.

## Next Phase

**Phase 3 — Shop.** Build inside `src/pages/Shop.tsx`, replacing its
`<PagePlaceholder />`: full product grid (reuse `ProductCard` and the
`Product`/`Category` types/mock data already in `src/data/products.ts`),
filtering by category, sorting (the Footer already links to
`/shop?sort=best-selling` and `/shop?sort=newest`), search (the Navbar's
search icon has no behavior yet — also Phase 3 per the Phase 1 handoff),
and loading/empty/error states using the existing `ProductGridSkeleton`
and `EmptyState`/`ErrorState` components from Phase 1. Do not start Phase 4
work until Phase 3 is approved.

## Context for the Next Claude Session

- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config
  via `@theme` in `src/index.css`) + React Router v7 + Framer Motion.
- **Tokens**: still all in `src/index.css` under `@theme` — reference as
  Tailwind classes (`bg-denim`, `text-ink`), never hardcode hex. Palette
  unchanged from Phase 1: cream/surface/beige/ink base, denim (blue) +
  bloom (pink) accents, full dark-mode remap under `.dark`.
- **New token this phase**: `--animate-float`, used only in `Hero.tsx`.
- **Product/category mock data** lives in `src/data/products.ts` (typed via
  `src/types/product.ts`) — Shop (Phase 3) should extend this file rather
  than creating a second catalog. Prices are in PHP, formatted via
  `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })` —
  that formatter is currently only defined inside `ProductCard.tsx`; if
  Shop needs it elsewhere, consider lifting it into `src/lib/`.
- **`ProductCard`** (`src/components/ui/ProductCard.tsx`) currently always
  links to `/shop` since there's no product detail route yet — once Shop
  and/or product detail pages exist, update its `<Link to="/shop">` to a
  real per-product route.
- **`CraftIcon`** (`src/components/ui/CraftIcon.tsx`) is the illustrated
  stand-in for product photography, keyed by `CraftCategory`. Reuse this in
  Shop's product grid instead of inventing new placeholder art, and swap it
  for real photos site-wide in one pass whenever photography exists.
- **`useInView`** (`src/hooks/useInView.ts`) — reuse for any future
  scroll-reveal instead of reaching for framer-motion per-section.
- **Known gotcha (repeated from Phase 1)**: lucide-react v1.x has no brand
  icons (Instagram, Facebook, Twitter, etc.) — use inline SVGs (see
  `Footer.tsx`) or a generic icon (e.g. `AtSign`) instead. This bit Phase 2
  once already — check before importing any icon that sounds like a brand
  name.
- **Completed**: full Phase 1 foundation + full Phase 2 homepage as listed
  above.
- **Pending**: Phase 3 (Shop) onward, per the original spec.
- **No known bugs** as of this handoff — production build and lint both
  verified clean, visual QA done in light/dark/mobile via headless
  Chromium screenshots this session.
