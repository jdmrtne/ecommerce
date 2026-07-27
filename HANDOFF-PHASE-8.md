# CrafteeVee — Phase 8 Handoff: White-Label Architecture Conversion

## Progress Summary

Converted the CrafteeVee-specific storefront into a reusable white-label
e-commerce **frontend template**. No backend, payments, shipping, or admin
dashboard were built (out of scope per the phase brief). This phase is
purely architectural: every piece of business-specific content, branding,
and category data that used to live inside component code now lives in
`src/config/`, `src/content/`, or `src/data/` - editing those files (plus
swapping the logo asset) is enough to reskin this codebase into a
different small-business storefront (bakery, flower shop, coffee shop,
etc.) without touching a single `.tsx` component.

`tsc -b`, `vite build`, `npx oxlint src`, and the full `npm test` suite
(77 tests, 11 files) all pass clean after every change described below.

## Files

### Created
```
src/config/
├── branding.ts       - business name, tagline, logo, favicon, theme color,
│                        copyright, localStorage key prefix
├── business.ts        - address, email, phone, hours, social links
├── theme.ts            - color/font/radius/style tokens + applyTheme()
└── navigation.ts       - main nav, footer link groups, quick links

src/content/
├── homepage.ts         - hero, announcement banner, about-preview teaser,
│                          newsletter copy, Instagram section copy,
│                          testimonials, FAQs, Instagram tiles
├── about.ts            - About page hero/story/process steps/values/CTA
├── contact.ts           - CONTACT_POINTS, now derived from business.ts
│                          (replaces src/data/contact-content.ts)
└── policies.ts          - Privacy/Terms/Shipping/Return policy text,
                            prepared but not yet wired to a route (no
                            policy pages existed before this phase)

src/data/
└── categories.ts        - CATEGORIES moved out of products.ts, now with
                            slug/icon/tone/featured fields

src/lib/iconRegistry.ts  - name -> lucide-react icon lookup used by
                            CraftIcon, CategoryMosaic, and the About page

src/components/ui/CategoryMosaic.tsx
                          - shared 2x2 category-icon tile grid, extracted
                            so the homepage teaser and /about page don't
                            duplicate the same markup

HANDOFF-PHASE-8.md       - this file
```

### Modified
```
src/types/product.ts          - CraftCategory changed from a hardcoded
                                 "resin"|"crochet"|"candles"|"stickers"
                                 union to `string`; added ProductVariant,
                                 ProductFlags types; Product gained
                                 optional images/variants/stock/tags;
                                 Category gained slug/image/icon/tone/featured
src/data/products.ts          - CATEGORIES re-exported from categories.ts;
                                 added deriveProductFlags() for
                                 featured/bestSeller/newArrival
src/lib/productFilters.ts     - CATEGORY_FILTER_LABELS now built from
                                 data/categories.ts instead of a hardcoded
                                 Record
src/pages/Shop.tsx            - VALID_CATEGORIES / CATEGORY_TITLE now
                                 derived from data/categories.ts
src/components/ui/CraftIcon.tsx
                                - resolves category icon/tone via
                                  data/categories.ts + iconRegistry.ts
                                  instead of a hardcoded per-category switch
src/components/ui/ProductCard.tsx
                                - uses product.images[0] when present,
                                  falls back to the CraftIcon placeholder
src/components/layout/Navbar.tsx, Footer.tsx
                                - logo/alt text/nav links/social
                                  links/copyright now read from
                                  config/branding.ts, config/business.ts,
                                  config/navigation.ts
src/components/home/Hero.tsx, AboutBrand.tsx, FAQ.tsx, Testimonials.tsx,
InstagramGallery.tsx, Newsletter.tsx, ContactTeaser.tsx
                                - all copy now sourced from
                                  content/homepage.ts / content/contact.ts
src/pages/About.tsx, Contact.tsx
                                - About.tsx rebuilt around content/about.ts;
                                  Contact.tsx repointed to content/contact.ts
src/context/AuthProvider.tsx, CartProvider.tsx, WishlistProvider.tsx,
src/lib/orders.ts, src/hooks/useTheme.ts
                                - localStorage keys now built from
                                  branding.storageKeyPrefix via
                                  config/branding.ts's storageKey() helper,
                                  instead of hardcoded "crafteevee-*"
                                  strings (prevents two white-labeled
                                  sites built from this codebase from
                                  colliding in the same browser)
src/components/ErrorBoundary.tsx, src/components/ui/Squiggle.tsx
                                - removed hardcoded "CrafteeVee" from a
                                  console.error message and a code comment
src/main.tsx                   - calls applyTheme() before first render
index.html                     - added a comment documenting that its
                                  static tags mirror config/branding.ts
                                  and must be kept in sync by hand (see
                                  Known Issues)
```

### Moved
```
src/assets/images/logo.png -> src/assets/logo/logo.png
                                (Part 9 - assets split into logo/hero/
                                categories/products/icons subfolders;
                                only logo/ has a file in it today)
```

### Removed
```
src/data/home-content.ts     - content moved into src/content/homepage.ts
src/data/contact-content.ts  - content moved into src/content/contact.ts
                                (now derived from config/business.ts)
```

## Architecture Decisions

- **Three-tier data split**: `config/` = operational facts that rarely
  change per-deploy (branding identity, business contact info, theme
  tokens, navigation structure). `content/` = marketing copy a business
  owner would want to rewrite (homepage sections, About page, policies).
  `data/` = catalog data (products, categories). This mirrors the
  "Alternative: store/*.json" structure suggested in the brief, but kept
  as typed `.ts` files rather than `.json` - TypeScript gives autocomplete
  and compile-time checking when editing content, at no cost to a future
  CMS (a CMS can still write to these files, or the app can be migrated
  to fetch this shape of data from an API later without touching any
  component).

- **`CraftCategory` is now `string`, not a hardcoded union.** This was
  the most important structural change: the old
  `"resin" | "crochet" | "candles" | "stickers"` type baked CrafteeVee's
  specific categories into the type system itself, so a different
  business's categories wouldn't even compile. Category icons are now
  resolved at runtime via `src/lib/iconRegistry.ts` (a name -> lucide
  icon lookup) driven by each category's `icon` field in
  `data/categories.ts`, instead of a hardcoded switch keyed on category
  id. Adding a new business's categories is now purely a data change.

- **Derived product flags instead of manual data migration.** The brief
  asks for `Featured`/`Best Seller`/`New Arrival` fields on each product.
  Rather than hand-editing all ~24 mock products to add three more
  boolean fields (high effort, high risk of inconsistency), `deriveProductFlags()`
  in `data/products.ts` computes them from the existing `tag`/`salesRank`
  fields. `FEATURED_PRODUCTS`/`BEST_SELLERS` now read from these derived
  flags. Any new product added going forward can still just set
  `tag: "New"` / `salesRank: n` as before.

- **Theme system uses an injected `<style>` override, not inline
  styles.** `config/theme.ts`'s `applyTheme()` was almost implemented via
  `element.style.setProperty(...)` on `<html>`, which is the more obvious
  approach - but inline styles have higher CSS specificity than the
  `.dark` class selector already defined in `index.css`, which would have
  silently broken dark mode (`useTheme.ts`) by permanently pinning every
  color to the light-theme config values. Instead, `applyTheme()` injects
  a `<style>` tag with `:root:not(.dark) { ... }` for color overrides
  (scoped out of dark mode entirely, leaving `.dark`'s own palette in
  `index.css` in full control) and plain `:root { ... }` for fonts/radius
  (which have no dark-mode-specific values). Verified in the browser
  build that both light/dark toggling and the config-driven palette work
  together.

- **Tailwind utility class *names* (`bg-denim`, `text-bloom-deep`, etc.)
  were intentionally left unrenamed.** Making the site's *color values*
  configurable was the functional requirement; renaming every
  `denim`/`bloom`/`cream` class name across ~30 component files to
  something brand-neutral like `primary`/`accent`/`base` would be a
  purely cosmetic, high-risk, zero-functional-benefit change (every
  className string in every component would need touching, with no
  behavior difference). `config/theme.ts` documents this decision inline.
  If a future phase wants the class names themselves to read as generic
  tokens (e.g. for a contributor unfamiliar with the CrafteeVee history),
  that's a mechanical rename that can be done independently of any other
  work.

- **`index.html`'s `<title>`/`<meta description>`/`<meta theme-color>`
  are not wired to `config/branding.ts`.** Vite serves `index.html`
  as a static file before any JavaScript (including the branding config)
  runs, so there's no way for that file to read the config without added
  build tooling (e.g. `vite-plugin-html`, or a small script that
  templates `index.html` from `branding.ts` at build time). Given this
  phase's "don't build the backend/CMS yet" scope, this was left as a
  documented manual step (see Known Issues) rather than adding new build
  tooling.

## New Folder Structure

```
src/
├── config/            (NEW) branding, business info, theme, navigation
├── content/            (NEW) homepage, about, contact, policies copy
├── data/                categories.ts, products.ts (catalog)
├── assets/               logo/, hero/, categories/, products/, icons/
├── components/
│   ├── ui/               CategoryMosaic.tsx (NEW), CraftIcon.tsx (rewritten)
│   ├── layout/           Navbar.tsx, Footer.tsx (config-driven)
│   ├── home/             Hero, AboutBrand, FAQ, Testimonials,
│   │                     InstagramGallery, Newsletter (content-driven)
│   └── ...               (unchanged)
├── lib/
│   └── iconRegistry.ts  (NEW) icon name -> lucide component lookup
├── pages/                About.tsx (rewritten), Contact.tsx (repointed)
└── ...                   (unchanged)
```

## Configuration Structure

To duplicate this project for a new business:

1. **Branding** - edit `src/config/branding.ts` (business name, tagline,
   description, theme color, copyright, storage key prefix) and replace
   `src/assets/logo/logo.png` + `public/favicon.png`/`favicon.svg`.
2. **Business info** - edit `src/config/business.ts` (address, email,
   phone, hours, social links).
3. **Theme** - edit `src/config/theme.ts` (colors, fonts, radius,
   card/button style).
4. **Navigation** - edit `src/config/navigation.ts` (nav links, footer
   columns).
5. **Homepage copy** - edit `src/content/homepage.ts`.
6. **About page copy** - edit `src/content/about.ts`.
7. **Categories** - edit `src/data/categories.ts` (id, label, description,
   icon name from `src/lib/iconRegistry.ts`, tone, optional image).
8. **Products** - edit `src/data/products.ts`'s `ALL_PRODUCTS` array.
9. **`index.html`** - manually update `<title>`, `<meta description>`,
   `<meta theme-color>` to match step 1 (see Known Issues).

No component in `src/components/`, `src/pages/`, or `src/context/` needs
to change for any of the above.

## Components Refactored

Navbar, Footer, Hero, AboutBrand, FAQ, Testimonials, InstagramGallery,
Newsletter, ContactTeaser, CraftIcon, ProductCard, CategoryFilter (type
only, no behavior change), Shop (category title/valid-list derivation),
About (full rewrite), Contact (content source only), ErrorBoundary,
Squiggle (comment only).

New shared component: `CategoryMosaic` (used by both `AboutBrand` and
`About`, removing what would otherwise have been duplicated markup).

## Remaining Hardcoded Content

- **`index.html`** - `<title>`, `<meta name="description">`, and
  `<meta name="theme-color">` are still literal CrafteeVee values (see
  Architecture Decisions and Known Issues).
- **Hero.tsx's decorative floating blobs** (`Gem`/`Heart`/`Flame` icons
  with hand-tuned positions/delays) are illustrative flourishes, not
  branding or content - left as-is since they're generic craft-adjacent
  icons, not CrafteeVee-specific, and repositioning them per business
  seemed like more customization than "white-label" requires.
- **Test files** (`*.test.ts(x)`) still reference "crafteevee" in mock
  data/assertions (e.g. `AuthProvider.test.tsx`, `orders.test.ts`) -
  intentionally untouched, since tests describe *this* deployment's
  behavior and would naturally be rewritten/regenerated for a new
  business's fork rather than kept generic.
- **Policy content** (`content/policies.ts`) has no page/route consuming
  it yet - see Remaining Tasks.

## QA Checklist

- [x] `npx tsc -b` - 0 errors
- [x] `npm run build` (`tsc -b && vite build`) - succeeds, output
      unchanged in shape (`dist/assets/logo-*.png`,
      `dist/assets/index-*.css`, `dist/assets/index-*.js`)
- [x] `npx oxlint src` - 0 errors, 0 warnings (the one Fast-Refresh
      warning surfaced mid-phase, from co-locating `ICON_REGISTRY` in
      `CraftIcon.tsx`, was fixed by extracting it to
      `src/lib/iconRegistry.ts`)
- [x] `npm test` - 77/77 tests passing across 11 files, no behavior
      regressions from the category-type/data-source changes
- [x] Homepage renders hero/categories/featured/best-sellers/about-teaser/
      testimonials/newsletter/Instagram/FAQ/contact-teaser sections, all
      sourced from `content/homepage.ts` + `data/categories.ts` +
      `data/products.ts`
- [x] Shop page category filter, sort, and search still work with the
      now-data-driven `CATEGORIES`/`CATEGORY_FILTER_LABELS`
- [x] About page renders from `content/about.ts` with the shared
      `CategoryMosaic`
- [x] Contact page and homepage contact teaser both read the same
      `CONTACT_POINTS` (from `content/contact.ts`, derived from
      `config/business.ts`)
- [x] Navbar/Footer logo, alt text, nav links, footer columns, social
      links, and copyright all read from config
- [x] Dark/light theme toggle (`useTheme.ts`) still works alongside the
      new `applyTheme()` override (verified the `:root:not(.dark)`
      scoping doesn't fight the `.dark` class rules in `index.css`)
- [x] localStorage keys (cart/wishlist/auth/orders/theme) now build off
      `branding.storageKeyPrefix` - existing key names are unchanged
      (`crafteevee-cart`, `crafteevee-wishlist`, etc.) since the default
      `storageKeyPrefix` is still `"crafteevee"`, so no migration is
      needed for anyone testing against data saved before this phase

Still needs a human pass:
- [ ] Visual smoke test of the full white-labeling flow (swap
      `branding.ts` + `theme.ts` + logo file for a mock "second
      business" and confirm the site reskins correctly) - this phase
      verified the *mechanism* (build/lint/test green, `applyTheme`
      confirmed not to fight dark mode) but didn't dry-run an actual
      second brand end-to-end
- [ ] Real browser check on an actual mobile device (carried over from
      Phase 6/7, still outstanding, unrelated to this phase's work)

## Known Issues

- **`index.html`'s `<title>`/meta tags aren't config-driven** (see
  Architecture Decisions) - must be updated by hand when rebranding.
  Wiring `vite-plugin-html` (or an equivalent build-time templating step)
  to generate these from `branding.ts` would close this gap; deliberately
  not added this phase to avoid introducing new build tooling in a
  "don't build the backend yet" phase.
- **Product `images`, `variants`, and `stock` fields are architecture
  only, not wired into any UI flow beyond `ProductCard`'s image
  fallback.** `ProductDetail`, `Cart`, and `Checkout` don't read
  `variants` or `stock` yet - no product in the current mock catalog sets
  them, so there's nothing to display. This matches the phase brief's
  "prepare the architecture, don't build the feature" instruction (Part
  4/11/12).
- **Store import/export (Part 12) was not implemented**, per the phase
  brief ("You do NOT need to implement import/export yet"). The
  config/content/data split completed this phase is exactly the
  structure a future import/export feature would serialize/deserialize -
  no additional prep work was identified as necessary beyond having that
  split exist.
- All Known Issues from `HANDOFF-PHASE-7.md` (mock auth is not
  production-secure, no password reset, no account editing, per-browser
  order history, the logout-navigation gotcha, hardcoded `MAX_QTY`) are
  unchanged and still apply.

## Remaining Tasks

- Build actual `/privacy`, `/terms`, `/shipping`, `/returns` pages/routes
  that consume `src/content/policies.ts` (the Footer already links to
  `/shipping`, which currently 404s via `NotFound` - this predates Phase
  8 and wasn't introduced by it, but fixing it is a natural pairing with
  wiring up `policies.ts`).
- Wire `vite-plugin-html` or a small pre-build script so `index.html`'s
  title/meta/theme-color are generated from `config/branding.ts` instead
  of hand-edited.
- If/when Part 12 (store import/export) is scoped, `config/`, `content/`,
  and `data/` are already shaped as the natural export unit (see Known
  Issues above).
- Consider whether Tailwind's internal color-token *names*
  (`denim`/`bloom`/`cream`) should eventually be renamed to
  brand-neutral names (`primary`/`accent`/`base`) for long-term
  maintainability by someone unfamiliar with CrafteeVee's history - a
  mechanical, low-risk rename that's independent of this phase's work
  (see Architecture Decisions).

## Next Phase

**Phase 9** - not yet defined/confirmed with the user. Per the original
project roadmap referenced in the brief, likely candidates: the backend,
payments, shipping, and admin dashboard that this phase deliberately
deferred. Do not begin Phase 9 work until scope is confirmed.

## Context for the Next Claude Session

- **Stack**: unchanged - Vite + React 19 + TypeScript + Tailwind v4
  (CSS-first config via `@theme` in `src/index.css`, now overridable at
  runtime via `src/config/theme.ts`'s `applyTheme()`) + React Router v7 +
  Framer Motion + Vitest test stack (from Phase 7).
- **White-labeling a copy of this project**: see "Configuration
  Structure" above for the 9-step checklist.
- **The `node_modules`/`dist` folders were stripped before zipping this
  deliverable** (standard practice for this project's handoffs) - run
  `npm install` before `npm test`/`npm run build`/`npm run dev` in the
  next session.
- **Completed**: full Phase 1 foundation through Phase 7 test suite (see
  `HANDOFF-PHASE-1.md` through `HANDOFF-PHASE-7.md`), plus Phase 8's
  white-label architecture conversion described in this file.
- **Pending**: Phase 9 onward - not yet scoped, confirm with the user
  before starting anything. Backend/payments/shipping/admin dashboard are
  all still entirely unbuilt (everything remains `localStorage`-backed
  mocks, as it has been since Phase 1).
- **No known bugs** as of this handoff - production build, lint, and the
  full test suite (77 tests) are all verified clean after the white-label
  conversion.
