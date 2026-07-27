# Phase 9 Handoff — Template Customization System

## 1. Phase Summary

Phase 8/8A already moved almost everything into `src/config/`, `src/content/`, and `src/data/` and stripped it of real brand content. Phase 9's job was to close the remaining gaps: the handful of places where copy, metadata, or state-message text was still hardcoded inside `.tsx` files, plus a few config surfaces that were listed as "should be configurable" but didn't exist yet (site metadata, 404 page, loading/empty/error copy, announcement banner wiring, collections, new arrivals).

Nothing structural changed. No component was redesigned, no route added, no dependency introduced. Every change is either (a) a new config/content file, or (b) an existing component swapping a hardcoded string/prop for a value read from config.

`tsc -b`, `vite build`, `npx oxlint src`, and `npm test` (77/77 tests, 11 files) all pass clean.

## 2. Files Created

```
src/config/site.ts              — site-wide SEO/metadata config (title template, default
                                   description, og/twitter defaults) + PAGE_META per route
src/hooks/useSiteMeta.ts        — runtime hook that sets document.title + meta/OG tags,
                                   called once per page component
src/content/notFound.ts         — 404 page copy (code/title/description/CTA)
src/content/states.ts           — centralized loading label, empty-state copy (cart,
                                   wishlist, orders, product-not-found, shop-no-results),
                                   error-state copy (shop, product, error boundary),
                                   offline banner message
src/data/collections.ts         — Collection type + 3 sample curated collections
                                   (data layer only — no UI consumes this yet, see
                                   "Remaining Tasks")
src/components/layout/AnnouncementBar.tsx
                                 — dismissible site-wide banner wired to the
                                   ANNOUNCEMENT config that already existed in
                                   content/homepage.ts but was never rendered
HANDOFF-PHASE-9.md              — this file
```

## 3. Files Modified

```
src/content/homepage.ts     — added SECTION_HEADINGS (eyebrow/title/description for
                               Categories, Featured, Best Sellers, New Arrivals,
                               Testimonials, FAQ, Contact Teaser)
src/data/products.ts        — added NEW_ARRIVALS derived export (sorted by createdAt)

src/components/home/Categories.tsx, FeaturedProducts.tsx, BestSellers.tsx,
Testimonials.tsx, FAQ.tsx, ContactTeaser.tsx
                             — replaced hardcoded <SectionHeading eyebrow=.../> props
                               with {...SECTION_HEADINGS.<section>}

src/components/layout/Layout.tsx
                             — mounted <AnnouncementBar /> above the offline banner

src/components/ui/Loading.tsx
                             — LoadingState's default label now reads from
                               content/states.ts instead of a literal "Loading..."
src/components/layout/OfflineBanner.tsx
                             — message text now reads from content/states.ts

src/pages/NotFound.tsx      — rewritten to read all copy from content/notFound.ts
                               and call useSiteMeta

src/pages/Home.tsx, About.tsx, Contact.tsx, Checkout.tsx, Login.tsx,
OrderConfirmation.tsx, Cart.tsx, Wishlist.tsx, Account.tsx, Shop.tsx
                             — each now calls useSiteMeta(PAGE_META.<page>) so every
                               route sets its own <title>/meta description at runtime

src/pages/ProductDetail.tsx — calls useSiteMeta with the loaded product's name/
                               description (falls back to "" until loaded, which
                               resolves to the site default title rather than a
                               blank tab title); EmptyState/ErrorState now use
                               EMPTY_STATES.productNotFound / ERROR_STATES.product

src/pages/Cart.tsx, Wishlist.tsx, Account.tsx, Shop.tsx,
src/components/cart/CartDrawer.tsx, src/components/ErrorBoundary.tsx
                             — hardcoded EmptyState/ErrorState title/description/
                               actionLabel props replaced with spreads from
                               content/states.ts (EMPTY_STATES.*, ERROR_STATES.*)
```

## 4. Files Removed

None.

## 5. Folder Structure

```
src/
  components/
    layout/
      AnnouncementBar.tsx   (new)
      Layout.tsx
      Navbar.tsx
      Footer.tsx
      OfflineBanner.tsx
  config/
    branding.ts
    business.ts
    navigation.ts
    theme.ts
    site.ts                 (new)
  content/
    homepage.ts
    about.ts
    contact.ts
    policies.ts
    notFound.ts              (new)
    states.ts                 (new)
  data/
    categories.ts
    products.ts
    collections.ts            (new)
  hooks/
    useInView.ts
    useOnlineStatus.ts
    useTheme.ts
    useSiteMeta.ts             (new)
  ...
```

## 6. Architecture Decisions

- **`config/` vs `content/` vs `data/` boundary preserved.** `site.ts` went into `config/` (it's operational/SEO plumbing, same category as `branding.ts`/`business.ts`), while `notFound.ts` and `states.ts` went into `content/` (they're copy a store owner would want to edit). `collections.ts` went into `data/`, matching `products.ts`/`categories.ts`.
- **Runtime metadata over static HTML templating.** `useSiteMeta` sets `document.title` and meta/OG tags on mount rather than templating `index.html` at build time. This was the pragmatic choice for a Vite SPA with no SSR: it correctly handles every real visitor and every JS-executing crawler (which covers Google, and increasingly most others), with zero build-tooling changes. `index.html`'s static tags remain the one thing that needs hand-syncing for a pre-JS crawler — documented in both `index.html`'s existing comment and the new `site.ts` doc comment. A real templating step (`vite-plugin-html` or a postbuild script) is still a valid future improvement if that last gap matters for a given deployment.
- **State-message config keeps override-by-props.** `EmptyState`/`ErrorState` still accept `title`/`description`/`actionLabel` as props — Phase 9 only changed what value pages *pass by default* (from a literal to `{...EMPTY_STATES.cart}`, etc.). A future page-specific edge case can still override any single field without touching `states.ts`.
- **`NEW_ARRIVALS` and `collections.ts` are data-only this phase.** Both were named in the Phase 9 brief as things that should be "configurable," but adding a new visible homepage section for either would step into Phase 10 (homepage layouts) / Phase 12 (section builder) territory — sections that don't exist as toggleable/reorderable units yet. Building the data layer now (with the exact shape a future section will consume) means Phase 10/12 can add the UI without touching data modeling.
- **Announcement banner dismissal key includes the message text.** `AnnouncementBar` namespaces its localStorage dismissal flag with the announcement's own message (via the existing `storageKey()` helper), so editing the message automatically re-shows the banner to everyone who dismissed the old one — no manual "bump a version number" step needed when a store owner changes the announcement.

## 7. Configuration Changes

| File | Controls |
|---|---|
| `src/config/site.ts` | Site name, title template, default description, default OG image, locale, Twitter handle, per-route title/description (`PAGE_META`) |
| `src/content/notFound.ts` | 404 page code/title/description/CTA |
| `src/content/states.ts` | Loading label; empty-state copy (cart, wishlist, orders, product-not-found, shop-no-results); error-state copy (shop, product, error boundary); offline banner message |
| `src/content/homepage.ts` (`SECTION_HEADINGS`, new) | Eyebrow/title/description for Categories, Featured, Best Sellers, New Arrivals, Testimonials, FAQ, Contact Teaser |
| `src/content/homepage.ts` (`ANNOUNCEMENT`, now wired) | Site-wide banner enable/message/link — now actually renders when `enabled: true` |
| `src/data/collections.ts` | Curated product collections (id/slug/title/description/productIds) |
| `src/data/products.ts` (`NEW_ARRIVALS`, new) | Newest-first product list, ready for a future homepage section or sort |

## 8. QA Checklist

- [x] `tsc -b` — clean, no type errors
- [x] `vite build` — clean production build
- [x] `npx oxlint src` — 0 warnings, 0 errors
- [x] `npm test` — 77/77 tests passing across 11 files (unchanged test count — this phase touched config plumbing, not test-covered logic)
- [x] Full-project search for "crafteevee" — 0 matches outside historical `HANDOFF-*.md` files
- [x] Every route in `App.tsx` sets its own page title via `useSiteMeta`
- [x] `ANNOUNCEMENT.enabled` defaults to `false` — banner is invisible out of the box, matching a blank template
- [ ] Manual visual QA (dev server / screenshots) — not run this session; recommended before shipping, especially for the new AnnouncementBar's dismiss interaction

## 9. Known Issues

- `index.html`'s static `<title>`/meta tags still don't auto-sync with `branding.ts`/`site.ts` — same known issue carried from Phase 8A, now with lower real-world impact since `useSiteMeta` correctly sets everything once the app mounts. Only matters for crawlers that don't execute JS.
- `NEW_ARRIVALS` (`data/products.ts`) and `COLLECTIONS` (`data/collections.ts`) have no homepage UI yet — see Architecture Decisions above. They're ready for Phase 10/12 to consume directly.
- `AnnouncementBar`'s dismiss state is per-browser (localStorage), not per-session — a store owner changing the message text is the only way to force it back in front of someone who dismissed it, by design (see Architecture Decisions).

## 10. Remaining Tasks

- Wire `NEW_ARRIVALS`/`COLLECTIONS` into an actual homepage section once Phase 10/12 exist.
- `src/content/policies.ts` still isn't wired to any route (carried over from Phase 8A — unrelated to this phase's scope).
- Consider a build-time `index.html` templating step if pre-JS crawler metadata becomes a hard requirement for a given deployment.

## 11. Next Phase Objectives

Per the brief, Phase 10 (Multiple Homepage Layouts) is next: a layout system where the active homepage template (Minimal/Classic/Modern/Luxury/etc.) is chosen through configuration, with no duplicated code. This phase's `SECTION_HEADINGS` config and the data-only `NEW_ARRIVALS`/`COLLECTIONS` exports are positioned to be consumed directly by whatever section components Phase 10/12 introduce.

## 12. Context Summary for the Next Claude Session

The project is `/crafteevee` in the uploaded zip — a Vite/React/TypeScript white-label storefront template (config-driven per Phase 8/8A, content-stripped of all "CrafteeVee" branding). This session (Phase 9) added the remaining configuration surfaces requested in the brief: site metadata (`config/site.ts` + `useSiteMeta` hook, wired into every route), a 404 content config, centralized loading/empty/error/offline copy (`content/states.ts`), homepage section headings (`SECTION_HEADINGS` in `content/homepage.ts`), an announcement bar component wired to the previously-inert `ANNOUNCEMENT` config, and two new data-only exports (`NEW_ARRIVALS`, `data/collections.ts`) scaffolded for future homepage sections. Build/lint/tests all pass. Do not reintroduce branding. Next up per the brief is Phase 10 (homepage layout system) — waiting for go-ahead before starting it, per the "do not continue automatically" instruction in the brief.
