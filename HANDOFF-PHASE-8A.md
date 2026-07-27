# Phase 8A Handoff — Strip Branding to a Blank White-Label Template

## 1. Summary

Phase 8 (previous session) did the *architectural* work: it moved every
piece of copy, contact info, category data, and theme value out of
component code and into `src/config/`, `src/content/`, and `src/data/`.
It did **not** strip the actual CrafteeVee content out of those files —
the config files still held real CrafteeVee values as their defaults.

Phase 8A is the content pass on top of that architecture: every
CrafteeVee-specific string, the real product/category catalog, the
real logo/favicon, and the CrafteeVee-derived code comments have been
replaced with generic placeholder content. No `.tsx` component was
touched for this — Phase 8's config layer meant this phase was a data
edit, not a refactor, exactly as intended.

`tsc -b`, `vite build`, `npx oxlint src`, and the full `npm test` suite
(77 tests, 11 files) all pass clean after every change described below.

This is NOT a redesign — UI, layout, animations, cart/wishlist/checkout,
auth, and routing are byte-for-byte unchanged. Only content, sample
data, and the two brand image assets changed.

## 2. Files Created

```
HANDOFF-PHASE-8A.md   — this file
```

No new source files were needed — Phase 8 already created the
config/content/data layer this phase edits.

## 3. Files Modified

```
src/config/branding.ts     — businessName/tagline/description/logoAlt/
                              copyrightHolder → generic placeholders;
                              storageKeyPrefix "crafteevee" → "store"
src/config/business.ts     — legalName/address/email/phone/social →
                              generic placeholders
src/content/homepage.ts    — hero, about-preview, newsletter, Instagram
                              section, testimonials (3), FAQ (5),
                              Instagram tiles (6) → generic sample copy
src/content/about.ts       — About hero/story/process steps/values →
                              generic placeholder copy
src/content/policies.ts    — reworded away from "made-to-order/
                              handmade" framing to generic e-commerce copy
src/data/categories.ts     — 4 craft categories (resin/crochet/candles/
                              stickers) → 4 generic categories
                              (Category A/B/C/D)
src/data/products.ts       — 24 craft products → 24 generic sample
                              products ("Product 1"..."Product 24"),
                              same shape/fields, same
                              featured/best-seller/new-arrival spread
src/types/product.ts       — removed "CrafteeVee-specific" wording from
                              a doc comment (no code change)
src/components/ui/CraftIcon.tsx
                            — removed "handmade aesthetic" wording from
                              a doc comment (no code change)
src/components/cart/CartDrawer.tsx, src/pages/Cart.tsx
                            — empty-state copy "handmade pieces" →
                              "products"
src/index.css               — renamed the "CRAFTEEVEE DESIGN TOKENS"
                              header comment and removed the
                              logo-derived-palette explanation (colors
                              themselves were already generic pastel
                              tokens, not renamed)
index.html                  — <title>/meta description → generic
package.json                 — "name": "crafteevee" →
                              "storefront-template"
src/assets/logo/logo.png    — replaced CrafteeVee wordmark with a
                              generic placeholder logo
public/favicon.png, public/favicon.svg
                            — replaced with a generic placeholder icon
src/lib/productFilters.test.ts, src/lib/checkout.test.ts
                            — test fixture data ("Resin Charm",
                              "Crochet Bunny", etc.) → generic sample
                              names/categories (fixtures only — none of
                              these assert against the real catalog)
src/lib/orders.test.ts, src/pages/Login.test.tsx,
src/context/CartProvider.test.tsx, src/context/AuthProvider.test.tsx,
src/context/WishlistProvider.test.tsx
                            — hardcoded localStorage key strings
                              ("crafteevee-*") updated to match the new
                              storageKeyPrefix ("store-*")
```

## 4. Files Removed

None. Nothing was deleted — the CrafteeVee-specific *values* were
replaced in place; the files, exports, and types that held them stay
the same so no import site anywhere in the app needed to change.

## 5. Remaining Business References

None found. A full case-insensitive search for `crafteevee` across the
project (excluding `node_modules`, `dist`, and the dated
`HANDOFF-PHASE-1..8.md` files, which are development history logs, not
product content) returns zero matches.

The one thing worth flagging: `src/components/ui/CraftIcon.tsx` and
`src/lib/iconRegistry.ts` are named after the word "craft," not
"CrafteeVee" — they're not a brand reference, but if you want the
naming itself to read as fully category-neutral (e.g. for a client
handoff where a developer greps the codebase), a future phase could
rename `CraftIcon` → `CategoryIcon`. Left as-is this phase since it's a
pure rename with no functional or content impact, and the brief was to
avoid touching component code beyond content.

## 6. New Folder Structure

Unchanged from Phase 8 — Phase 8A didn't add or move any files:

```
src/
  components/
  pages/
  layouts/ (n/a — this project uses pages/ + shared layout components)
  hooks/
  lib/
  context/
  config/
    branding.ts
    business.ts
    navigation.ts
    theme.ts
  content/
    homepage.ts
    about.ts
    contact.ts
    policies.ts
  data/
    categories.ts
    products.ts
  assets/
    logo/logo.png
  types/
```

## 7. Configuration Structure

What each file controls, and what's now in it:

| File | Controls | Current state |
|---|---|---|
| `src/config/branding.ts` | Business name, tagline, logo, favicon, theme color, copyright, localStorage key prefix | Generic placeholders |
| `src/config/business.ts` | Address, email, phone, hours, social links | Generic placeholders |
| `src/config/navigation.ts` | Main nav, footer link groups | Already generic — no business-specific labels ever lived here |
| `src/config/theme.ts` | Colors, fonts, radius, card/button style | Already generic pastel tokens — not tied to any brand |
| `src/content/homepage.ts` | Hero, announcement, about-preview teaser, newsletter, Instagram section, testimonials, FAQ, Instagram tiles | Generic sample copy |
| `src/content/about.ts` | About page hero/story/process/values/CTA | Generic sample copy |
| `src/content/contact.ts` | Contact points shown on homepage + /contact | Derived automatically from `business.ts` — nothing to edit here directly |
| `src/content/policies.ts` | Privacy/Terms/Shipping/Return text (not yet wired to routes) | Generic sample copy |
| `src/data/categories.ts` | Shop categories | 4 generic categories (Category A–D) |
| `src/data/products.ts` | Full product catalog | 24 generic sample products across the 4 categories |

## 8. QA Checklist

- [x] `tsc -b` — clean, no type errors
- [x] `vite build` — clean production build
- [x] `npx oxlint src` — 0 warnings, 0 errors
- [x] `npm test` — 77/77 tests passing across 11 files
- [x] Full-project case-insensitive search for "crafteevee" — 0 matches outside historical handoff docs
- [x] Logo and favicon swapped for generic placeholder art
- [x] Cart/wishlist/checkout/auth/routing untouched (verified via passing test suite, which covers all of these)
- [ ] Manual visual QA (dev server / screenshots) — not run this session; recommended before shipping to a client

## 9. Known Issues

- `src/config/theme.ts`'s CSS variable *names* (`--color-denim`,
  `--color-bloom`) and the matching Tailwind classes across components
  (`bg-denim`, `text-bloom-deep`, etc.) still use those internal names.
  This was a deliberate Phase 8 decision (documented in that phase's
  handoff): the *values* are fully config-driven, so re-theming works
  correctly, but the class names themselves reference "denim"/"bloom"
  rather than "primary"/"accent". Purely cosmetic to a developer reading
  the code — has no effect on runtime behavior or on what a client sees.
- `src/content/policies.ts` is written but not yet wired to any route —
  same as noted in the Phase 8 handoff, this is prep work for whenever
  Privacy/Terms/Shipping/Return pages get built.
- `index.html`'s `<title>`/meta tags are static HTML and won't
  automatically stay in sync if `branding.ts` is edited later (documented
  in an existing comment in that file) — a future phase could template
  this from `branding.ts` at build time.

## 10. Template Customization Guide

To turn this into a real store, a developer only needs to touch:

1. **`src/config/branding.ts`** — business name, tagline, description,
   favicon path, theme color, copyright holder, storage key prefix.
2. **`src/assets/logo/logo.png`** — swap in the real logo (same
   filename, any reasonable size/aspect works since it's rendered at a
   fixed nav height).
3. **`public/favicon.png`** / **`public/favicon.svg`** — swap in the
   real favicon.
4. **`src/config/business.ts`** — address, email, phone, hours, social
   links.
5. **`src/config/navigation.ts`** — nav labels/links, footer columns,
   if the site's page set differs from Shop/About/Contact.
6. **`src/config/theme.ts`** — colors, fonts, corner radius, card/button
   style. `applyTheme()` runs once on load and overrides the CSS
   variables `index.css` compiles as defaults — no component needs to
   change.
7. **`src/content/homepage.ts`**, **`src/content/about.ts`** — all
   marketing copy for the homepage and About page.
8. **`src/content/policies.ts`** — policy text, once policy pages exist.
9. **`src/data/categories.ts`** — the real category list (any number of
   entries; `icon` picks from the registry in
   `src/lib/iconRegistry.ts`).
10. **`src/data/products.ts`** — the real product catalog. `category`
    is a plain string that just needs to match a `slug` in
    `categories.ts` — there's no hardcoded category union anywhere in
    the type system, so this supports any product taxonomy (bakery,
    coffee shop, flower shop, electronics, etc.) without touching
    `Product`/`Category` types.

Nothing in that list requires editing a `.tsx` file. `index.html`'s
`<title>`/meta tags (item 4 in Known Issues) are the one exception —
those are plain HTML and should be hand-edited to match `branding.ts`
until a build-time templating step exists.

## 11. Next Recommended Phase

Options, not yet scoped — need your call before starting any of them:

- **Wire up policy pages** — `src/content/policies.ts` already has the
  data; this would add routes/pages that render it.
- **`index.html` templating** — generate the `<title>`/meta tags from
  `branding.ts` at build time instead of hand-syncing them.
- **Rename `CraftIcon`/`iconRegistry`** — cosmetic rename to
  `CategoryIcon` for a codebase that reads as fully category-neutral.
- **Real backend/payments/shipping/admin** — explicitly out of scope
  for Phase 8/8A per the brief; still on the table as a much larger
  future phase if this stops being a static demo template.

Not continuing automatically — waiting for your go-ahead on which (if
any) of these to do next.
