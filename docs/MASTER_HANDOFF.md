# MASTER_HANDOFF.md

Single source of truth for this project's current state. Every future
session should only need this file, `ROADMAP.md`, `CHANGELOG.md`, the
current project files, and the standard Continue Development prompt
(`CONTINUE_DEVELOPMENT_PROMPT.md`) — no prior conversation should ever be
required.

**This file describes what exists. `ROADMAP.md` describes what's next.**
Future-phase planning lives exclusively in `ROADMAP.md` now — do not add
"Next Phase" detail here beyond a pointer.

---

## Current Version

`0.0.0` (per `package.json` — not yet cut a release version; template is
pre-launch/pre-marketplace).

## Current Progress

Rough estimate, not a formal metric: core storefront UX (browse → detail →
cart → checkout → account) is **100% built**; white-label configurability
conversion is **~95%** (remaining gaps tracked in Known Issues; Phase 13
closed the last of the Content Architecture gaps — `NEW_ARRIVALS`,
`data/collections.ts`, `content/policies.ts`, and the `index.html` meta
sync all now render/route/sync for real). Homepage/About/Contact are
page-builder-driven (Phase 11) — sections are enabled/ordered/styled from
`config/layouts/`, not hardcoded per page. Phase 14 generalized that
page-builder system so a brand-new standalone page (not just Home/About/
Contact) can be built from nothing but a page-definition object and one
route entry — proved out with a real `/faq` page. The whole site's visual
identity (colors/fonts/radius/buttons/cards/nav/footer/hero/spacing) is
preset-driven (Phase 12) — reskinning for a new business vertical is a
one-line `ACTIVE_PRESET_ID` change, no component edits. Shop remains a
single interactive view with page-level *settings* rather than sections
(see Known Issues). Phase 15 stood up the **admin area's shell** —
auth-gated `/admin` routing, a sidebar layout listing every future admin
section, and a genuinely-live (read-only) dashboard — the foundation every
later admin/editor phase (16–24) builds on. Phase 16 shipped the first
real editor: **Store Settings** — an admin form for business name,
tagline, description, and contact info, persisted as a `localStorage`
override layered over the static `config/branding.ts`/`config/business.ts`
defaults and reflected live (no reload) everywhere that data renders
(Navbar, Footer, Contact page/teaser, page `<title>`/meta tags, the admin
shell itself). Phase 17 shipped the second: **Theme Editor** — an admin UI
to switch the active template preset (replacing the Phase 12 code-level
`ACTIVE_PRESET_ID` edit) and customize its colors/fonts/radius/card/button
style on top, with a genuinely live whole-document preview and the same
save/reset override pattern. Phase 18 shipped the third: **Homepage
Editor** — an admin UI to pick a starting layout (classic/minimal/modern/
luxury, replacing the Phase 11 code-level `ACTIVE_HOME_LAYOUT` edit),
then reorder, enable/disable, and configure (title/subtitle/padding/
background/width/align) any of the 12 registered homepage sections, saved
the same way and read by `Home.tsx`'s existing rendering engine with no
changes to how it renders. Phase 19 shipped the fourth: **Product
Manager** — admin CRUD (list/search/filter, create/edit/delete covering
every `Product` field) for the product catalog, replacing direct edits to
`data/products.ts`, persisted the same override-over-defaults way via
`lib/productsStore.ts`. Unlike the prior three editors (each overriding
fields on one settings object), this one overrides a *list* of records —
an id-keyed map of edited/created products plus per-id deletion
sentinels, resolved at read time. Every storefront consumer (`Shop.tsx`,
`ProductDetail.tsx`, and the homepage `FeaturedProducts`/`BestSellers`/
`NewArrivals` sections) now reads through that resolver instead of the
static `ALL_PRODUCTS`/`FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS`
exports, so an admin edit/create/delete is reflected immediately. Cart/
Wishlist/Collections still read the static catalog directly — out of this
phase's scope, tracked in Known Issues. Phase 20 shipped the fifth:
**Category Manager** — admin CRUD (list, create/edit/delete covering
every meaningfully-consumed `Category` field) for `data/categories.ts`,
same override-over-defaults pattern via `lib/categoriesStore.ts`. Unlike
products, a category id is *referenced by* other records
(`Product.category`), so deleting one still assigned to at least one
product is **blocked outright** (not just warned) —
`countProductsInCategory()` checks the live product catalog before the
delete-confirmation modal is even allowed to open. Every existing
storefront/admin consumer of the static category list (Shop's filter and
heading, the homepage `Categories` section, `CraftIcon`/`CategoryMosaic`,
`ProductDetail`, Product Manager's own category picker, admin stats) was
switched to the live resolver in the same phase, so a rename/add/remove
here is reflected everywhere immediately. Phase 21 shipped the sixth:
**Navigation Editor** — admin add/remove/reorder/rename for the header
nav (`config/navigation.ts`'s `MAIN_NAV`), same override pattern via
`lib/navigationSettingsStore.ts`. The simplest override shape yet: `MAIN_NAV`
is already a flat array with no per-entry id and no named variants to pick
between, so the whole list is saved as a single unit rather than an
id-keyed map (Products/Categories) or a variant pairing (Theme/Homepage).
`Navbar.tsx` reads the live list via `useNavigation()` across all three
`navStyle` variants, so a save is reflected immediately everywhere the nav
renders, with no reload. Phase 22 shipped the seventh: **Footer Editor** —
admin add/remove/reorder for footer link columns (and the links within
each), plus an editable copyright line, via `lib/footerSettingsStore.ts`.
`FOOTER_LINK_GROUPS` is a list of groups each holding a list of links, so
this reuses Phase 21's whole-array-as-one-field override shape one level
deeper rather than switching to an id-keyed map. Social links keep their
single home in Phase 16 Store Settings — the Footer Editor page edits them
in place through the same `useStoreSettings()` hook rather than adding a
second, competing override. Phase 23 shipped the eighth: **Policy
Editor** — admin editing of the Privacy/Terms/Shipping/Returns policy
page content (`content/policies.ts`'s `POLICY_PAGES`), via
`lib/policySettingsStore.ts`. Unlike every prior list-shaped editor
(Products/Categories: growable id-keyed map; Navigation/Footer: a single
editable array), `POLICY_PAGES` is a fixed, closed set of four known
slugs with no admin flow to add or remove one — so the override is
`Partial<Record<PolicySlug, PolicyDocument>>`, one optional full-document
replacement per slug, with no deletion sentinel needed. Each document's
`sections` list (heading + body pairs) is edited with the same
add/remove/reorder approach Navigation/Footer used for their link lists,
one level inside a single record. `pages/Policy.tsx` (the `/policies/:slug`
route from Phase 13) now reads through `resolvePolicyDocument()` instead
of the static export, so a Policy Editor save is reflected immediately on
next visit. Together these eight establish the pattern every remaining
editor phase (Media) reuses. Phase 24 shipped the ninth and, per
`ROADMAP.md`, final editor of this run: **Media Manager** — a basic
asset manager (`lib/mediaStore.ts`/`hooks/useMediaAssets.ts`) that lets
an admin upload images and store them as base64 data URLs in
`localStorage` (the documented pre-backend decision — see the doc
comment atop `mediaStore.ts` for why `localStorage` over IndexedDB, and
the size guards this implies: 1MB per file, 4.5MB total media budget,
both enforced with a clear error rather than a silent failure or
corrupted save). Unlike every Phase 16-23 editor, this one has no static
seed data to layer an override on top of — every asset was created by an
admin, so it's a plain persisted list, not an override-over-defaults
resolver. Two things reuse it: the reusable `AssetPicker` component
(upload + a library grid, embedded inline wherever an image field
lives — Store Settings' new Logo/Favicon fields, and a "Browse"/"Add
from library" action next to Product Manager's image rows), and the
standalone `/admin/media` Media Manager page (browse/upload/delete
every asset site-wide, with a storage-usage bar). Both read/write the
same store, so an image uploaded from either shows up in both. Store
Settings' `StoreSettingsOverride` gained `logo`/`logoAlt`/`favicon`
fields (previously out of scope — Phase 16's comment called them out
explicitly), so `resolveBranding()` now resolves them the same
override-over-default way as every other branding field, and
`useSiteMeta()` gained a live favicon-swap (`<link rel="icon">`) to
match the live title/meta-tag updates it already did, since a Store
Settings favicon save needs the same "no reload" behavior every other
editor gives. Phase 25 introduced the first real backend: **Supabase**
(Postgres + Auth), the project owner's confirmed choice, given as a
project URL + anon/publishable key (in `.env`, gitignored — see
`.env.example`). This phase is plumbing only, per its own brief — a new
`lib/api/` client layer (`client.ts`'s Supabase singleton,
`types.ts`'s row↔model contracts, and `auth.ts`/`products.ts`/
`categories.ts`/`orders.ts`, each mirroring an existing
`localStorage`-backed module's function shapes 1:1 so a future phase's
migration is a call-site swap, not a rewrite) plus `supabase/schema.sql`
(table definitions with Row Level Security enabled — public read for the
catalog, owner-only for profiles/orders) exist, but nothing in the UI
calls any of it yet; every `AuthProvider`/`productsStore`/`orders.ts`
consumer is untouched, and the production bundle size is unchanged (the
whole `lib/api/` tree gets fully tree-shaken out since nothing imports
it). Every API function takes an injectable `client` parameter
(defaulting to the real singleton) specifically so its tests
(`lib/api/*.test.ts`, `src/test/mockSupabaseClient.ts`'s shared
chainable-query-builder mock) never touch the network. Payments/shipping
still don't exist — see
`ROADMAP.md` for the full remaining sequence.

Phase 26 turned that plumbing into the real thing: `AuthProvider` now
signs up/logs in/logs out against Supabase Auth via `lib/api/auth.ts`,
with an app-specific `profiles` row (name/role) alongside every
Supabase Auth account, replacing the Phase 6 mock (`localStorage` user
table, plaintext passwords) entirely - no code path still writes to it.
`login`/`signup` keep their exact Phase 6 call shapes, so every
`useAuth()` consumer (`Login.tsx`, `Account.tsx`, `Navbar.tsx`,
`AdminLayout.tsx`, `RequireAuth`/`RequireAdmin`) needed no changes
beyond `logout()` becoming `async` (a real `signOut()` network call -
every call site now `await`s it before its `window.location.href`
navigation, or the request could be aborted by the page unload).
Session persistence is Supabase's own client-side model (there is no
server here to own an httpOnly cookie - this is a pure SPA talking to
Supabase directly); `AuthContext` gained `isInitializing` for the one
thing that model requires the app to account for - a real async
session check on load, unlike the mock's synchronous `localStorage`
read - so `RequireAuth`/`RequireAdmin` wait for it to settle before
judging `isAuthenticated`/`role`, rather than risking a false
"signed out" redirect for an already-logged-in visitor loading
`/account` or `/admin` directly. Nothing else does that waiting (most
pages don't care about auth state at all), so a brief signed-out flash
elsewhere (e.g. `Checkout.tsx`'s pre-fill-from-account, or `Navbar`'s
account-menu vs. Login link) is possible on a hard refresh - see Known
Issues. Admin accounts have no signup flow of their own (unchanged from
Phase 6's design) - see the README's Backend section for how to set one
up against Supabase directly. `lib/userStore.ts` (the old mock's user
table) is no longer read by auth at all, but `lib/adminStats.ts`'s
admin-dashboard customer count still reads it - real customer data
awaits Phase 30 (Customers), so that count is currently
stale/disconnected from real signups; also a Known Issue.
`src/test/fakeSupabaseAuth.ts` is a new in-memory fake of Supabase Auth
plus `profiles`, globally mocked in via `src/test/setup.ts` for every
test that mounts `AuthProvider` (directly or through
`renderWithProviders`) - a different shape of fake than
`mockSupabaseClient.ts`'s canned-response builder, since `AuthProvider`
drives real UI flows across dozens of unrelated component tests and
needs to behave like a backend across a whole journey (signup,
persisted session, login, logout), not just answer one call in
isolation.

Phase 27 moved the product catalog onto that same real backend: Product
Manager (`hooks/useProducts.ts`), `Shop.tsx`, `ProductDetail.tsx`, and the
homepage `FeaturedProducts`/`BestSellers`/`NewArrivals` sections all read/
write through `lib/api/products.ts` now, not `lib/productsStore.ts`'s old
`localStorage` override (which is removed outright - see Known Issues for
what's left of that file). Each of those pages/sections fetches
independently and shows its own loading skeleton / `ErrorState`-with-retry,
same pattern Shop already had pre-backend, just pointed at a real request
instead of a simulated one. Product Manager's "Reset to defaults" is gone
- there's no static default to reset to once the catalog lives in
Postgres - and its save/delete are real, fallible network calls with
their own inline error handling. `supabase/schema.sql` gained admin-only
RLS write policies for `products` (closing the Phase 25 placeholder that
left writes ungated), and `supabase/seed_products.sql` seeds a fresh
project with the existing 24-product catalog. Category Manager and
Cart/Wishlist/Collections are still out of scope, reading the old static
catalog/a client-side cache respectively - see Known Issues.

## Current Phase

**Phase 27 complete.** **Phase 28 — Orders (Backend-Integrated) — is
next**, per `ROADMAP.md`.

## Completed Phases

| Phase | Name | Summary |
|---|---|---|
| 1 | Foundation | Scaffold, routing, design tokens, layout (navbar/footer), dark mode, reusable UI kit (Button, Card, Input, Textarea, Modal, Spinner/LoadingState, Skeletons, EmptyState/ErrorState/OfflineState, ErrorBoundary), `Squiggle` signature motif. |
| 2 | Homepage | Full `Home.tsx`: hero, categories, featured products, best sellers, about-brand, testimonials, Instagram gallery, newsletter, FAQ, contact teaser. Illustrated `CraftIcon` blob+icon motif used instead of stock photos. |
| 3 | Shop | Full `Shop.tsx`: category filter, sort, search, all wired into URL query params. Catalog expanded to 24 products (6/category) in `src/data/products.ts`; `FEATURED_PRODUCTS`/`BEST_SELLERS` derived from it. |
| 4 | Product Detail + Cart | `/shop/:id` product detail page; real persisted cart (`CartContext`/`CartProvider`, localStorage). `ProductCard` links to real detail pages. |
| 5 | Wishlist + Checkout | `WishlistContext`/`WishlistProvider` (localStorage). Full Cart → Checkout → Order Confirmation flow (simulated, no real payment gateway). |
| 6 | Accounts + About/Contact | Mock auth (`AuthContext`/`AuthProvider`) — signup/login/logout, protected `/account`, per-user order history, all localStorage-backed, plaintext passwords (demo only, documented as not production-secure). Real About/Contact content. |
| 7 | Test Suite | Vitest + Testing Library wired in (separate `vitest.config.ts`). 77 tests across 11 files, concentrated on state/logic (contexts, `lib/`) plus Login page flows. |
| 8 | White-Label Architecture Conversion | Moved all business-specific content/branding/category data out of components into `src/config/`, `src/content/`, `src/data/`. Config layer still held real CrafteeVee values as defaults at end of this phase. |
| 8A | Strip Branding to Blank Template | Content pass on top of Phase 8's architecture: replaced all real CrafteeVee strings, catalog, logo/favicon, and code comments with generic placeholder content. No `.tsx` touched. |
| 9 | Template Customization System | Closed remaining hardcoded-copy gaps: `config/site.ts` + `useSiteMeta` hook (per-route `<title>`/meta), `content/notFound.ts`, `content/states.ts` (loading/empty/error/offline copy), `SECTION_HEADINGS` in `content/homepage.ts`, `AnnouncementBar` wired to previously-inert `ANNOUNCEMENT` config, data-only `NEW_ARRIVALS`/`data/collections.ts` scaffolding for future homepage sections. |
| 10 | Multiple Homepage Layouts | `config/homepageLayouts.ts` defines named layouts (Classic/Minimal/Modern/Luxury) as ordered subsets of the existing homepage sections; `Home.tsx` rewritten into a rendering engine that maps `ACTIVE_HOMEPAGE_LAYOUT` to a section list and renders shared components in order — no section component duplicated or forked per layout. Also fixed a pre-existing test-environment gap (missing `IntersectionObserver` polyfill) surfaced by the new page-level test. |
| 11 | Dynamic Page Builder & Layout Manager | Generalized Phase 10's homepage-only layout engine into a site-wide section/registry system. New `types/layout.ts` (`SectionInstance`/`PageLayout`/`SectionSettings`), central `config/sectionRegistry.tsx` mapping every section key (home + about + contact) to its component, and `config/layouts/{home,about,contact}.ts` configs each section's `enabled`/`order`/`title`/`subtitle`/appearance `settings`. `Home.tsx`, `About.tsx` (newly split into 5 sections), and `Contact.tsx` (split into 2 sections) are now thin rendering engines over this registry. `config/layouts/shop.ts` adds page-level *settings* (not sections — see Known Issues) for Shop's search/filter/sort visibility and grid columns. `config/homepageLayouts.ts` removed; superseded by `config/layouts/home.ts`, which preserves all four named presets (classic/minimal/modern/luxury). |
| 12 | Template Variants & Theme Presets | New `TemplatePreset` type (`types/preset.ts`) and a `config/presets/` registry of 10 complete presets — `classic` (original look, unchanged), `minimal`, `modern`, `cute`, `luxury`, `fashion`, `bakery`, `restaurant`, `electronics`, `handmade` — each bundling its own color palette, font pairing, radius scale, card/button style, nav/footer/hero layout variant, and section-spacing scale. Switching `ACTIVE_PRESET_ID` reskins the entire site with no component changes. Closed a standing gap from Phase 1: `data-button-style`/`data-card-style` were set on `<html>` but never consumed — `Button`/`Card` now read them via new `--btn-radius`/`--card-radius`/`--card-shadow`/`--card-border-color` CSS hooks. `Navbar`/`Footer`/`Hero` each gained internal layout-variant branching (not duplicated files) driven by the active preset. `lib/sectionStyle.ts`'s padding scale is now one of four `SectionSpacing` rows. |
| 13 | Content Architecture Completion | Closed the last Phase-9-era data-only gaps: new `newArrivals` (`NEW_ARRIVALS`, date-sorted top 8, distinct from tag-based `FEATURED_PRODUCTS`) and `collections` (`data/collections.ts` curated cards) homepage sections, both registered in `sectionRegistry.tsx` and added to `config/layouts/home.ts`'s `classic` layout. `content/policies.ts` wired to real routes (`pages/Policy.tsx`, generic over a new `POLICY_PAGES` slug registry) at `/policies/{privacy,terms,shipping,returns}`, linked from the footer (which also fixed a pre-existing dead `/shipping` link). `index.html`'s static `<title>`/meta tags now auto-sync from config at build time via a new `scripts/sync-index-html.mjs`, wired into `npm run build`; required extracting pure-text fields into asset/alias-free `config/brandingMeta.ts` + `config/titleTemplate.ts` so a plain Node script can read them without loading the rest of the Vite app. |
| 14 | Dynamic Pages | Generalized Phase 11's Home/About/Contact-only page-builder into a site-wide dynamic-page system: new `types/DynamicPageDefinition` (`config/layouts/pages/types.ts`, a `PageLayout` plus `slug`/`path`/`meta`), a `config/layouts/pages/` registry (`DYNAMIC_PAGES`, keyed by slug), and a single generic `pages/DynamicPage.tsx` route component that looks up its page by the `slug` prop its route passes in and renders that page's enabled sections through the existing `SECTION_REGISTRY` — no per-page component. Proved out end-to-end with a real `/faq` page (`config/layouts/pages/faq.ts`, reusing the existing `faq` section as-is), routed via one new `<Route path="faq" .../>` entry in `App.tsx` and linked from the footer's "Help" group (previously an in-page `/#faq` anchor). Home/About/Contact are untouched — they still use their own Phase 11 rendering engines, since each has its own fixed section-key union; `DynamicPage` is additive, for pages that don't need one. |
| 15 | Admin Foundation | Stood up the `/admin` shell: routing, layout, and auth-gating — no config editing yet. New `role: "admin" \| "customer"` field on the mock user record (`AuthContext`/`AuthProvider`), with storage responsibility split out into `lib/userStore.ts` (also home to a seeded demo admin account, since there's no admin-signup UI yet). `components/auth/RequireAdmin.tsx` gates the whole `/admin` tree — redirects signed-out visitors to `/login`, shows an access-denied panel for signed-in non-admins. `components/admin/AdminLayout.tsx` is a standalone shell (not nested under the storefront `Layout`) with a sidebar listing every future admin section (`config/adminNav.ts`) — sections without a real route render as inert "Soon" rows, never dead links. `pages/admin/AdminDashboard.tsx` is a genuinely-live read-only summary (active preset, homepage layout, product/category/collection/dynamic-page counts, registered customers, orders placed) computed by `lib/adminStats.ts` from existing config/data — no stubbed numbers. |
| 16 | Store Settings | First real admin editor, establishing the override pattern every later one reuses. `lib/storeSettingsStore.ts` persists an admin's edits to business name/tagline/description (branding) and legal name/address/email/phone/hours/social/Google-Maps-URL/response-time (business) as a `localStorage` override layered over the static `config/branding.ts`/`config/business.ts` defaults (`resolveBranding()`/`resolveBusiness()`, `override ?? default` per field), namespaced like Cart/Wishlist/Auth. `hooks/useStoreSettings.ts` makes that override reactive — subscribes to a same-tab change event plus the native `storage` event, so a save/reset re-renders every mounted consumer immediately, no reload. `pages/admin/StoreSettings.tsx` is the admin form (grouped cards: Branding, Business info, Business hours with add/remove rows, Social links), with client-side validation (`lib/storeSettingsValidation.ts`) and a "Reset to defaults" action disabled until an override exists. `Navbar`, `Footer`, `AdminLayout`, `content/contact.ts`'s contact points (now a function, `getContactPoints()`, instead of a module-load-frozen array), and `useSiteMeta` (page `<title>`/meta description/`og:site_name`) all read the live resolved config instead of the static `branding`/`business` imports, so a save is visible across the site immediately. |
| 17 | Theme Editor | Second admin editor, reusing Phase 16's override pattern for a different slice of config. `lib/themeSettingsStore.ts` persists `activePresetId` (replacing the Phase 12 code-level edit) and, optionally, a full customized `ThemeConfig` for that specific preset (colors/fonts/radius/card/button style) — saved as a whole object, not merged field-by-field, and explicitly dropped if a later save switches `activePresetId` without an accompanying `theme` (a preset switch alone means "use that preset's own look", not "carry the old preset's color edits over"). `hooks/useThemeSettings.ts` resolves the live preset and calls `applyPreset()` (the same CSS-custom-property mechanism `main.tsx` uses at boot) whenever it changes, so a save is visible immediately. `pages/admin/ThemeEditor.tsx` (`/admin/theme`) is a preset picker (all 10 shipped presets, with swatches) plus typography/shape/color controls (`config/fontOptions.ts`/`config/radiusScales.ts` offer curated, guaranteed-safe choices instead of risky free-text font stacks or unproportioned radius values) — every field change calls `applyPreset()` directly for a genuinely live, whole-document preview, reverting to the actually-saved state if the admin navigates away without saving. `Navbar`/`Footer`/`Hero`/`lib/sectionStyle.ts`'s padding resolution/`lib/adminStats.ts` all switched from the static `config/presets` `activePreset` import to the resolved/reactive version, and `main.tsx` now boots from the resolved preset so a saved choice survives a refresh. |
| 18 | Homepage Editor | Third admin editor, reusing the same override pattern for `config/layouts/home.ts`'s `PageLayout`. `lib/homepageSettingsStore.ts` persists `activeLayoutId` (which of the 4 named layouts — `classic`/`minimal`/`modern`/`luxury` — is the starting point, replacing the Phase 11 code-level `ACTIVE_HOME_LAYOUT` edit) and, optionally, a full customized `sections` array for that specific layout — saved as a whole array, with the same "drop stale data on a bare layout switch" guard Phase 17 established for `theme`. `buildFullSectionList()` expands a layout's (possibly partial, e.g. `minimal`'s 4-entry) `sections` into all 12 registered `HomepageSectionKey`s, missing ones appended as disabled, so the editor always has a complete, toggleable checklist. `hooks/useHomepageSettings.ts` is the reactive wrapper — unlike Theme Editor there's no DOM side effect to reapply, since a section arrangement is just data `pages/Home.tsx` reads at render time (not mounted while the admin is editing, so a plain resolver call is enough — no live in-page preview needed for this phase, matching the brief's scope). `pages/admin/HomepageEditor.tsx` (`/admin/homepage`) is a layout picker plus a 12-row section list (enable checkbox, up/down reorder buttons instead of drag-and-drop, expandable per-section settings for title/subtitle/padding/background/width/align). `Home.tsx` itself only changed its one data source — `HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]` became `resolveHomeLayout()` — its rendering logic is untouched. `lib/adminStats.ts`'s "home layout" stat also switched to the resolved value. |
| 19 | Product Manager | Fourth admin editor, first to override a *list* rather than a single settings object. `lib/productsStore.ts` persists an id-keyed override map — a value of `Product` means created/edited, a `{ deleted: true }` sentinel means removed — layered over the static `data/products.ts` seed catalog. `resolveAllProducts()` walks the static list (applying edits/deletions) then appends admin-created products; `resolveFeaturedProducts()`/`resolveBestSellers()`/`resolveNewArrivals()` re-derive the existing `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS` curation rules (`deriveProductFlags()`, sales rank, `createdAt`) from that same resolved list, so an edit anywhere (tagging "New", setting a sales rank, changing the date) ripples through every derived list automatically — no separate override needed per list. `generateProductId()` slugifies a new product's name into a unique id. `hooks/useProducts.ts` is the reactive wrapper (same same-tab-event + cross-tab-`storage` subscription as Phases 16–18). `pages/admin/ProductManager.tsx` (`/admin/products`) is a search/category-filterable list plus a create/edit modal form covering every `Product` field (name, category, price, rating, tag, date added, sales rank, stock, description, detail bullets, image URLs, variants, search tags) and a delete-confirmation modal, with client-side validation (`lib/productValidation.ts`). `Shop.tsx`, `ProductDetail.tsx`, and the homepage `FeaturedProducts`/`BestSellers`/`NewArrivals` sections all switched from the static `data/products.ts` exports to the live resolvers. Cart/Wishlist/`data/collections.ts` were left reading the static catalog directly — explicitly out of this phase's scope (Completion Criteria only named the three derived lists) — see Known Issues. Surfaced and fixed a reusable `Modal` gotcha: its focus-management effect depends on `[isOpen, onClose]`, so an inline (non-memoized) `onClose` handler gets a new identity every render and re-steals focus into the dialog wrapper on every keystroke inside it — any future form-in-a-`Modal` must pass a `useCallback`-stabilized `onClose`. |
| 20 | Category Manager | Fifth admin editor, reusing Phase 19's list-override pattern for `data/categories.ts`. `lib/categoriesStore.ts` persists an id-keyed override map (`Category` = created/edited, `{ deleted: true }` = removed) layered over the static seed list; `resolveAllCategories()`/`resolveCategoryById()` resolve it the same way `resolveAllProducts()` does. Unlike a product, a category id is *referenced by* other records, so `countProductsInCategory()` (reading through the live `resolveAllProducts()`) backs a deliberate **block-not-warn** delete guard: a category still assigned to at least one product has its delete button disabled outright, rather than opening a confirmation that could be pushed through anyway. `hooks/useCategories.ts` is the reactive wrapper (same subscription shape as every prior editor). `pages/admin/CategoryManager.tsx` (`/admin/categories`) is a list plus a create/edit modal covering every meaningfully-consumed `Category` field (name, description, icon validated against `ICON_REGISTRY`, accent tone, item count, optional image URL, featured flag) and a delete-confirmation modal for the unblocked case, with client-side validation (`lib/categoryValidation.ts`). Every existing consumer of the static `CATEGORIES` export — `CategoryFilter`, `Shop.tsx`, the homepage `Categories` section, `CraftIcon`, `CategoryMosaic`, `ProductDetail`, Product Manager's own category picker, and `lib/adminStats.ts` — switched to the live resolver in this same phase, so a rename/add/remove is reflected everywhere immediately; `productFilters.ts`'s `CATEGORY_FILTER_LABELS` became a function over a passed-in category list for the same reason. |
| 21 | Navigation Editor | Sixth admin editor, over `config/navigation.ts`'s `MAIN_NAV`. The simplest override shape of any editor so far - `lib/navigationSettingsStore.ts` persists a single optional whole-array field (`{ links?: NavLink[] }`), since `MAIN_NAV` is already a flat array with no per-entry id (unlike Products/Categories) and no named variants to pick between (unlike Theme/Homepage); `resolveMainNav()` returns `override.links ?? MAIN_NAV`. `hooks/useNavigation.ts` is the reactive wrapper (same subscription shape as every prior editor). `pages/admin/NavigationEditor.tsx` (`/admin/navigation`) edits a local copy of the full link list - add, remove, up/down reorder, inline label/link editing - and saves it as one unit; `lib/navigationValidation.ts` blocks saving with an empty label, an invalid `to` (must start with "/" or be a full URL), or zero remaining links. `NavLink` has no nested-link field, so no nesting support was added. `components/layout/Navbar.tsx` switched both its desktop and mobile/minimal link lists from the static `MAIN_NAV` import to `useNavigation()`'s resolved list, reflected immediately across all three `navStyle` variants (`standard`/`centered`/`minimal`) with no reload - verified by a new `Navbar.test.tsx` (one test per nav style). `FOOTER_LINK_GROUPS`/`QUICK_LINKS` (also in `config/navigation.ts`) are out of scope, tracked for Phase 22 (Footer Editor). |
| 22 | Footer Editor | Seventh admin editor, over `config/navigation.ts`'s `FOOTER_LINK_GROUPS` and `config/branding.ts`'s `copyrightHolder`. `lib/footerSettingsStore.ts` persists `{ groups?: FooterLinkGroup[]; copyrightHolder?: string }` — `groups` reuses Phase 21's whole-array-as-one-field shape one level deeper (a list of groups, each itself holding a list of links, since a group has no id referenced elsewhere and there's still only one list to edit); `copyrightHolder` is a second, independent field saved/reset alongside it but resolved separately. `hooks/useFooterSettings.ts` is the reactive wrapper (same subscription shape as every prior editor hook). `pages/admin/FooterEditor.tsx` (`/admin/footer`) edits a local copy of the group list (add/remove/reorder columns, add/remove/reorder links within each column, inline title/label/link editing) plus the copyright string, and saves both with one `save()` call; `lib/footerValidation.ts` blocks saving an empty column title, a titled column with zero links, or an empty copyright name, while still allowing the overall column list to be empty (the `minimal` `footerStyle` shows none anyway). Social links (`business.social`) were explicitly *not* given a second override here despite being in the phase's brief scope line — Phase 16 Store Settings already owns and fully edits them, and `Footer.tsx` already reads them live via `useStoreSettings()`; a second store would create two competing sources of truth. Instead, `FooterEditor.tsx`'s Social Links card edits `business.social` in place through the *same* `useStoreSettings()` hook/`save()` Store Settings itself uses, with its own independent save action and a link over to the Store Settings page. `components/layout/Footer.tsx` switched its link-group rendering and copyright line from the static `FOOTER_LINK_GROUPS` import and `branding.copyrightHolder` to `useFooterSettings()`'s resolved values, reflected immediately across all three `footerStyle` variants (`columns`/`stacked`/`minimal`) with no reload — verified by an expanded `Footer.test.tsx` covering all three, including confirming `minimal` shows an overridden copyright but never overridden link groups (it never renders link groups at all). |
| 23 | Policy Editor | Eighth admin editor, over `content/policies.ts`'s `POLICY_PAGES` — the first over a fixed, closed set of records (four known slugs: `privacy`/`terms`/`shipping`/`returns`) rather than a growable list or a single settings object. `lib/policySettingsStore.ts` persists `Partial<Record<PolicySlug, PolicyDocument>>` — one optional full-document replacement per slug, no deletion sentinel needed since every slug always has a static default to fall back to. `hooks/usePolicySettings.ts` is the reactive wrapper (same subscription shape as every prior editor hook), exposing `pages` (all four resolved documents), `isOverridden(slug)`, `save(slug, doc)`, `reset(slug)`, and `resetAll()`. `pages/admin/PolicyEditor.tsx` (`/admin/policies`) edits one slug at a time behind a small tab-style picker (visual style borrowed from Phase 17 `ThemeEditor.tsx`'s preset picker); each document's title, last-updated date, and ordered `sections` list (heading + body, with add/remove/reorder — the same local-array-as-one-field approach Phase 21/22 used for nav links and footer groups, just one level inside a single record) are edited and saved independently per slug, plus a page-wide "reset all" action. `lib/policyValidation.ts` blocks saving an empty title, empty date, a section missing either its heading or body, or a document with zero sections. `pages/Policy.tsx` (the `/policies/:slug` route) now reads through `resolvePolicyDocument()` instead of importing `POLICY_PAGES` directly, so a save is reflected the next time that route is visited — no reactive hook needed there, since the admin/storefront route trees are separate and the page always mounts fresh (same reasoning as Phase 18 Homepage Editor). |
| 24 | Media Manager | Ninth and, per `ROADMAP.md`'s original editor run, final content editor: a basic asset manager (`lib/mediaStore.ts`/`hooks/useMediaAssets.ts`) storing admin-uploaded images as base64 data URLs in `localStorage` (documented pre-backend decision — 1MB per file, 4.5MB total media budget, enforced with a clear error). No static seed data to override — a plain persisted list. The reusable `AssetPicker` (upload + library grid) is embedded in Store Settings' Logo/Favicon fields and Product Manager's image rows; the standalone `/admin/media` page browses/uploads/deletes site-wide with a storage-usage bar. Store Settings gained `logo`/`logoAlt`/`favicon` override fields, and `useSiteMeta()` gained a live favicon swap to match its existing live title/meta updates. |
| 25 | Backend Integration | First real backend: Supabase (Postgres + Auth), the project owner's confirmed choice. Plumbing only, per its own brief — `lib/api/client.ts` (Supabase singleton), `lib/api/types.ts` (row↔model contracts), `lib/api/{auth,products,categories,orders}.ts` (one file per domain, each mirroring an existing `localStorage`-backed module's function shapes 1:1), and `supabase/schema.sql` (table definitions + RLS: public read for the catalog, owner-only for profiles/orders) all exist, but nothing in the UI calls any of it yet — every consumer untouched, bundle size unchanged (tree-shaken out entirely). Every API function takes an injectable `client` parameter (default: the real singleton) so its tests never touch the network. |
| 26 | Authentication (Backend-Integrated) | `AuthProvider` migrated off the Phase 6 mock onto real Supabase Auth via Phase 25's `lib/api/auth.ts`, with a `profiles` row (name/role) per account. `login`/`signup` kept their Phase 6 call shapes (no consumer changes beyond `logout()` becoming `async`, since it's now a real `signOut()` network call every call site `await`s before its hard navigation). `AuthContext` gained `isInitializing`, which `RequireAuth`/`RequireAdmin` wait on before judging auth state — the one place this app needs to account for a real async session check on load instead of the mock's synchronous read. Session persistence is Supabase's own client-side model (no server here to own an httpOnly cookie). `src/test/fakeSupabaseAuth.ts` is a new in-memory fake Supabase Auth + `profiles` backend, globally mocked in for every test that mounts `AuthProvider`. See the Current Progress note above for the full detail and the Known Issues this introduced. |
| 27 | Products (Backend-Integrated) | Product Manager (`hooks/useProducts.ts`), `Shop.tsx`, `ProductDetail.tsx`, and the homepage `FeaturedProducts`/`BestSellers`/`NewArrivals` sections all migrated off `lib/productsStore.ts`'s Phase 19 `localStorage` override onto Phase 25's `lib/api/products.ts` against the real backend — that override layer (`saveProductOverride`/`deleteProductOverride`/`resolveAllProducts`/etc., plus `PRODUCTS_CHANGE_EVENT`) is removed outright, not just deprecated. Each consumer now fetches independently with its own loading skeleton/`ErrorState`-with-retry (the homepage sections re-derive their featured/best-seller/new-arrival lists from whatever they just fetched, via new pure `deriveFeaturedProducts()`/`deriveBestSellers()`/`deriveNewArrivals()` helpers, instead of reading a synchronously-resolved catalog). Product Manager's "Reset to defaults" is gone (no static default to reset to against a real database); save/delete are `async` with their own inline error handling per modal. Added admin-only RLS write policies to `supabase/schema.sql`'s `products` table (closing a Phase 25 placeholder) and `supabase/seed_products.sql` to seed a fresh project with the existing 24-product catalog. `lib/adminStats.ts`/`lib/categoriesStore.ts` (Category Manager's delete-guard) were intentionally left reading a small deprecated in-memory (non-persistent) cache rather than migrated — Category Manager itself isn't backend-integrated yet — see Known Issues. `src/test/fakeSupabaseAuth.ts` (the global test backend fake from Phase 26) now also serves a `products` table seeded from `ALL_PRODUCTS`. |

## Remaining Phases

**See `ROADMAP.md`.** It is now the authoritative, phase-by-phase plan for
everything remaining (Dynamic Pages, the full Admin CMS build-out, Backend
Integration, Authentication, Products, Orders, Inventory, Customers,
Payments, Shipping, Notifications, Analytics, SEO, Performance, Commercial
Release, and Documentation). Do not duplicate that plan here — this file
should only ever describe completed, currently-existing state.

---

## Architecture Overview

- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config via
  `@theme` in `src/index.css`) + React Router v7 + Framer Motion.
- **No backend yet** (see `ROADMAP.md` Phase 25). Everything is
  client-side today: mock auth, mock catalog, mock checkout, all persisted
  to `localStorage`, namespaced per white-labeled deployment via
  `branding.storageKeyPrefix` (see `config/branding.ts`).
- **Three-layer content system** (the core of the white-label design):
  - `src/config/` — operational/structural config: branding identity, theme
    (colors/fonts/radius/button+card style), business info, navigation, site
    metadata/SEO defaults.
  - `src/content/` — editable copy a store owner would touch: homepage
    section text, about/contact copy, policies, 404 copy, loading/empty/
    error/offline state copy.
  - `src/data/` — catalog-shaped data: products, categories, collections.
  - **Rule carried through every phase since 8: React components must never
    hardcode business-specific strings, colors, or data.** Everything reads
    from one of the three layers above.
- **Theming**: `src/index.css` defines default CSS custom properties under
  Tailwind v4's `@theme`. `config/theme.ts`'s `applyTheme()` writes runtime
  overrides onto `:root` before render, so re-theming never requires
  touching component or CSS files. Tailwind utility *class names*
  (`bg-denim`, `text-bloom`) still use their original internal names from
  Phase 1 — cosmetic only, values are fully config-driven (see Known
  Issues).
- **Template presets (Phase 12)**: one level above theming. A
  `TemplatePreset` (`types/preset.ts`) bundles a `theme: ThemeConfig`
  together with `navStyle`/`footerStyle`/`heroStyle`/`sectionSpacing` —
  four more style axes implemented as internal branches inside the
  existing shared components rather than duplicated per-preset files.
  `config/presets/index.ts` registers all 10 shipped presets and exposes
  `ACTIVE_PRESET_ID` (the single value a deployment edits to reskin
  itself) and `activePreset`. `main.tsx` calls `applyPreset()` once before
  render, which calls `applyTheme(activePreset.theme)` (unchanged
  mechanics from Phase 1) and additionally sets `data-nav-style`/
  `data-footer-style`/`data-hero-style`/`data-section-spacing`/
  `data-preset` on `<html>`. `Navbar`/`Footer`/`Hero` import `activePreset`
  directly (same static-config-import pattern as `branding`/`business`)
  and branch their JSX on its style fields; `lib/sectionStyle.ts` reads
  `activePreset.sectionSpacing` to pick one of four padding scales. Adding
  a new preset never touches component code — only a new
  `TemplatePreset` object under `config/presets/`, registered in
  `PRESETS`. Phase 12 also closed a standing gap: `data-button-style`/
  `data-card-style` had been written onto `<html>` since Phase 1 as
  "future CSS hooks" but nothing ever consumed them — `Button`/`Card` now
  read `--btn-radius`/`--card-radius`/`--card-shadow`/`--card-border-color`
  custom properties (defined per-attribute-value in `index.css`) via
  Tailwind arbitrary-value classes, so `cardStyle`/`buttonStyle` now
  visibly change what renders.
- **Runtime SEO**: `useSiteMeta` hook (Phase 9) sets `document.title` and
  meta/OG tags on mount per route, reading from `config/site.ts`'s
  `PAGE_META`. `index.html`'s static tags are now kept in sync for
  pre-JS crawlers too (Phase 13): `scripts/sync-index-html.mjs` runs as
  the first step of `npm run build` and rewrites them from
  `config/brandingMeta.ts`/`config/titleTemplate.ts`.
- **Page builder / section system (Phase 11)**: Home, About, and Contact
  are all thin rendering engines, not hand-assembled pages. Each reads an
  ordered `PageLayout` from `config/layouts/{home,about,contact}.ts`,
  filters to `enabled` sections, sorts by `order` (via
  `resolveLayoutSections()` in `types/layout.ts`), and renders each one
  from the single central `config/sectionRegistry.tsx` — which maps every
  section key across every page to its component. A section instance can
  also carry a per-placement `title`/`subtitle` override and an appearance
  `settings` object (`padding`/`background`/`width`/`align`); every
  section component resolves those against its own pre-Phase-11 defaults
  via `lib/sectionStyle.ts`, so a layout with no `settings` renders
  pixel-identical to before this phase. Home's four named presets
  (`classic`/`minimal`/`modern`/`luxury`) from Phase 10 are preserved
  inside `config/layouts/home.ts` (`HOME_LAYOUTS`/`ACTIVE_HOME_LAYOUT`);
  About/Contact each have one default layout today (multiple named
  presets are a straightforward extension, following the same pattern).
  Adding a new section type means registering it once in
  `sectionRegistry.tsx`; every layout can then opt into it by key. Shop
  is *not* part of this section system — it's a single stateful,
  URL-query-driven view, not a stack of independent content blocks —
  so `config/layouts/shop.ts` instead exposes page-level `settings`
  (search/filter/sort visibility, default sort, grid columns) as a
  deliberately different, simpler shape (see Known Issues).
- **Dynamic pages (Phase 14)**: a generalization of the section system
  above for standalone pages beyond Home/About/Contact. A
  `DynamicPageDefinition` (`config/layouts/pages/types.ts`) is a
  `PageLayout` plus `slug`/`path`/`meta`; each one lives in its own file
  under `config/layouts/pages/` and is registered by slug in
  `DYNAMIC_PAGES` (`config/layouts/pages/index.ts`). The single generic
  `pages/DynamicPage.tsx` component takes a `slug` prop (passed by its
  route), looks the definition up, and renders its sections through the
  same `SECTION_REGISTRY` Home/About/Contact use. A new page needs a new
  definition object plus one `<Route>` line in `App.tsx` — never a new
  page component. `/faq` (`config/layouts/pages/faq.ts`) is the first
  real example, reusing the existing `faq` section unchanged. Home/About/
  Contact are untouched by this — they keep their own Phase 11 rendering
  engines, since each has a fixed, page-specific section-key union.
- **Admin shell (Phase 15)**: `/admin` is a separate top-level route tree
  (`App.tsx`), not nested under the storefront `Layout` — it gets its own
  sidebar shell, `components/admin/AdminLayout.tsx`, driven by
  `config/adminNav.ts` (every future section listed; only Dashboard has a
  real route so far, everything else renders as an inert "Soon" row).
  Gated by `components/auth/RequireAdmin.tsx`, which checks
  `useAuth().user?.role === "admin"` — a new field on `AuthUser`
  (`context/AuthContext.ts`), defaulting to `"customer"` for every
  self-signup account. The `localStorage`-backed user-record storage that
  used to live inline in `AuthProvider.tsx` was extracted to
  `lib/userStore.ts` in this phase so both `AuthProvider` (session state)
  and admin-only code (the dashboard, future admin phases) can read the
  user list without depending on the provider component. Since there's no
  admin-signup UI yet, `userStore.ts` seeds one demo admin account
  (`admin@example.com` / `admin12345`) the first time the user store is
  read — see Known Issues. `pages/admin/AdminDashboard.tsx` renders live
  stats from `lib/adminStats.ts`, which reads straight from existing
  config/data (active preset, active home layout, product/category/
  collection/dynamic-page counts, registered customers, and total orders
  summed across every registered account's `lib/orders.ts` history) — no
  hardcoded placeholder numbers.
- **Admin editor override pattern (Phase 16)**: the first real admin
  editor, Store Settings, establishes the pattern every later editor
  (Theme, Homepage, Products, ...) reuses. Edits persist as a
  `localStorage` override (`lib/storeSettingsStore.ts`, namespaced like
  Cart/Wishlist/Auth via `storageKey()`), layered over the static config
  default at read time (`resolveBranding()`/`resolveBusiness()`: `override
  ?? default`, per field) rather than replacing the default outright — a
  cleared override always falls cleanly back to the template's shipped
  defaults. `hooks/useStoreSettings.ts` wraps that resolver in a small
  reactive hook (re-renders on a same-tab custom event dispatched by
  save/reset, and on the native cross-tab `storage` event), so every
  consumer that switched from a static `branding`/`business` import to
  this hook (`Navbar`, `Footer`, `AdminLayout`, `content/contact.ts`'s
  `getContactPoints()`, `useSiteMeta`) reflects a save immediately, with
  no reload. Fields not exposed by the Store Settings form (logo,
  `storageKeyPrefix`, favicon, theme color, ...) always resolve to their
  static default — the override type only covers what the admin form
  actually edits.
- **Live document-wide preview (Phase 17)**: Theme Editor
  (`lib/themeSettingsStore.ts`/`hooks/useThemeSettings.ts`) reuses the
  Phase 16 pattern for a different slice of config — `activePresetId`
  (replacing the Phase 12 code-level `ACTIVE_PRESET_ID` edit) and,
  optionally, a customized `ThemeConfig` for that specific preset. It
  takes the pattern one step further: since `applyPreset()`/`applyTheme()`
  (Phase 1/12) already work by writing CSS custom properties + data
  attributes straight onto `<html>`, `pages/admin/ThemeEditor.tsx` calls
  `applyPreset()` directly on every in-progress edit (before Save), giving
  a genuinely live, whole-document preview with no separate preview widget
  needed. Nothing is written to `localStorage` until Save; an unmount
  effect re-applies whatever's actually persisted, so navigating away
  mid-edit reverts the visual state cleanly. `activePresetId` and `theme`
  are always saved as a matched pair — switching preset without also
  saving a new `theme` explicitly drops any customization left over from
  a *different* preset, rather than letting a plain object-merge silently
  reattach stale colors to the newly-selected preset.

## Current Folder Structure

```
crafteevee/
  docs/               MASTER_HANDOFF.md, ROADMAP.md, CHANGELOG.md,
                       CONTINUE_DEVELOPMENT_PROMPT.md  (this documentation set)
  HANDOFF-PHASE-*.md  Legacy per-phase handoffs (Phases 1-9) — historical
                       only, no longer updated; superseded by docs/
  scripts/            sync-index-html.mjs  (Phase 13 — build-time index.html
                       meta sync, run via `npm run build`)
  src/
    assets/           logo/, hero/, categories/, products/, icons/
    components/
      ui/             Button, Card, Input, Textarea, Select (Phase 17 — labeled
                       native select matching Input's field conventions), Modal,
                       Accordion, CategoryMosaic, CraftIcon, Loading, ProductCard,
                       QuantityStepper, SectionHeading, Skeleton, Squiggle,
                       StateMessage, WishlistButton  (Button/Card now read
                       preset-driven --btn-radius/--card-* CSS vars, Phase 12)
      layout/         AnnouncementBar, Navbar, Footer (+ test, Phase 16), Layout,
                       OfflineBanner (Navbar/Footer gained navStyle/footerStyle
                       branches, Phase 12; both now read `activePreset` via
                       `useThemeSettings()`, Phase 17, not a static import)
      home/           Hero, Categories, FeaturedProducts, BestSellers,
                       NewArrivals, Collections (+ tests, Phase 13), AboutBrand,
                       Testimonials, InstagramGallery, Newsletter, FAQ,
                       ContactTeaser  (all registered page-builder sections;
                       Hero gained heroStyle branches, Phase 12, now read via
                       `useThemeSettings()` instead of a static import, Phase 17)
      about/          AboutIntro, AboutStorySection, AboutProcess,
                       AboutValuesSection, AboutCtaSection  (page-builder sections, Phase 11)
      contact/        ContactIntro, ContactDetails  (page-builder sections, Phase 11)
      shop/           CategoryFilter, SortSelect
      auth/           RequireAuth (+ test), RequireAdmin (+ test, Phase 15)
      cart/           CartDrawer
      admin/          AdminLayout (+ test, Phase 15 — sidebar shell, not nested
                       under the storefront Layout)
      ErrorBoundary.tsx, PagePlaceholder.tsx
    config/           branding.ts, brandingMeta.ts (Phase 13), titleTemplate.ts
                       (Phase 13), business.ts, navigation.ts, site.ts, theme.ts,
                       sectionRegistry.tsx (Phase 11 — central section-key → component map),
                       adminNav.ts (Phase 15 — sidebar section list; Store Settings
                       and Theme marked available, Phases 16-17),
                       fontOptions.ts, radiusScales.ts (+ test)  (Phase 17 —
                       curated, guaranteed-safe Theme Editor font/radius choices)
      presets/        classic.ts, minimal.ts, modern.ts, cute.ts, luxury.ts,
                       fashion.ts, bakery.ts, restaurant.ts, electronics.ts,
                       handmade.ts, index.ts (+ test)  (Phase 12 — template
                       preset registry, ACTIVE_PRESET_ID, applyPreset())
      layouts/        home.ts (+ test), about.ts, contact.ts, shop.ts  (Phase 11 page layout/settings configs)
        pages/        types.ts, faq.ts, index.ts (+ test)  (Phase 14 — DynamicPageDefinition
                       registry, keyed by slug, consumed by pages/DynamicPage.tsx)
    content/          homepage.ts, about.ts, contact.ts (Phase 16 — CONTACT_POINTS
                       is now a function, getContactPoints(business), instead of a
                       module-load-frozen array), policies.ts, notFound.ts, states.ts
    data/             categories.ts, collections.ts, products.ts
    context/          AuthContext/AuthProvider (+ test — AuthUser gained `role`,
                       Phase 15), CartContext/CartProvider,
                       WishlistContext/WishlistProvider (+ tests)
    hooks/            useInView, useOnlineStatus, useSiteMeta (Phase 16 — resolves
                       branding live instead of the frozen `site` config), useTheme,
                       useStoreSettings (+ test, Phase 16 — reactive read/write
                       access to the Store Settings override), useThemeSettings
                       (+ test, Phase 17 — reactive read/write access to the
                       Theme Editor override; also calls `applyPreset()` on change),
                       useHomepageSettings (+ test, Phase 18 — reactive read/write
                       access to the Homepage Editor override; no DOM side effect)
    lib/              auth, adminStats (+ test, Phase 15; activePreset/
                       activeHomeLayout stats now resolved via themeSettingsStore/
                       homepageSettingsStore, Phases 17-18), checkout, cn,
                       currency, iconRegistry, orders, productFilters,
                       sectionStyle (Phase 11, now preset-spacing-aware as of
                       Phase 12; padding resolved live per call, Phase 17),
                       storeSettingsStore (+ test, Phase 16 — localStorage
                       override/resolver), storeSettingsValidation (+ test,
                       Phase 16), themeSettingsStore (+ test, Phase 17 —
                       localStorage override/resolver for active preset +
                       customized theme), homepageSettingsStore (+ test,
                       Phase 18 — localStorage override/resolver for active
                       homepage layout + customized section list, plus
                       buildFullSectionList() for the editor UI), userStore
                       (+ test, Phase 15 — extracted from AuthProvider)
                       (+ tests for most)
    pages/            Home (+ test — now reads `resolveHomeLayout()`, Phase 18),
                       Shop, ProductDetail, Cart, Checkout,
                       OrderConfirmation, Wishlist, Login (+ test), Account,
                       About, Contact, Policy (+ test, Phase 13),
                       DynamicPage (+ test, Phase 14), NotFound
                       (Home/About/Contact are page-builder rendering engines,
                       not hand-assembled pages; DynamicPage is the same pattern
                       generalized to any slug-registered page; NotFound also
                       exports a reusable NotFoundPanel that Policy/DynamicPage share)
      admin/          AdminDashboard (+ test, Phase 15), StoreSettings (+ test,
                       Phase 16), ThemeEditor (+ test, Phase 17), HomepageEditor
                       (+ test, Phase 18)
    test/             setup.ts, utils.tsx
    types/            cart.ts, order.ts, product.ts, layout.ts (Phase 11),
                       preset.ts (Phase 12)
```

*(Phase 22 added `lib/footerSettingsStore.ts` (+ test),
`lib/footerValidation.ts` (+ test), `hooks/useFooterSettings.ts` (+ test),
and `pages/admin/FooterEditor.tsx` (+ test); Phase 18 added `lib/homepageSettingsStore.ts` (+ test),
`hooks/useHomepageSettings.ts` (+ test), and `pages/admin/
HomepageEditor.tsx` (+ test); Phase 17 added `lib/themeSettingsStore.ts`
(+ test), `hooks/useThemeSettings.ts` (+ test), `config/fontOptions.ts`,
`config/radiusScales.ts` (+ test), `components/ui/Select.tsx`, and
`pages/admin/ThemeEditor.tsx` (+ test); Phase 16 added
`lib/storeSettingsStore.ts` (+ test), `lib/storeSettingsValidation.ts`
(+ test), `hooks/useStoreSettings.ts` (+ test), `pages/admin/
StoreSettings.tsx` (+ test), and `components/layout/Footer.test.tsx`;
Phase 15 added `components/admin/` (`AdminLayout` + test), `pages/admin/`
(`AdminDashboard` + test), `config/adminNav.ts`, `lib/userStore.ts`
(+ test), `lib/adminStats.ts` (+ test), `components/auth/
RequireAdmin.tsx` (+ test); Phase 14 added `config/layouts/pages/`
(`types.ts`/`faq.ts`/`index.ts` + test) and `pages/DynamicPage.tsx`
(+ test); Phase 13 added `scripts/` at the project root, plus
`config/brandingMeta.ts`/`config/titleTemplate.ts`,
`components/home/{NewArrivals,Collections}.tsx`, and `pages/Policy.tsx` —
no other structural change.)*

## Current Configuration Structure

| File | Controls |
|---|---|
| `config/branding.ts` | Business name, tagline, description, logo, favicon, theme-color, copyright holder, `storageKeyPrefix` (namespaces all localStorage keys). Pure-text fields sourced from `config/brandingMeta.ts` (Phase 13). These are the static *defaults* — as of Phase 16, `businessName`/`tagline`/`businessDescription` can be overridden at runtime via the admin's Store Settings page (`lib/storeSettingsStore.ts`); as of Phase 22, `copyrightHolder` can likewise be overridden via the Footer Editor (`lib/footerSettingsStore.ts`). |
| `config/brandingMeta.ts` | **Phase 13.** Pure-text subset of branding (`businessName`/`tagline`/`businessDescription`/`favicon`/`themeColor`) with no image import or `@/` alias, so it can be read by `scripts/sync-index-html.mjs` outside Vite. `branding.ts` spreads it into `BrandingConfig`. |
| `config/titleTemplate.ts` | **Phase 13.** `buildTitle()` — shared page-title formatting used by both `config/site.ts` (runtime) and `scripts/sync-index-html.mjs` (build time). |
| `config/theme.ts` | `ThemeConfig` type + `applyTheme()` mechanics — colors, fonts, radius scale, card style, button style, applied at runtime as CSS custom properties. No longer holds a default theme value itself (Phase 12 — see `config/presets/`) |
| `config/presets/` | **Phase 12.** `ACTIVE_PRESET_ID` — the static default preset a white-labeled deployment edits to reskin the whole site (as of Phase 17, overridable at runtime — see `lib/themeSettingsStore.ts`). `PRESETS`/`TEMPLATE_PRESETS` — registry of 10 shipped presets (`classic`/`minimal`/`modern`/`cute`/`luxury`/`fashion`/`bakery`/`restaurant`/`electronics`/`handmade`), each bundling a `theme: ThemeConfig` plus `navStyle`/`footerStyle`/`heroStyle`/`sectionSpacing`. `applyPreset()` is called once in `main.tsx` before render, now with the *resolved* (override-aware) preset rather than the static `activePreset`. |
| `config/business.ts` | Contact info (legal name/address/email/phone/hours/social/Google-Maps-URL/response-time) consumed by Contact page / footer. Static *defaults* — as of Phase 16, all of it is overridable via Store Settings; see `lib/storeSettingsStore.ts`. |
| `config/navigation.ts` | Nav/footer link structure. Footer "Help" group now also links to all four policy routes (Phase 13); previously-dead `/shipping` link fixed to `/policies/shipping`. FAQ link now points at the real `/faq` page instead of the `/#faq` homepage anchor (Phase 14). `MAIN_NAV` is a static *default* as of Phase 21 — overridable via Navigation Editor, see `lib/navigationSettingsStore.ts`. `FOOTER_LINK_GROUPS` is likewise a static *default* as of Phase 22 — overridable via Footer Editor, see `lib/footerSettingsStore.ts`. |
| `config/site.ts` | Site name, title template (now via `config/titleTemplate.ts`'s `buildTitle()`, Phase 13), default description, default OG image, locale, Twitter handle, per-route `PAGE_META`. `siteName`/`titleTemplate`/`defaultDescription` are still computed once from the static branding default at module load — `useSiteMeta` (Phase 16) no longer reads these three for the live `<title>`/description/`og:site_name`, resolving branding fresh instead so a Store Settings save is reflected; `locale`/`defaultOgImage`/`twitterHandle` are unaffected and still read from here. |
| `config/homepageLayouts.ts` | **Removed in Phase 11** — superseded by `config/layouts/home.ts` |
| `config/sectionRegistry.tsx` | Central section-key → component map, shared by Home/About/Contact and (Phase 14) any `DynamicPage`. Gained `newArrivals`/`collections` (Phase 13). |
| `config/layouts/home.ts` | `ACTIVE_HOME_LAYOUT` — which named homepage template is the static default (`classic`/`minimal`/`modern`/`luxury`; as of Phase 18, overridable at runtime — see `lib/homepageSettingsStore.ts`); `HOME_LAYOUTS` defines each one's sections, with per-section `enabled`/`order`/`title`/`subtitle`/`settings`. `classic` gained `newArrivals`/`collections` (Phase 13). `HOMEPAGE_SECTION_LABELS`/`ALL_HOMEPAGE_SECTION_KEYS` (Phase 18) — friendly display names and the canonical 12-key order, for the Homepage Editor's section-list UI. |
| `lib/homepageSettingsStore.ts` | **Phase 18.** `localStorage`-backed override for `activeLayoutId` (which of the 4 named layouts is active) and, optionally, a full customized `sections` array for that layout. `resolveActiveHomeLayoutId()`/`resolveHomeLayout()` layer the saved override over `config/layouts/home.ts`'s static default; `saveHomepageSettingsOverride()` drops a stale `sections` array if `activeLayoutId` changes without a matching new `sections` in the same save (same guard as Phase 17's `theme`). `buildFullSectionList()` expands a layout's sections to cover all 12 `HomepageSectionKey`s (missing ones appended as disabled) for the editor UI. `resetHomepageSettingsOverride()` clears back to `ACTIVE_HOME_LAYOUT`, dispatching `HOMEPAGE_SETTINGS_CHANGE_EVENT`. |
| `hooks/useHomepageSettings.ts` | **Phase 18.** Reactive hook wrapping `homepageSettingsStore.ts` — returns the currently-resolved `layout`, `save()`/`reset()`, `isOverridden`, and re-renders on any change. No DOM side effect to reapply (unlike `useThemeSettings.ts`) - a section arrangement is just data `pages/Home.tsx` reads at render time. |
| `config/layouts/about.ts` | `ABOUT_LAYOUT` — `/about`'s section order/config (one default layout today) |
| `config/layouts/contact.ts` | `CONTACT_LAYOUT` — `/contact`'s section order/config (one default layout today) |
| `config/layouts/shop.ts` | `SHOP_SETTINGS` — page-level settings for `/shop` (search/filter/sort visibility, default sort, grid columns); **not** a section layout, see Known Issues |
| `config/layouts/pages/` | **Phase 14.** `types.ts` — `DynamicPageDefinition` (a `PageLayout` plus `slug`/`path`/`meta`); `faq.ts` — the `/faq` page definition; `index.ts` — `DYNAMIC_PAGES`, the slug-keyed registry `pages/DynamicPage.tsx` reads from. Adding a new standalone page means adding one file here (registered in `index.ts`) plus one `<Route>` in `App.tsx` — never a new page component. |
| `config/adminNav.ts` | **Phase 15.** `ADMIN_NAV` — every admin sidebar section (Dashboard, Store Settings, Theme, Homepage, Products, Categories, Navigation, Footer, Policies, Media), each with an `available` flag; only `available` entries get a real `path` and are clickable, the rest render as inert "Soon" rows in `AdminLayout`. Dashboard and Store Settings became `available` in Phase 16; Theme in Phase 17; Homepage in Phase 18; Products in Phase 19; Categories in Phase 20; Navigation in Phase 21; Footer in Phase 22. |
| `lib/storeSettingsStore.ts` | **Phase 16.** `localStorage`-backed override for the Store Settings-editable subset of `branding`/`business` (namespaced via `storageKey("store-settings")`). `resolveBranding()`/`resolveBusiness()` layer the saved override over the static default per field; `saveStoreSettingsOverride()`/`resetStoreSettingsOverride()` persist and dispatch `STORE_SETTINGS_CHANGE_EVENT` for same-tab reactivity. |
| `hooks/useStoreSettings.ts` | **Phase 16.** Reactive hook wrapping `storeSettingsStore.ts` — returns the currently-resolved `branding`/`business`, `save()`/`reset()`, and re-renders its caller on any change (same tab or another tab). Every component that shows admin-editable branding/business info should use this instead of importing `branding`/`business` directly. |
| `lib/themeSettingsStore.ts` | **Phase 17.** `localStorage`-backed override for `activePresetId` (which of the 10 shipped presets is active) and, optionally, a full customized `ThemeConfig` for that preset. `resolveActivePresetId()`/`resolveActivePreset()` layer the saved override over `config/presets/`'s static default; `saveThemeSettingsOverride()` explicitly drops a stale `theme` if `activePresetId` changes without a matching new `theme` in the same save, so a preset switch never silently carries over another preset's color customization. `resetThemeSettingsOverride()` clears back to `ACTIVE_PRESET_ID` and its shipped theme, dispatching `THEME_SETTINGS_CHANGE_EVENT`. |
| `hooks/useThemeSettings.ts` | **Phase 17.** Reactive hook wrapping `themeSettingsStore.ts` — returns the currently-resolved `activePreset`, `save()`/`reset()`, re-renders on any change, and calls `applyPreset()` (CSS custom properties + layout data attributes) whenever the resolved preset changes, so a save updates the live document immediately. `Navbar`/`Footer`/`Hero` read `activePreset` from this instead of the static `config/presets` import. |
| `config/fontOptions.ts` | **Phase 17.** `DISPLAY_FONT_OPTIONS`/`BODY_FONT_OPTIONS` — curated font-stack choices for the Theme Editor, one entry per distinct font already used by one of the 10 shipped presets (all loaded up front by `index.css`'s Google Fonts `@import` regardless of active preset) — avoids free-text font-family input, which could reference an unloaded family. |
| `config/radiusScales.ts` | **Phase 17.** `RADIUS_SCALE_OPTIONS` — 5 curated, proportional `sm`/`md`/`lg`/`xl`/`full` radius scales (sharp → round), each matching one of the 10 shipped presets' own values, plus `matchRadiusScaleId()` to preselect the right option in the Theme Editor's `<select>`. Avoids five independent free-text length fields, which could produce a visually inconsistent scale. |
| `content/homepage.ts` | Hero, category/product section copy, `SECTION_HEADINGS` (eyebrow/title/description per section) including `NEW_ARRIVALS_SECTION`/`COLLECTIONS_SECTION` (Phase 13), `ANNOUNCEMENT` (banner enable/message/link) |
| `content/about.ts`, `content/contact.ts` | Page copy (Phase 11: `content/contact.ts` gained `CONTACT_INTRO`, the /contact heading copy, previously hardcoded directly in `Contact.tsx`) |
| `content/policies.ts` | Privacy/Terms/Shipping/Return copy, plus `POLICY_PAGES` slug registry — routed at `/policies/:slug` via `pages/Policy.tsx` and linked from the footer (Phase 13) |
| `content/notFound.ts` | 404 code/title/description/CTA |
| `content/states.ts` | Loading label; empty-state copy (cart, wishlist, orders, product-not-found, shop-no-results); error-state copy (shop, product, error boundary); offline banner message |
| `data/categories.ts` | Category catalog |
| `data/products.ts` | Product catalog (24 products, 6/category); derives `FEATURED_PRODUCTS`, `BEST_SELLERS`, `NEW_ARRIVALS` (Phase 13 — date-sorted top 8) |
| `data/collections.ts` | Curated collections (id/slug/title/description/productIds) — rendered by the homepage `collections` section (Phase 13) |

## Coding Standards

- TypeScript throughout; `tsc -b` must pass clean before any phase is
  considered done.
- Lint via `oxlint` (`npm run lint` / `npx oxlint src`) — must report 0
  warnings/errors.
- No hardcoded branding, products, homepage text, contact info, colors, or
  logos in component code — always read from `config/`, `content/`, or
  `data/`.
- Reuse existing components/utilities before creating new ones; maintain
  established naming conventions; avoid new dependencies unless necessary.
- Tokens/colors always referenced as Tailwind utility classes resolving
  through the theme system — never hardcoded hex/px values in components.
- **New standing rule (this restructuring pass):** every future
  admin/editor phase (`ROADMAP.md` Phases 16–24) that introduces user-
  editable config must persist through a `localStorage`-override-over-
  defaults pattern, consistent across all editors, so the eventual backend
  migration (Phase 25+) has one uniform seam to replace rather than many
  bespoke ones.

## Design Principles

- **Never hardcode business-specific content in components** — the
  config/content/data three-layer split (established Phase 8, enforced
  every phase since) is the project's foundational rule.
- **Never duplicate a component to add a variant** — style/layout
  variants (homepage layouts, template presets, nav/footer/hero styles)
  are implemented as configuration read by one shared component, never as
  forked copies of that component.
- **Every new capability should degrade to today's exact behavior by
  default** — new config always ships with a default that reproduces
  current output pixel-for-pixel (e.g. `classic` preset, `cozy` spacing,
  `ANNOUNCEMENT.enabled: false`). Established Phase 9 onward, verified
  every phase since via the QA checklist.
- **One phase, one working feature, no partial states** — carried forward
  from this restructuring pass into `ROADMAP.md`'s phase rules: a phase
  never ends with something half-built.
- **Prefer the smallest correct persistence seam** — localStorage now,
  real backend later, via a consistent override/adapter pattern (see
  Coding Standards) rather than one-off solutions per feature.

## Development Workflow

Every session works like this:

1. Read `docs/MASTER_HANDOFF.md` (this file).
2. Read `docs/ROADMAP.md` — determine the next unfinished phase from its
   **Status** section.
3. Read `docs/CHANGELOG.md` for recent history/context.
4. Complete **only that one phase** (or its first unfinished sub-phase, if
   it was split for size).
5. Verify: `tsc -b && vite build` clean, `npx oxlint src` clean, `npm test`
   passing.
6. Update this file, `docs/CHANGELOG.md`, and `docs/ROADMAP.md`'s Status
   section.
7. Stop. Wait for explicit approval before starting the next phase.

The full permanent rule set (including what to do if a phase is too large)
lives in `docs/ROADMAP.md` → "Future Development Rules" — that copy is
authoritative; this section is a summary.

To start a new session, use `docs/CONTINUE_DEVELOPMENT_PROMPT.md` verbatim.

---

## Design System

- **Phase 12: the whole visual identity is now preset-driven.** 10 presets
  ship in `config/presets/` (`classic`/`minimal`/`modern`/`cute`/`luxury`/
  `fashion`/`bakery`/`restaurant`/`electronics`/`handmade`); switching
  `ACTIVE_PRESET_ID` changes colors, fonts, radius, card style, button
  style, nav layout, footer layout, hero layout, and section spacing
  together, as one cohesive look. The palette/radius/font values below are
  `classic`'s (the default, and the template's original Phase 1-11 look,
  unchanged) — every other preset uses different values for all of these.
- Palette (`classic` preset values; every preset defines its own): cream
  `#fbf6ee` (bg), surface `#fffdf9` (cards), beige `#efe3d2`
  (secondary/borders), ink `#4a3628` (text), ink-soft `#8a7565` (secondary
  text), primary/accent tokens layered on top (originally denim blue/hot
  pink from the CrafteeVee logo this template was extracted from). Success/
  error colors also defined.
- Radius scale: sm/md/lg/xl/full — configurable per preset.
  Card style: `soft | flat | outlined`. Button style: `rounded | pill |
  square`. Both configurable per preset, and — as of Phase 12 — actually
  consumed: `Button`/`Card` read `--btn-radius`/`--card-radius`/
  `--card-shadow`/`--card-border-color` CSS custom properties (set by
  attribute selectors in `index.css` keyed off the `data-button-style`/
  `data-card-style` attributes `applyTheme()` writes on `<html>`). Phase
  1-11 already wrote those data attributes as "future CSS hooks" but
  nothing consumed them until now.
  Fonts: display + body, configurable per preset (10 font families across
  all presets, all loaded via one Google Fonts `@import` in `index.css`).
- **Layout style axes (Phase 12)**, each with 3-4 variants implemented as
  internal branches inside one shared component (not duplicated files):
  - `navStyle` (`Navbar.tsx`): `standard` (logo left, links center, full
    icon cluster right), `centered` (logo on its own row, links + icons
    below), `minimal` (compact single row, links and secondary icons
    tucked behind the menu toggle at every breakpoint).
  - `footerStyle` (`Footer.tsx`): `columns` (logo column + one column per
    link group), `stacked` (everything centered in one column), `minimal`
    (logo + social + copyright only).
  - `heroStyle` (`Hero.tsx`): `illustrated` (text left, floating "blob"
    illustration right), `bold` (centered, large type, tinted background
    block), `minimal` (left-aligned, quiet, single primary CTA).
  - `sectionSpacing` (`lib/sectionStyle.ts`): `compact`/`cozy`/`relaxed`/
    `spacious` — one of four vertical-rhythm scales every section's
    `padding` token resolves through.
- Signature recurring visual: `Squiggle` component (wavy sparkle-string
  motif) used as section divider/underline accent (omitted in the
  `minimal`/`fashion`/`luxury`-footer and `bold`/`minimal`-hero variants,
  which favor quieter compositions).
  Illustrated `CraftIcon` "blob + icon" motif used in place of stock photos
  for product/category art (built from design tokens, echoes the Squiggle
  signature).
- Dark mode supported (`useTheme` hook), established in Phase 1 — orthogonal
  to preset selection, works with every preset.

## Reusable Components (`src/components/ui/`)

Button, Card, Input, Textarea, Modal, Accordion, CategoryMosaic, CraftIcon,
Loading (Spinner/LoadingState/Skeletons), ProductCard, QuantityStepper,
SectionHeading, Skeleton, Squiggle, StateMessage (EmptyState/ErrorState/
OfflineState), WishlistButton. `ErrorBoundary` at the top level.

## Utilities (`src/lib/`)

`auth.ts`, `checkout.ts`, `cn.ts` (classname merge), `currency.ts`,
`iconRegistry.ts` (maps category/product icon keys to `CraftIcon` — cosmetic
rename to `CategoryIcon` proposed but not done, see Known Issues),
`orders.ts`, `productFilters.ts`, `productsStore.ts`/`productValidation.ts`
(Phase 19 catalog override + form validation),
`categoriesStore.ts`/`categoryValidation.ts` (Phase 20 category catalog
override + form validation),
`storeSettingsStore.ts`/`storeSettingsValidation.ts`,
`themeSettingsStore.ts`, `homepageSettingsStore.ts`, `adminStats.ts`. Most
have matching `.test.ts` files.

## State Management

React Context, no external state library:
- `CartContext`/`CartProvider` — cart lines, persisted to `localStorage`
  (namespaced key via `storageKey('cart')`); `MAX_QTY` = 10, hardcoded
  constant (no per-product stock field exists yet — see Known Issues,
  tracked in `ROADMAP.md` Phase 29 — Inventory).
- `WishlistContext`/`WishlistProvider` — stores product ids only, joins
  product data from `ALL_PRODUCTS` at read time; same
  read-on-init/write-on-change persistence pattern as Cart.
- `AuthContext`/`AuthProvider` — mock accounts; `signup()`/`login()` read/
  write a `localStorage` user record (storage extracted to
  `lib/userStore.ts` in Phase 15); session is a single email string.
  `AuthUser` gained a `role: "admin" | "customer"` field (Phase 15),
  defaulting every self-signup account to `"customer"` — used solely to
  gate `/admin` via `RequireAdmin`. Heavily commented as a flow demo,
  explicitly not production-secure (see Known Issues, tracked in
  `ROADMAP.md` Phase 26 — Authentication).

## Dependencies

**Runtime**: `react` 19, `react-dom` 19, `react-router-dom` 7,
`framer-motion` 12, `clsx`, `tailwind-merge`, `lucide-react`.
**Dev**: `typescript` ~6.0, `vite` 8, `@vitejs/plugin-react`, `tailwindcss`
4 + `@tailwindcss/vite`, `postcss`, `autoprefixer`, `oxlint`, `vitest` 4 +
`@testing-library/react`/`jest-dom`/`user-event`, `jsdom`, `@types/*`.
No new npm dependencies were introduced in Phase 13 (or the prior
restructuring pass); keep new deps to a minimum per project rules. Phase
13's `scripts/sync-index-html.mjs` does add one new environment
requirement: **Node 22.6+** for build-time (native, unflagged TypeScript
import) — already implied by this project's toolchain, but worth noting
for CI/deploy environments.

---

## Known Issues

- **Shop is not part of the Phase 11 section system.** It's a single
  stateful, URL-query-driven view (search/filter/sort), not a stack of
  independent content blocks, so decomposing it into reorderable sections
  would mean redesigning its interactive layout — explicitly out of scope
  so far. It gets page-level `settings` instead
  (`config/layouts/shop.ts`: search/filter/sort visibility, default sort,
  grid columns), a deliberately simpler, different shape from
  `PageLayout`. Not currently scheduled in `ROADMAP.md`; revisit if a more
  granular Shop layout is ever wanted.
- **~~No standalone `/faq` route~~ — resolved in Phase 14.** `/faq` is now
  a real routed page (`config/layouts/pages/faq.ts`, via the generic
  `pages/DynamicPage.tsx`), reusing the existing `faq` section. The
  homepage's own `faq` section (in `HOME_LAYOUTS.classic`) is unaffected —
  the FAQ accordion still appears on both `/` and `/faq`, since both just
  render the same registered `faq` component from their own layout.
- **A handful of section width/padding defaults were mapped onto a shared
  5-value scale** (`sectionStyle.ts`: `padding: none/sm/md/lg/xl`,
  `width: narrow/medium/default/wide/full`) rather than preserving every
  section's exact original Tailwind value. Two sections' widths moved by
  one scale step from their pre-Phase-11 value (Newsletter: `max-w-2xl` →
  `max-w-3xl`; About's CTA: `max-w-2xl` → `max-w-3xl`), and Contact's
  intro/details spacing changed from one shared `py-16` block with a
  `mt-12` gap to two independently-padded sections (`py-16` then `py-8`).
  These are intentionally small, visually minor trade-offs in exchange for
  a single consistent settings vocabulary across every section on every
  page — worth a visual check before shipping (see QA Checklist).
- **Theme CSS variable/class *names* still reference "denim"/"bloom"**
  (e.g. `bg-denim`, `text-bloom-deep`) rather than "primary"/"accent" —
  cosmetic only, the underlying *values* are fully config-driven and
  re-theming works correctly. A rename would only matter to a developer
  reading the code. Not currently scheduled.
- **~~Mock auth is not secure and must not be treated as
  production-ready~~ — resolved in Phase 26.** Auth now runs against real
  Supabase Auth (`lib/api/auth.ts`) instead of a `localStorage` table with
  plaintext passwords; Supabase owns password hashing/storage. The `role`
  field lives in the `profiles` table behind Row Level Security (see
  `supabase/schema.sql`), not a client-editable record.
- **No password reset / "forgot password" flow, and no account editing or
  deletion.** Supabase Auth supports all three, but wiring them into this
  app's UI wasn't in Phase 26's brief. Not currently scheduled — revisit
  alongside a future account-management phase.
- **No real checkout/payment processing.** "Place order" is a simulated
  submission — scheduled as `ROADMAP.md` Phase 31 (Payments).
- **`MAX_QTY` (10) is a hardcoded constant** in `CartProvider.tsx` — no
  per-product stock/inventory field exists on `Product` yet. Scheduled as
  `ROADMAP.md` Phase 29 (Inventory).
- **`iconRegistry`/`CraftIcon` naming** reads as craft-specific; a cosmetic
  rename to `CategoryIcon`/`iconRegistry` semantics was proposed in Phase
  8A but not done. Not currently scheduled.
- **~~The Login page tests use real timers...~~ — resolved in Phase 26.**
  The mock auth's artificial delay is gone along with the mock itself;
  the fake Supabase client (`src/test/fakeSupabaseAuth.ts`) resolves
  immediately.
- No CI workflow wired up yet to run `npm test` automatically on push/PR.
  Not currently scheduled as its own phase; candidate for folding into
  `ROADMAP.md` Phase 37 (Commercial Release Preparation).
- **`AuthProvider`'s initial Supabase session check is async, and only
  `RequireAuth`/`RequireAdmin` wait for it to settle.** Everywhere else
  that reads `useAuth()` (`Checkout.tsx`'s account-info pre-fill,
  `Navbar`'s account-menu-vs-Login-link) can render a signed-out-looking
  state for a brief moment on a hard refresh before flipping to
  signed-in. Not currently scheduled — revisit if it proves noticeable in
  practice; the fix would be threading `isInitializing` into those
  consumers too, same pattern the two route guards already use.
- **No admin signup flow.** Making an account an admin is a manual step —
  sign up normally, then flip that account's `profiles.role` to `admin`
  in the Supabase dashboard (see README's Backend section). Unchanged
  from the Phase 6 mock's design; a proper admin-management UI isn't
  scheduled yet.
- **`lib/adminStats.ts`'s admin-dashboard customer count still reads the
  old mock's `lib/userStore.ts`, not real Supabase signups**, since
  Phase 26's scope was authentication only, not the admin Customers page.
  That count is disconnected from reality until `ROADMAP.md` Phase 30
  (Customers) migrates it.
- **No admin UI yet to manage media.** Phase 16
  added the first real editor (Store Settings — business name/tagline/
  description/contact info); Phase 17 added the second (Theme — preset
  switching + color/font/radius/card/button customization); Phase 18 added
  the third (Homepage — layout switching + section reorder/enable/
  configure); Phase 19 added the fourth (Products — catalog CRUD); Phase 20
  added the fifth (Categories — catalog CRUD with a delete guard against
  categories still in use); Phase 21 added the sixth (Navigation — header
  nav add/remove/reorder/rename); Phase 22 added the seventh (Footer — link
  column CRUD + copyright line, plus in-place editing of the existing
  Store Settings social-links override); Phase 23 added the eighth
  (Policies — per-slug title/date/section content editing for
  Privacy/Terms/Shipping/Returns). The remaining sidebar section (Media)
  is still a "Soon" row with no working page behind it. This is the
  primary subject of `ROADMAP.md` Phase 24.
- **Cart, Wishlist, and `data/collections.ts` still read the static
  `ALL_PRODUCTS` export directly, not the live backend catalog.** A
  product edited/deleted in Product Manager will show stale data (old
  name/price, or a since-deleted product) if it's already in a cart/
  wishlist, or if it's referenced by id in a curated collection.
  Explicitly out of scope for both Phase 19 (its Completion Criteria
  named only `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS`) and
  Phase 27 (Products, backend-integrated — scoped to Product Manager/
  Shop/homepage product fetching only, per `ROADMAP.md`). Not currently
  scheduled; revisit if these three become a source of visible drift in
  practice.
- **`lib/adminStats.ts`'s dashboard product count and
  `lib/categoriesStore.ts`'s `countProductsInCategory()` (the Category
  Manager delete-guard) read a deprecated, non-persistent in-memory
  cache (`productsStore.ts`'s `getCachedProducts()`/`setProductsCache()`)
  instead of the live backend**, since Phase 27 (Products,
  backend-integrated) intentionally left Category Manager itself
  out of scope. The cache is accurate once any page has fetched the
  real catalog this session (Shop, Product Manager, ProductDetail, or a
  homepage product section), but starts seeded with the static
  placeholder catalog as a bootstrap default before that — so a
  freshly-loaded `/admin` dashboard or `/admin/categories` with no prior
  product fetch this session could show a stale count until some other
  page loads live data. Not currently scheduled; resolved for real once
  a future phase migrates Category Manager onto the backend and converts
  both call sites to real async calls.
- **Homepage Editor has no live in-page preview**, unlike Theme Editor.
  This is intentional, not an oversight: a section arrangement is just
  data `pages/Home.tsx` reads at render time, with no DOM side effect to
  reapply the way `applyPreset()` gives Theme Editor a natural live-preview
  hook. Saved changes are only visible by actually visiting `/` (`Home`
  isn't mounted while the admin is on `/admin/homepage` — the admin/
  storefront route trees are separate). Matches the Phase 18 brief's scope
  exactly; not currently scheduled to change.
- **Theme Editor's live preview mutates the whole document, not a scoped
  preview panel.** Since `applyPreset()`/`applyTheme()` work by writing
  CSS custom properties onto `<html>`, editing a field on `/admin/theme`
  re-skins the entire visible page (including the admin shell itself) as
  you type, not just an isolated mockup. This is intentional — it reuses
  the exact mechanism `main.tsx` already uses at boot rather than building
  a second, parallel preview system — but it does mean the admin shell's
  own colors shift live while editing, which could read as unpolished to
  an unfamiliar admin. An unmount effect reverts to the actually-saved
  state on leaving the page. Not currently scheduled to change; revisit if
  user feedback suggests a scoped preview would read better.
- **Theme Editor's radius control is a curated 5-option scale, not five
  independent fields.** `minimal`/`bakery`/`handmade`'s shipped radius
  values don't exactly match any of the 5 curated scales in
  `config/radiusScales.ts` (the other 7 presets' do) — picking one of
  those three presets shows "Custom (preset default)" in the radius
  `<select>` until the admin actively picks a curated scale, which then
  replaces all four values (`sm`/`md`/`lg`/`xl`) at once. This trades a
  small UX rough edge for guaranteeing the radius values always stay
  proportional to each other (see `MASTER_HANDOFF.md` Architecture
  Overview). Not currently scheduled to change.
- **`config/site.ts`'s `PAGE_META` per-route description strings are still
  computed once from the static branding default at module load** (e.g.
  `shop`: `` `Browse the full catalog at ${branding.businessName}.` ``) —
  a Store Settings business-name edit won't update these specific fallback
  strings, even though it does update the live document `<title>`, the
  default (homepage) meta description, and `og:site_name` (all resolved
  fresh by `useSiteMeta`, Phase 16). Each of these routes already passes
  its own explicit description, so the mismatch is confined to a
  business-name mention inside otherwise-fine per-page SEO copy — not
  currently scheduled; would need `PAGE_META` converted from a static
  object to a function, matching the `useSiteMeta` change, if closed.
- **The admin account is a seeded demo credential, not a real
  admin-management system.** `lib/userStore.ts` auto-creates one admin
  account (`admin@example.com` / `admin12345`) the first time the user
  store is read, since Phase 15 is only the gated shell — there's no
  signup-time role picker or admin-user-management UI yet. Anyone with
  access to the deployed app's source (i.e. everyone, since it's a
  client-only mock) can read these credentials or grant themselves admin
  by editing `localStorage` directly. This is consistent with the rest of
  the mock-auth system's documented insecurity (see the mock-auth bullet
  below) and is fine for demoing the gate, not for production use. Not
  currently scheduled for hardening on its own — resolved for real once
  `ROADMAP.md` Phase 26 (Authentication, backend-integrated) lands.
- **Font loading isn't preset-scoped.** `index.css`'s Google Fonts
  `@import` loads all 10 font families used across every preset,
  regardless of which one is active — simplest correct approach for a
  build-time preset choice, but means ~8 unused font families download in
  the browser. Candidate for `ROADMAP.md` Phase 36 (Performance).
- **Preset style-variant rendering was verified via full builds for all
  10 presets + a manual visual pass, not via component-level RTL tests
  asserting each `navStyle`/`footerStyle`/`heroStyle` branch's exact
  markup.** `config/presets/index.test.ts` covers registry shape/
  uniqueness/value-validity, not per-variant rendering. Not currently
  scheduled.
- **Only the 10 shipped presets' navStyle/footerStyle/heroStyle/
  sectionSpacing combinations are exercised** — the full combinatorial
  space is larger and reachable by authoring a custom `TemplatePreset`,
  just not pre-built/tested as a named preset. Not currently scheduled.

## Technical Debt

- Home/About/Contact each have exactly one active layout wired up in
  practice — Home has 4 presets to choose from (`config/layouts/home.ts`),
  but About/Contact only have their single default layout defined so far.
  Adding alternates for them follows the exact same pattern as Home's. Not
  currently scheduled.
- Section `settings` only cover padding/background/width/align. Requests
  like per-section image position or button visibility would need
  extending `SectionSettings` in `types/layout.ts` and each section's own
  render logic — not done broadly yet since no section currently needs it;
  the type is intentionally easy to extend.
- Search on the Shop page has no debounce (fine at current 24-product
  catalog size; would want one if the catalog grows significantly —
  revisit alongside `ROADMAP.md` Phase 27, Products/backend-integrated).
- Simulated fetch functions (`fetchProducts()`, `fetchProductById()`) can't
  actually fail, so the corresponding `ErrorState` retry paths are
  untestable in a meaningful way until a real API exists — resolved once
  `ROADMAP.md` Phase 27 lands.
- Test coverage is concentrated on state/logic (contexts, `lib/`) rather
  than every page — broader page-level tests (Shop/Checkout/Account flows),
  `@vitest/coverage-v8` numeric coverage, and CI wiring are natural
  follow-ups, not yet scoped as their own phase.
- `Navbar`/`Footer`/`Hero` each grew meaningfully larger (Phase 12) by
  hosting 3 layout variants inline rather than as separate files. This was
  a deliberate trade-off ("reuse existing components, don't duplicate
  layouts"), but if a preset's variant needs substantially more markup in
  a future phase, revisit whether internal branching still reads cleanly
  or whether extracting per-variant subcomponents (still within the same
  file/module) would help.

## Performance Notes

Current production build: `dist/assets/index-*.js` ≈ 522 kB (≈159 kB
gzip), CSS ≈ 54 kB (≈9.8 kB gzip) — grew from Phase 14 with the admin
shell (sidebar, dashboard, guard components). No code-splitting/route-
based chunking has been introduced yet — tracked as `ROADMAP.md` Phase 36
(Performance), and worth watching as admin/backend phases add weight
before then. The admin bundle is a good early candidate for route-based
splitting once Phase 36 lands, since it's dead weight for anyone who never
visits `/admin`.

## Accessibility Notes

No dedicated a11y audit phase has run yet; the project rules require
preserving accessibility on every change, but this has been enforced
per-phase via manual review rather than automated tooling (no
`eslint-plugin-jsx-a11y` or axe integration currently wired in). Not
currently scheduled as its own phase.

## Security Notes

Auth is real as of Phase 26 (Supabase Auth + RLS-protected `profiles`
table — see `supabase/schema.sql`), not the earlier client-side mock. Two
things to keep in mind:
- `VITE_SUPABASE_ANON_KEY` is meant to be public (it's the "anon" key,
  ships in the client bundle by design) — access control is enforced by
  the Row Level Security policies in `supabase/schema.sql`, not by
  keeping that key secret. Never put a Supabase *service-role* key
  anywhere in this app's client code.
- There is no admin signup flow — an account becomes an admin only by
  someone with Supabase dashboard access flipping its `profiles.role`
  directly (see README's Backend section and Known Issues). Treat
  dashboard/project access itself as the security boundary for granting
  admin rights.
- As of Phase 27, `products` table writes (insert/update/delete) are
  RLS-gated the same way — only a signed-in user whose own
  `profiles.role` is `admin` can write, checked in the database itself
  via `supabase/schema.sql`'s policies, not just hidden behind a
  client-side route guard. Read access remains public (`select` policy),
  matching a storefront catalog's normal visibility.

---

## Completed Features

Full storefront UX: Home (12 sections, 4 switchable layout presets), Shop
(filter/sort/search, page-level display settings), Product Detail, Cart
(drawer + page), Checkout, Order Confirmation, Wishlist,
Login/Signup/Account with order history (Supabase-backed as of Phase
26), About (5 sections), Contact (2
sections), 4 routed Policy pages (Phase 13), a routed `/faq` page (Phase
14), 404. Dark mode. Site-wide announcement banner. Automated test suite
(203 tests/38 files). Full white-label config/content/data separation
(Phases 8/8A/9) — no component holds hardcoded business content as of
Phase 9. Site-wide page builder (Phase 11) — Home/About/Contact sections
are enabled/ordered/retitled/restyled entirely from `config/layouts/`, via
one shared `config/sectionRegistry.tsx`. Template preset system (Phase
12) — 10 complete visual identities (`config/presets/`), each bundling
colors/fonts/radius/card-style/button-style with nav/footer/hero layout
and section-spacing choices; switching `ACTIVE_PRESET_ID` reskins the
entire site with zero component edits. Content Architecture Completion
(Phase 13) — every remaining Phase-9-era data-only gap now has real UI:
`newArrivals`/`collections` homepage sections, routed policy pages, and a
build-time `index.html` meta sync. Dynamic Pages (Phase 14) — the section
system now generalizes to any standalone page via `config/layouts/pages/`
+ `pages/DynamicPage.tsx`, proved out with a real `/faq` page. Admin
Foundation (Phase 15) — an auth-gated `/admin` shell (`RequireAdmin`,
`AdminLayout`, `AdminDashboard`) with a real, live-data dashboard; the
foundation every editor phase (16–24) builds on next. Store Settings
(Phase 16) — the first working admin editor: business name/tagline/
description/contact info are editable from `/admin/store-settings`,
persist to `localStorage`, and reflect live across Navbar/Footer/Contact/
page metadata/the admin shell without a reload — the pattern every later
editor reuses. Theme Editor (Phase 17) — the second working admin editor,
at `/admin/theme`: switch the active template preset (all 10 shipped
presets, replacing the Phase 12 code-level edit) and customize its
colors/fonts/radius/card/button style on top, with a genuinely live
whole-document preview as you edit and the same persist/reset pattern as
Store Settings. Homepage Editor (Phase 18) — the third working admin
editor, at `/admin/homepage`: pick a starting layout (all 4 named
layouts, replacing the Phase 11 code-level edit), then reorder, enable/
disable, and configure any of the 12 registered homepage sections,
persisted the same way and read by `Home.tsx`'s unchanged rendering
engine. Product Manager (Phase 19) — the fourth working admin editor, at
`/admin/products`: list/search/filter the catalog, and create/edit/delete
products through a form covering every `Product` field, persisted the
same override way (this time overriding a *list* of records rather than
one settings object) and read live by Shop, Product Detail, and the
homepage's Featured/Best-Sellers/New-Arrivals sections. Category Manager
(Phase 20) — the fifth working admin editor, at `/admin/categories`: list
and create/edit/delete categories through a form covering every
meaningfully-consumed `Category` field, persisted the same list-override
way, with deletion blocked outright (not just warned) for any category
still assigned to at least one product, and read live by Shop's category
filter, the homepage `Categories` section, `CraftIcon`/`CategoryMosaic`,
Product Detail, and Product Manager's own category picker. Navigation
Editor (Phase 21) — the sixth working admin editor, at
`/admin/navigation`: add/remove/reorder/rename the header nav links,
persisted as a single overridable array and read live by `Navbar.tsx`
across all three `navStyle` variants. Footer Editor (Phase 22) — the
seventh working admin editor, at `/admin/footer`: add/remove/reorder
footer link columns (and the links within each), an editable copyright
line, and in-place editing of the existing Store Settings social-links
override, read live by `Footer.tsx` across all three `footerStyle`
variants. Policy Editor (Phase 23) — the eighth working admin editor, at
`/admin/policies`: edit the title, last-updated date, and ordered
sections of each of the four policy pages
(Privacy/Terms/Shipping/Returns), persisted per-slug and read live by
`pages/Policy.tsx` on next visit.

## QA Checklist (as of Phase 20)

- [x] `tsc -b` — clean
- [x] `npm run build` (sync script + `tsc -b` + `vite build`) — clean
      production build
- [x] `npx oxlint src` — 0 warnings, 0 errors
- [x] `npm test` — 266/266 tests passing, 46 files
- [x] A Category Manager create/edit/delete persists across a browser
      refresh (`categoriesStore.test.ts`, `CategoryManager.test.tsx`)
- [x] "Reset to defaults" on the Category Manager clears every override
      (edits, creates, and deletes) and restores the full static list,
      and is disabled when there's nothing to reset
      (`CategoryManager.test.tsx`)
- [x] A category still assigned to at least one product has its delete
      button disabled (not just a warning dialog) — the delete-
      confirmation modal never opens for it — while an unused category
      deletes normally after confirmation (`CategoryManager.test.tsx`)
- [x] `countProductsInCategory()` reads the live, override-aware product
      catalog and updates immediately after a product is added to or
      removed from that category (`categoriesStore.test.ts`)
- [x] `Shop`'s category filter/heading, the homepage `Categories` section,
      `CraftIcon`, `CategoryMosaic`, `ProductDetail`, and Product
      Manager's own category picker all read the resolved (override-
      aware) category list, not the static `data/categories.ts` export
      (confirmed via code inspection + full test suite; no dedicated
      cross-page test written this phase)
- [x] Creating a category without a name is blocked with an inline error,
      not silently saved (`CategoryManager.test.tsx`)
- [x] `generateCategoryId()` produces a unique, readable id/slug from the
      category name and never collides with an existing static or
      previously-created id (`categoriesStore.test.ts`)
- [x] A Product Manager create/edit/delete persists across a browser
      refresh (`productsStore.test.ts`, `ProductManager.test.tsx`)
- [x] "Reset to defaults" on the Product Manager clears every override
      (edits, creates, and deletes) and restores the full static catalog,
      and is disabled when there's nothing to reset
      (`ProductManager.test.tsx`)
- [x] Editing a product's tag/sales rank/date added correctly changes its
      membership and ordering in `FEATURED_PRODUCTS`/`BEST_SELLERS`/
      `NEW_ARRIVALS`, and deleting it removes it from all three
      (`productsStore.test.ts`)
- [x] `Shop`, `ProductDetail`, and the homepage `FeaturedProducts`/
      `BestSellers`/`NewArrivals` sections read the resolved (override-
      aware) catalog, not the static `data/products.ts` exports
      (confirmed via code inspection + full test suite; no dedicated
      cross-page test written this phase)
- [x] Creating a product without a name is blocked with an inline error,
      not silently saved (`ProductManager.test.tsx`)
- [x] `generateProductId()` produces a unique, readable id from the
      product name and never collides with an existing static or
      previously-created id (`productsStore.test.ts`)
- [x] A Homepage Editor save (layout switch and/or section reorder/
      enable/settings edit) persists across a browser refresh
      (`homepageSettingsStore.test.ts`, `HomepageEditor.test.tsx`)
- [x] Switching layout without also saving new sections drops any stale
      arrangement left over from a *different* previously-selected layout,
      rather than silently reattaching it (`homepageSettingsStore.test.ts`)
- [x] "Reset to defaults" on the Homepage Editor clears the override, is
      disabled when there's nothing to reset, and re-selects
      `ACTIVE_HOME_LAYOUT` (`HomepageEditor.test.tsx`)
- [x] `Home` renders the saved Homepage Editor override (not just the
      static default) the next time it mounts (`Home.test.tsx`)
- [x] `buildFullSectionList()` always produces exactly 12 rows with
      sequential `order`, correctly marking only the layout's own sections
      as enabled (`homepageSettingsStore.test.ts`)
- [x] All 4 named layouts render as selectable options, with the
      currently-active one marked (`aria-pressed`) (`HomepageEditor.test.tsx`)
- [x] A Theme Editor save (preset switch and/or color/font/radius/card/
      button customization) persists across a browser refresh
      (`themeSettingsStore.test.ts`, `ThemeEditor.test.tsx`)
- [x] Switching preset without also saving a new theme drops any stale
      customization left over from a *different* previously-selected
      preset, rather than silently reattaching it (`themeSettingsStore.test.ts`)
- [x] "Reset to defaults" on the Theme Editor clears the override, is
      disabled when there's nothing to reset, and re-selects
      `ACTIVE_PRESET_ID` (`ThemeEditor.test.tsx`)
- [x] Saving a Theme Editor edit applies it to the live document
      (`--color-*` CSS custom properties) without a reload
      (`useThemeSettings.test.ts`)
- [x] All 10 shipped presets render as selectable options, with the
      currently-active one marked (`aria-pressed`) (`ThemeEditor.test.tsx`)
- [x] `matchRadiusScaleId()` round-trips every curated scale's own value,
      and correctly reports no match for a preset radius that isn't one
      of the 5 curated scales (`radiusScales.test.ts`)
- [x] A Store Settings save persists across a browser refresh
      (`storeSettingsStore.test.ts`, `StoreSettings.test.tsx`)
- [x] "Reset to defaults" clears the override and is disabled when there's
      nothing to reset (`StoreSettings.test.tsx`)
- [x] Editing Store Settings updates the Footer without a reload
      (`Footer.test.tsx`)
- [x] Unauthenticated visitors are redirected from `/admin` to `/login`
      (`RequireAdmin.test.tsx`)
- [x] Signed-in non-admin accounts see an access-denied panel, not a
      silent redirect or the protected content (`RequireAdmin.test.tsx`)
- [x] Signed-in admin accounts reach the protected `AdminLayout`/
      `AdminDashboard` content (`RequireAdmin.test.tsx`)
- [x] `AdminDashboard` renders live product/category counts matching the
      resolved catalog/`CATEGORIES`, not hardcoded numbers
      (`AdminDashboard.test.tsx`, `adminStats.test.ts`)
- [x] `getAdminStats()` counts only customer-role accounts and correctly
      sums orders across every registered account (`adminStats.test.ts`)
- [x] `userStore.ts` seeds exactly one admin account on first read and
      never duplicates/overwrites an existing one (`userStore.test.ts`)
- [x] `AdminLayout`'s sidebar lists every `ADMIN_NAV` entry, and every
      unavailable section renders a "Soon" badge instead of a link
      (`AdminLayout.test.tsx`)
- [x] Existing auth behavior unchanged for regular signup/login/logout —
      `AuthProvider.test.tsx` updated only to assert the new `role` field,
      not any behavior change
- [x] Full-project search for "crafteevee" — 0 matches outside historical
      `HANDOFF-PHASE-*.md` files and test files
- [x] `/admin`, `/admin/theme`, `/admin/homepage`, `/admin/products`, and
      `/admin/categories` each set their own page title via `useSiteMeta`
      (`PAGE_META.admin`/`PAGE_META.adminTheme`/`PAGE_META.adminHomepage`/
      `PAGE_META.adminProducts`/`PAGE_META.adminCategories`)
- [ ] Manual visual QA (dev server / screenshots) of `/admin/categories`
      (list, create/edit modal, delete confirmation, disabled delete
      state) — not run in this environment (no browser/screenshot tool
      available); recommended before shipping.
- [ ] Manual visual QA (dev server / screenshots) of `/admin/products`
      (list, create/edit modal, delete confirmation) — not run in this
      environment (no browser/screenshot tool available); recommended
      before shipping.
- [ ] Manual visual QA (dev server / screenshots) of `/admin`, the
      access-denied panel, the Theme Editor's live preview across all 10
      presets, and the Homepage Editor's section list — not run in this
      environment (no browser/screenshot tool available); recommended
      before shipping.
- [ ] Manual visual QA of Home (all four layouts), About, Contact, Shop's
      display-setting toggles, and each non-`classic` preset — carried
      over from Phase 13/14, still not run in this environment.

## Testing Status

Vitest + Testing Library. **437 tests / 69 files**, all passing (up from
266/46 at the start of Phase 21). Coverage concentrated on context/state
logic and `lib/` utilities, plus Login and Home page flows, plus the
preset registry's shape/uniqueness/value-validity. New in Phase 23: `lib/
policySettingsStore.test.ts` (empty-override resolves to `POLICY_PAGES`,
saving a full replacement document for one slug leaves other slugs
untouched, saving overrides for multiple slugs independently,
refresh-persistence, per-slug reset vs. reset-all, change-event dispatch
on save/reset(slug)/resetAll, corrupted-storage handling, malformed
per-slug document shape falls back to an empty override, saving a document
with an explicitly empty section list), `lib/policyValidation.test.ts`
(title/date/section required-field checks, per-section errors at the
matching index, `hasPolicyDocumentErrors()` for each individual failure
mode), `hooks/usePolicySettings.test.ts` (resolves to `POLICY_PAGES`
initially with no slug overridden, re-renders immediately after
`save()`/`reset(slug)`/`resetAll()` in the same tab, confirms an edit to
one slug never affects another), `pages/admin/PolicyEditor.test.tsx` (page
title; form prefilled from the Privacy policy by default; switching tabs
loads the selected policy's content; both reset buttons disabled until
overridden; saving an edited title persists only that slug and shows a
confirmation; adding/removing/reordering a section persists on save;
blocking an empty title, empty date, a section missing its body, or zero
sections; reset-this-policy restores only the active slug; reset-all
clears every slug). `pages/Policy.test.tsx` was left unchanged and still
passes unmodified, since its tests run against a clean `localStorage` and
`resolvePolicyDocument()` falls through to the same static `POLICY_PAGES`
values it already asserted against. New in Phase 20: `lib/
categoriesStore.test.ts` (empty-override resolves to the static list,
creating a new category, editing a static category without duplicating
it, deleting a static category, deleting an admin-created category, reset
restores the static list, change-event dispatch on save/delete/reset,
corrupted-storage handling, `countProductsInCategory()` counting against
the live product catalog and updating after a product save/delete,
`generateCategoryId()` slugification/collision-suffixing/fallback), `lib/
categoryValidation.test.ts`, `hooks/useCategories.test.ts` (resolves to
the static list initially with `isOverridden` false, re-renders
immediately after `save()`/`remove()`/`reset()` in the same tab, exposes
`countProductsInCategory`), `pages/admin/CategoryManager.test.tsx` (page
title; lists every category; Reset disabled until overridden; creating a
category end-to-end and persisting it; blocking an empty-name submit;
editing a category updates the list; the delete button is disabled for a
category with products assigned; deleting an unused category after
confirmation succeeds; reset clears every override and restores the full
list). New in Phase 19: `lib/
productsStore.test.ts` (empty-override resolves to the static catalog,
creating a new product, editing a static product without duplicating it,
deleting a static product, deleting an admin-created product, reset
restores the static catalog, change-event dispatch on save/delete/reset,
corrupted-storage handling, `FEATURED_PRODUCTS`/`BEST_SELLERS`/
`NEW_ARRIVALS` re-derivation after a tag/sales-rank/date edit and after a
delete, `generateProductId()` slugification/collision-suffixing/fallback),
`lib/productValidation.test.ts`, `hooks/useProducts.test.ts` (resolves to
the static catalog initially with `isOverridden` false, re-renders
immediately after `save()`/`remove()`/`reset()` in the same tab),
`pages/admin/ProductManager.test.tsx` (page title; lists every product;
Reset disabled until overridden; search and category filtering; creating
a product end-to-end and persisting it; blocking an empty-name submit;
editing a product updates the list; deleting after confirmation; reset
clears every override and restores the full catalog). New in Phase 18: `lib/
homepageSettingsStore.test.ts` (defaults when nothing saved, layout-id
switching, layering a custom section arrangement over the selected
layout, dropping a stale arrangement when the layout id changes without a
matching new one, invalid saved layout id falls back to
`ACTIVE_HOME_LAYOUT`, refresh-persistence, reset, change-event dispatch,
corrupted-storage handling; `buildFullSectionList()` expands a partial
layout to all 12 keys with only that layout's own sections enabled,
renumbers order sequentially, and leaves a full layout's 12 sections all
enabled), `hooks/useHomepageSettings.test.ts` (resolves to
`ACTIVE_HOME_LAYOUT` initially, re-renders immediately after
`save()`/`reset()`), `pages/admin/HomepageEditor.test.tsx` (page title;
every named layout renders with the active one `aria-pressed`; all 12
sections render, enabled for the default layout; Reset disabled until
overridden; switching layout disables sections the new layout doesn't
include; toggling a checkbox flips enabled state; save persists the
layout + full 12-section list and shows a confirmation; moving a section
up changes its saved `order`; reset clears the override and re-selects
the default layout), plus two new cases in `pages/Home.test.tsx`
(unchanged default rendering; renders the saved override's section count
after switching to `minimal`). New in Phase 17: `lib/
themeSettingsStore.test.ts` (defaults when nothing saved, preset-id
switching, layering a custom theme over the selected preset while leaving
nav/footer/hero/spacing untouched, dropping a stale theme when the preset
id changes without a matching new theme, invalid saved preset id falls
back to `ACTIVE_PRESET_ID`, refresh-persistence, reset, change-event
dispatch, corrupted-storage handling), `hooks/useThemeSettings.test.ts`
(resolves to `ACTIVE_PRESET_ID` initially, re-renders immediately after
`save()`/`reset()`, applies the resolved theme's CSS custom properties to
the document), `config/radiusScales.test.ts` (every curated scale
round-trips through `matchRadiusScaleId()`; a non-curated preset radius —
`minimal`'s — correctly reports no match), `pages/admin/
ThemeEditor.test.tsx` (page title; every shipped preset renders with the
active one marked `aria-pressed`; Reset disabled until overridden;
switching preset updates selection; save persists the preset + full theme
and shows a confirmation; editing a color field persists on save; reset
clears the override and re-selects the default). New in Phase 16: `lib/
storeSettingsStore.test.ts` (empty-override defaults, layering, merging
successive saves, refresh-persistence, reset, corrupted-storage handling,
change-event dispatch, whole-value nested overrides for hours/social),
`lib/storeSettingsValidation.test.ts`, `hooks/useStoreSettings.test.ts`
(resolves to defaults initially, re-renders with the new value immediately
after `save()`/`reset()` in the same tab), `pages/admin/
StoreSettings.test.tsx` (page title, form prefilled from current config,
Reset disabled until overridden, save persists + shows a confirmation,
empty business name is blocked, reset restores the default form),
`components/layout/Footer.test.tsx` (renders the default tagline with no
override; reflects a saved override with no reload). New in Phase 15:
`lib/userStore.test.ts` (admin seeding, idempotence, password stripping),
`lib/adminStats.test.ts` (live counts, customer-role filtering, order
summation across accounts), `components/auth/RequireAdmin.test.tsx` (all
three gate states: signed out, signed in non-admin, signed in admin),
`components/admin/AdminLayout.test.tsx` (every nav section renders; every
unavailable one shows "Soon"), `pages/admin/AdminDashboard.test.tsx` (live
counts render, page title set). `AuthProvider.test.tsx` gained two tests
(signup defaults to `"customer"`; the seeded admin can log in with its
documented credentials) and had its existing `toEqual` assertions updated
for the new `role` field — no other AuthProvider behavior changed. New in
Phase 14: `pages/DynamicPage.test.tsx`, `config/layouts/pages/index.test.ts`.
No component-level tests assert `Navbar`'s per-variant rendering output —
verified instead via full builds across all 10 presets plus manual code
review. `Footer`/`Hero` similarly have no per-`footerStyle`/`heroStyle`-
variant markup tests, only the targeted Phase 16 Store Settings coverage
on `Footer`. No dedicated tests for About/Contact's section rendering or
for Shop's settings toggles. No page-level coverage for Checkout/Cart
flows yet. No numeric coverage reporting configured. New in Phase 24:
`lib/mediaStore.test.ts`, `hooks/useMediaAssets.test.ts`,
`components/admin/AssetPicker.test.tsx`, `pages/admin/MediaManager.test.tsx` —
covering both size guards (per-file and total-budget rejection, with no
partial/corrupted persistence on a rejected upload), add/remove and their
change-event dispatch, corrupted-`localStorage` handling, and the
`AssetPicker`/`MediaManager` upload/select/delete flows. Modal-close
assertions after an animated (`framer-motion`) close use `waitFor` rather
than an immediate synchronous check, since `Modal`'s exit transition keeps
the dialog in the DOM briefly after the triggering click. New in Phase 25:
`lib/api/{auth,products,categories,orders}.test.ts` (25 tests) against
`src/test/mockSupabaseClient.ts`'s shared chainable-query-builder mock -
covering the success path, the not-found/empty-result path, and the
Supabase-error-message-propagates path for every exported function,
none of them touching a real network call. New in Phase 26:
`src/test/fakeSupabaseAuth.ts`'s in-memory fake Supabase Auth +
`profiles` backend, globally mocked in for every test via
`src/test/setup.ts`; `AuthProvider.test.tsx`/`RequireAuth.test.tsx`/
`RequireAdmin.test.tsx`/`Login.test.tsx` updated for the now-async
`logout()`/session-check flow. New in Phase 27: the same fake backend
extended with a `products` table seeded from `ALL_PRODUCTS`;
`lib/productsStore.test.ts`/`hooks/useProducts.test.ts` rewritten for the
override-free, async catalog; `pages/admin/ProductManager.test.tsx`
gained a backend-error/retry case and lost its Reset-to-defaults cases;
`components/home/NewArrivals.test.tsx` updated to await the now-async
fetch; two new files, `pages/Shop.test.tsx` and
`pages/ProductDetail.test.tsx` (neither existed pre-Phase-27), cover
loading/success/error states for both pages against the mocked backend.

## Deployment Status

Not deployed. No hosting/CI/CD configured. `vite build` output verified
locally each phase.

## Release Notes

Pre-release. See `docs/CHANGELOG.md`.

---

## Next Phase

**Phase 26 — Authentication (Backend-Integrated).** Full specification
lives in `docs/ROADMAP.md`. Replaces mock `AuthProvider` with real
Supabase Auth via Phase 25's `lib/api/auth.ts`.

## Developer Notes

- This file, alongside `docs/ROADMAP.md` and `docs/CHANGELOG.md`, is now
  the complete single source of truth going forward. The root-level
  `MASTER_HANDOFF.md`/`CHANGELOG.md` files have been replaced with short
  pointers into `docs/`. The old per-phase `HANDOFF-PHASE-N.md` chain
  (Phases 1–9) remains in place for history/archaeology only — do not
  update it.
- The project was originally built for a specific business ("CrafteeVee",
  a craft goods brand) through Phase 7. Phase 8/8A converted it into a
  business-agnostic white-label template — do not reintroduce
  CrafteeVee-specific or any other business-specific content into
  component code, config defaults, or content defaults.
- Success criterion for every future session (per project rules): should
  only need the latest project files, `docs/MASTER_HANDOFF.md`,
  `docs/ROADMAP.md`, `docs/CHANGELOG.md`, and the standard Continue
  Development prompt — no prior conversation required.
- **Phase 12 pattern to follow for any future preset/layout work:** every
  new style axis (a new preset, or a new variant of `navStyle`/
  `footerStyle`/`heroStyle`/`sectionSpacing`/`cardStyle`/`buttonStyle`)
  should be addable without touching more than: (a) the relevant
  `TemplatePreset` object(s) in `config/presets/`, and (b) — only for a
  genuinely new *variant*, not a new *preset* — one more `if`/branch
  inside the single owning component (`Navbar`/`Footer`/`Hero`) or one
  more row in `SPACING_SCALES`/CSS attribute-selector block.
- **Override pattern established Phase 15, proven out by Phases 16-20, to
  follow for every remaining admin/editor phase (`ROADMAP.md` 21-24):**
  persist edits as a `localStorage` override layered over static config/
  data defaults, read through a small resolver (`override ?? default`)
  rather than replacing the default outright — this keeps every editor's
  data flow identical and gives Phase 25 (Backend Integration) one
  consistent seam to swap for a real API, feature by feature. Phase 16
  (`lib/storeSettingsStore.ts`/`hooks/useStoreSettings.ts`) is the
  reference implementation: a plain resolver function pair
  (`resolveX()`) for anything that just needs the current value, plus a
  thin reactive hook over it (subscribing to a same-tab custom event
  dispatched on save/reset, and the native cross-tab `storage` event) for
  anything that needs to re-render live when the override changes.
  Components that display admin-editable data should consume the hook,
  not the static config import, or a save won't show up without a reload.
  Phase 17 (`lib/themeSettingsStore.ts`/`hooks/useThemeSettings.ts`) adds
  two more lessons worth carrying forward: (1) when an override has two
  fields that must describe the *same* thing (here, `activePresetId` and
  `theme` — a theme customization only makes sense for the preset it was
  made against), a bare object-merge on save can silently let stale data
  reattach to a new selection; the save function needs to explicitly drop
  the now-mismatched field rather than relying on every caller to remember
  to clear it. (2) when the thing being edited is *itself* something the
  app already applies as a DOM side effect at boot (here, `applyPreset()`,
  which `main.tsx` already calls to write CSS custom properties), the
  editor page can call that exact same function directly on every
  keystroke for a genuinely live preview, rather than building a separate,
  parallel preview renderer — with an unmount effect to revert to the
  actually-saved state if the admin navigates away without saving. Phase
  18 (`lib/homepageSettingsStore.ts`/`hooks/useHomepageSettings.ts`) is
  proof the same "pair-matching" guard from lesson (1) generalizes beyond
  Theme Editor's specific `activePresetId`/`theme` pair — here it's
  `activeLayoutId`/`sections` — and also proof the pattern doesn't
  *require* a DOM side effect to be worth using: when the thing being
  edited is plain data a page reads at render time (not something applied
  imperatively at boot), the reactive hook can skip lesson (2) entirely
  and just expose the resolved value plus `save()`/`reset()` — no live
  preview needed, since the admin/storefront route trees are separate and
  the next real mount of the reading page (`Home.tsx`) resolves fresh
  automatically. Don't force every editor into the Theme Editor shape;
  match the reactivity mechanism to whether the edited thing is a DOM
  side effect or just data.
 Phase 19
  (`lib/productsStore.ts`/`hooks/useProducts.ts`) is proof the same
  pattern generalizes from overriding *fields on one object* to
  overriding *a list of records*: the override shape becomes an id-keyed
  map (`Product` = created/edited, `{ deleted: true }` = removed) instead
  of a partial object, `resolveX()` becomes "walk the static list applying
  the map, then append any ids with no static counterpart" instead of
  `override ?? default`, and any derived list built from the source data
  (here, `FEATURED_PRODUCTS`/`BEST_SELLERS`/`NEW_ARRIVALS`) needs its own
  `resolveY()` that re-runs the *same derivation rule* against the
  resolved list, rather than being overridden separately — otherwise an
  edit to the source record and its appearance in a derived list can
  drift out of sync. Phase 19 also surfaced a reusable gotcha worth
  carrying forward for any future `Modal`-based form: `Modal`'s
  focus-management effect depends on `[isOpen, onClose]`, so passing an
  inline arrow function as `onClose` (instead of a `useCallback`-
  stabilized one) gives it a new identity on every parent re-render —
  including the re-render every keystroke causes in a controlled form —
  which re-fires `dialogRef.current?.focus()` and steals focus out of
  whatever input the admin is typing into, dropping all but the first
  character. Always memoize `onClose` (and any other prop a child effect
  depends on) before passing it to `Modal`. Phase 20
  (`lib/categoriesStore.ts`/`hooks/useCategories.ts`) reuses Phase 19's
  list-override shape as-is (id-keyed map, `resolveX()` = walk-static-
  then-append-created), but adds a lesson for any future list-override
  where records are *referenced by* other records rather than only
  referencing things themselves: a naive delete would leave the
  referencing side (here, `Product.category`) pointing at an id that no
  longer resolves to anything, silently breaking whatever reads it. The
  fix is a small live "reference count" resolver
  (`countProductsInCategory()`, reading through the *other* store's own
  `resolveX()` — `resolveAllProducts()` at the time, since replaced by
  Phase 27's deprecated `getCachedProducts()` cache when the product
  catalog moved to the backend — not a cached/stale count) that
  the UI checks *before* offering the destructive action at all, rather
  than after-the-fact validation or a warning the admin can dismiss. This
  generalizes to any future editor whose records are referenced
  elsewhere (e.g. Navigation entries pointing at page slugs) — block the
  delete path itself, don't just warn. Phase 21
  (`lib/navigationSettingsStore.ts`/`hooks/useNavigation.ts`) is proof the
  override pattern scales *down* as well as up: `MAIN_NAV` is a flat array
  with no per-entry id and no named variant to select between, so instead
  of reaching for Phase 19/20's id-keyed map or Phase 17/18's paired
  "which variant + its customization" shape, the override is just one
  optional whole-array field, saved and resolved as a single unit. The
  admin page mirrors that simplicity - it edits a local copy of the full
  list and calls `save()` once with the complete array, never merging
  partial edits into a stored per-row entry. One gotcha worth carrying
  forward: a "Reset to defaults" handler that reads the *hook's* resolved
  value (e.g. `mainNav` from `useNavigation()`) to reset local form state
  will grab a stale, pre-reset value, since that value was computed on the
  render *before* `reset()` ran and the hook won't re-render with the
  cleared override until the next tick. Call the store's plain resolver
  function directly (`resolveMainNav()`) instead of the hook's value when
  a reset handler needs the freshly-cleared default synchronously in the
  same function call. Phase 22 (`lib/footerSettingsStore.ts`/
  `hooks/useFooterSettings.ts`) reuses Phase 21's whole-array-as-one-field
  shape one level deeper - `FOOTER_LINK_GROUPS` is a list of groups each
  holding a list of links, but a group still has no id referenced
  elsewhere and there's still only one list to edit, so the override
  stays `{ groups?: FooterLinkGroup[] }` rather than becoming an id-keyed
  map. It also adds a second, unrelated field (`copyrightHolder`) to the
  same override object - proof the override shape doesn't have to be a
  single field once there's a genuine second piece of independently-
  overridable data that happens to be edited on the same admin page; the
  two are saved together but resolved through separate functions
  (`resolveFooterLinkGroups()`/`resolveCopyrightHolder()`), so a reader
  that only cares about one never has to know the other exists. The
  phase's most reusable lesson going forward is about *scope*, not shape:
  the brief listed "social links" as part of Footer Editor, but
  `business.social` already had a complete override and live consumer
  from Phase 16 Store Settings - building a second override for the same
  data would have let the two silently disagree about which value is
  current. When a future phase's brief scope-line overlaps data an
  earlier phase already made fully editable, the right move is to edit
  that existing override in place (reusing its hook and `save()`) from
  the new page, not to duplicate the store. Watch for this again in
  future phases whose scope brushes up against `hours`/`address`/other
  Store Settings fields, or against fields any other editor already
  owns. Phase 23 (`lib/policySettingsStore.ts`/`hooks/usePolicySettings.ts`)
  is the first editor over a *fixed, closed* set of records rather than a
  growable list or a single settings object: `content/policies.ts`'s
  `POLICY_PAGES` has exactly four known slugs
  (`privacy`/`terms`/`shipping`/`returns`) with no admin flow to add a
  fifth or remove one of the four, so the override shape is
  `Partial<Record<PolicySlug, PolicyDocument>>` - closer to Phase 19/20's
  id-keyed map than Phase 16's single-object override, but with no
  creation/deletion sentinel needed, since every key already has a
  guaranteed static default to fall back to. Each `PolicyDocument` itself
  holds an ordered list of `{ heading, body }` sections, edited with the
  same add/remove/reorder-as-one-field-of-local-state approach Phase 21/22
  used for nav links and footer groups, just one level inside a single
  record instead of across a whole record list. `PolicyEditor.tsx` edits
  one slug at a time behind a small tab-style picker (reusing the
  preset-picker visual style from Phase 17's `ThemeEditor.tsx`), and saves/
  resets each slug independently, plus a page-wide "reset all" - useful
  precedent for any future editor covering a small fixed enum of named
  items rather than a user-managed list. Phase 24
  (`lib/mediaStore.ts`/`hooks/useMediaAssets.ts`) is the first store in
  this run with no static default to layer an override on top of - every
  prior editor (16-23) resolved `override ?? default`; media assets have
  no default, so this store is just a plain persisted list with its own
  add/remove, not a resolver. It's also the first phase to need a genuine
  storage-capacity guard rather than just a form-validation one: every
  prior override trusted `localStorage` to have room (small JSON blobs of
  text/config), but base64 image data is large enough that both a
  per-file cap and a running total need to be checked *before* attempting
  to persist, with a `try/catch` around the actual `setItem()` call as a
  last-resort safety net for a browser with a smaller real-world quota
  than assumed - reusable precedent for any future phase that stores
  user-supplied binary-ish data. The reusable-widget half of this phase
  (`AssetPicker`) is also a new shape: every prior editor was a full page
  behind an admin nav link; this is a small component *embedded inside*
  other editors' forms (Store Settings, Product Manager) and also
  available as its own page (`MediaManager.tsx`) - both read/write the
  same store, so there's no risk of the two disagreeing, the same lesson
  Phase 22 established for not duplicating an override across two
  editors, generalized to "don't duplicate a *store*, even between a
  full-page and an embedded-widget consumer of it." One test-writing
  gotcha worth carrying forward: `Modal`'s `framer-motion` exit
  transition means a dialog is still queryable in the DOM for a moment
  after the action that closes it - a synchronous
  `expect(screen.queryByRole("dialog")).not.toBeInTheDocument()`
  immediately after that action is flaky; wrap it in `waitFor()` instead,
  the same way any other async UI effect would be tested. Phase 25
  (`lib/api/`) is a different shape of phase from every one before it -
  the first that's plumbing rather than a feature: it adds a whole new
  layer (Supabase client + row contracts + one module per domain) that
  no component imports yet, on purpose, per its own brief ("no existing
  feature's behavior changes yet"). The key design choice that made that
  possible without sacrificing real test coverage: every exported
  function takes an injectable `client: SupabaseClient = supabase`
  parameter rather than importing the singleton directly - the singleton
  stays the default for real usage, but every test passes its own mock
  instead, so `lib/api/*.test.ts` never touches a network or needs real
  env vars. `client.ts` mirrors that same instinct at the module-load
  boundary: it *warns* rather than throws when `VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY` are missing, specifically because it's
  imported transitively by every other `lib/api/*` file, and a hard
  throw there would crash test collection (or the whole app) any time
  `.env` isn't present yet - the same "fail loud on actual use, not on
  cautious import" instinct as `mediaStore.ts`'s guards in Phase 24, one
  level earlier in the import chain. `src/test/mockSupabaseClient.ts`'s
  `chainableResult()` is a reusable single-shape fake for Supabase's
  query builder (every table call in this app follows one of a handful
  of chains, and the *real* builder is itself "thenable" - awaitable at
  any point in the chain, not just after a terminal `.single()`) -
  future backend-integration phases (26+) needing more table-mock
  coverage should extend this file rather than hand-rolling a new mock
  shape per test file. One correctness note worth flagging forward: RLS
  policies in `supabase/schema.sql` are deliberately permissive
  (public read for products/categories, owner-only for orders/profiles,
  no write policy at all yet for products/categories) because no UI
  wires into this schema yet - the phase that actually migrates Product
  Manager or Category Manager onto these tables needs to add an
  admin-only write policy first, not open writes to the anon key.
