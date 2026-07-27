# ROADMAP.md

**This file is the single source of truth for what to build next.** A new
Claude session determines the next unfinished phase by reading this file —
no prior conversation is required. See `MASTER_HANDOFF.md` for full current-
state documentation and `CHANGELOG.md` for the history of what's already
shipped.

---

## Status

- **Last completed phase:** 27 — Products (Backend-Integrated)
- **Next phase to start:** 28 — Orders (Backend-Integrated)
- **Rule:** complete ONE phase per session, then stop and wait for approval.

---

## Completed Phases (1–15)

Full detail lives in `MASTER_HANDOFF.md` → "Completed Phases". Summary:

| Phase | Name |
|---|---|
| 1 | Foundation |
| 2 | Homepage |
| 3 | Shop |
| 4 | Product Detail + Cart |
| 5 | Wishlist + Checkout |
| 6 | Accounts + About/Contact |
| 7 | Test Suite |
| 8 | White-Label Architecture Conversion |
| 8A | Strip Branding to Blank Template |
| 9 | Template Customization System |
| 10 | Multiple Homepage Layouts |
| 11 | Dynamic Page Builder & Layout Manager |
| 12 | Template Variants & Theme Presets |
| 13 | Content Architecture Completion |
| 14 | Dynamic Pages |
| 15 | Admin Foundation |
| 16 | Store Settings |
| 17 | Theme Editor |
| 18 | Homepage Editor |
| 19 | Product Manager |
| 20 | Category Manager |
| 21 | Navigation Editor |
| 22 | Footer Editor |
| 23 | Policy Editor |
| 24 | Media Manager |
| 25 | Backend Integration |
| 26 | Authentication (Backend-Integrated) |

---

## Remaining Phases (16+)

Every phase below is scoped to be realistically completable within **one
Claude session**, ends with a fully working feature, and never leaves
partially-implemented functionality. If a phase turns out to be too large
once work begins, split it into sub-phases (e.g. 15A, 15B), update this
file, and complete only the first unfinished sub-phase.

### Phase 15 — Admin Foundation *(COMPLETE)*

**Objective:** Stand up the admin area's shell: routing, layout, and
auth-gating. No config editing yet — this phase is the working scaffold
every later admin phase builds on.

**Scope:**
- `/admin` route tree, gated by existing `AuthContext` (or a dedicated admin
  flag/role on the mock user record — decide and document the approach).
- Admin layout: sidebar/nav listing every future admin section (Store
  Settings, Theme, Homepage, Products, Categories, Navigation, Footer,
  Policies, Media), even though only the dashboard is functional yet.
- A working `/admin` dashboard: read-only summary of current site state
  (active preset, product/category counts, order count if available, etc.)
  pulled from existing config/data — genuinely useful today, not a stub.

**Expected Deliverables:**
- Functional, auth-gated admin shell with real navigation and a real
  (read-only) dashboard.

**Completion Criteria:**
- Unauthenticated users cannot reach `/admin`.
- Dashboard renders live values from existing config/data (no hardcoded
  placeholders).
- Build/lint/tests pass; new tests cover the auth gate.

**Outcome:** Gated `/admin` with a `role: "admin" | "customer"` field on
the existing mock user record (`AuthContext`/`AuthProvider`/
`lib/userStore.ts`), enforced by `components/auth/RequireAdmin.tsx`. Since
there's no admin-signup UI yet, `userStore.ts` seeds one demo admin
account on first read (`admin@example.com` / `admin12345` — see Known
Issues in `MASTER_HANDOFF.md`). `components/admin/AdminLayout.tsx` is a
standalone sidebar shell (not nested under the storefront `Layout`)
listing every section below via `config/adminNav.ts`; only Dashboard is
routed today, the rest render as inert "Soon" rows. `pages/admin/
AdminDashboard.tsx` + `lib/adminStats.ts` render live stats (preset, home
layout, product/category/collection/dynamic-page counts, registered
customers, total orders) — see `MASTER_HANDOFF.md` for full detail.

---

### Phase 16 — Store Settings *(COMPLETE)*

**Objective:** Let an admin edit branding/business/site config through the
UI instead of hand-editing `config/branding.ts` / `config/business.ts` /
`config/site.ts`.

**Scope:**
- Admin form(s) for business name, tagline, description, contact info, and
  site metadata defaults.
- Persistence layer: since there's no backend yet, store overrides in
  `localStorage` (namespaced like Cart/Wishlist/Auth) and layer them over
  the static config defaults at read time — establishes the override
  pattern later editors (Theme, Homepage, etc.) will reuse.
- Live preview or immediate reflection of changes across the site (e.g.
  footer/contact page update after a Store Settings save).

**Expected Deliverables:**
- Working Store Settings admin page; edits persist and take effect
  immediately without a rebuild.

**Completion Criteria:**
- Refreshing the browser preserves saved settings.
- A "reset to defaults" action is available.
- Build/lint/tests pass; tests cover the override/persistence logic.

**Outcome:** `lib/storeSettingsStore.ts` persists an override
(`businessName`/`tagline`/`businessDescription` from branding;
`legalName`/`address`/`email`/`phone`/`hours`/`social`/`googleMapsUrl`/
`responseTime` from business) to `localStorage`, resolved per field
(`override ?? default`) by `resolveBranding()`/`resolveBusiness()`.
`hooks/useStoreSettings.ts` makes that reactive (same-tab custom event +
cross-tab `storage` event). `pages/admin/StoreSettings.tsx`
(`/admin/store-settings`) is the form, with validation and a "Reset to
defaults" action disabled until there's an override to clear. `Navbar`,
`Footer`, `AdminLayout`, `content/contact.ts` (now a function,
`getContactPoints()`), and `useSiteMeta` (page title/meta/`og:site_name`)
all switched from the static `branding`/`business` imports to the
reactive hook/resolver, so a save is reflected immediately, no reload —
see `MASTER_HANDOFF.md` for full detail and the one documented gap
(`PAGE_META`'s per-route description strings are still static).

---

### Phase 17 — Theme Editor *(COMPLETE)*

**Objective:** Admin UI to change the active template preset and customize
theme values (colors/fonts/radius/card/button style), replacing the
Phase 12 one-line `ACTIVE_PRESET_ID` code edit.

**Scope:**
- Preset picker showing all 10 shipped presets with live preview.
- Customization controls for the underlying `ThemeConfig` fields, using the
  same localStorage-override pattern established in Phase 16.
- `applyPreset()`/`applyTheme()` updated to check for a stored override
  before falling back to the config default.

**Expected Deliverables:**
- Working Theme Editor: switch presets and tweak individual theme values
  from the admin UI, with instant visual feedback.

**Completion Criteria:**
- Selection persists across reloads.
- All 10 presets remain selectable and correct.
- Build/lint/tests pass; tests cover override precedence (custom value >
  preset default).

**Outcome:** `lib/themeSettingsStore.ts` persists `activePresetId` and,
optionally, a full customized `theme: ThemeConfig` for that specific
preset (saved as a whole object; a preset switch without an accompanying
new `theme` explicitly drops any customization left over from a different
preset, rather than letting a bare merge reattach it). `hooks/
useThemeSettings.ts` resolves the live preset and calls `applyPreset()`
whenever it changes. `pages/admin/ThemeEditor.tsx` (`/admin/theme`) is a
preset picker plus typography/shape/color controls, with every field
change applied straight to the live document for a genuinely live,
whole-page preview (no separate preview widget), reverting to the
actually-saved state on navigating away unsaved. `Navbar`/`Footer`/`Hero`/
`lib/sectionStyle.ts`'s padding resolution/`lib/adminStats.ts` all switched
from the static `config/presets` import to the resolved/reactive version,
and `main.tsx` boots from the resolved preset so a saved choice survives a
refresh — see `MASTER_HANDOFF.md` for full detail and the two documented
trade-offs (whole-document preview instead of a scoped panel; a curated
5-option radius scale instead of four independent fields).

---

### Phase 18 — Homepage Editor *(COMPLETE)*

**Objective:** Admin UI over Phase 11's `config/layouts/home.ts` — enable/
disable sections, reorder them, and edit each section's title/subtitle/
settings, without hand-editing the config file.

**Scope:**
- Section list UI (reorder via drag-and-drop or up/down controls, toggle
  enabled/disabled).
- Per-section settings editor (title, subtitle, padding/background/width/
  align) matching `SectionSettings`.
- Persist edits via the same override pattern (Phase 16/17), read by
  `Home.tsx`'s existing rendering engine — no changes needed to how Home
  renders, only to where its layout data comes from.

**Expected Deliverables:**
- Fully working Homepage Editor; changes reflect on `/` immediately.

**Completion Criteria:**
- Reordering/toggling/editing every existing homepage section works
  end-to-end.
- The four named layout presets (`classic`/`minimal`/`modern`/`luxury`)
  remain available as starting points.
- Build/lint/tests pass.

**Outcome:** `lib/homepageSettingsStore.ts` persists `activeLayoutId` and,
optionally, a full customized `sections` array for that specific layout
(saved as a whole array; a layout switch without an accompanying new
`sections` explicitly drops any arrangement left over from a different
layout, the same guard Phase 17 established for `theme`).
`buildFullSectionList()` expands a layout's (possibly partial) sections
into all 12 registered keys, missing ones appended as disabled, so the
editor always has a complete checklist. `hooks/useHomepageSettings.ts` is
the reactive wrapper — no DOM side effect to reapply here, since a
section arrangement is just data `Home.tsx` reads at render time.
`pages/admin/HomepageEditor.tsx` (`/admin/homepage`) is a layout picker
plus a 12-row section list (enable checkbox, up/down reorder, expandable
per-section title/subtitle/padding/background/width/align settings, each
selectable field defaulting to "unset" rather than forcing a value).
`Home.tsx` itself only changed its one data source
(`HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]` → `resolveHomeLayout()`); its
rendering logic is untouched. `lib/adminStats.ts`'s "home layout" stat
also switched to the resolved value — see `MASTER_HANDOFF.md` for full
detail.

---

### Phase 19 — Product Manager *(COMPLETE)*

**Objective:** Admin CRUD for the product catalog, replacing direct edits
to `data/products.ts`.

**Scope:**
- List/search/filter view of all products in admin.
- Create/edit/delete forms covering every `Product` field.
- Persistence: localStorage-backed catalog overrides layered over (or
  eventually replacing) the static seed data, following the established
  override pattern — explicitly note this is pre-backend and will be
  migrated in Phase 27 (Products, backend-integrated).

**Expected Deliverables:**
- Working Product Manager: add, edit, and remove products; Shop/homepage
  reflect changes immediately.

**Completion Criteria:**
- Derived lists (`FEATURED_PRODUCTS`, `BEST_SELLERS`, `NEW_ARRIVALS`) stay
  correct after edits.
- Build/lint/tests pass; tests cover CRUD operations.

---

### Phase 20 — Category Manager *(COMPLETE)*

**Objective:** Admin CRUD for `data/categories.ts`, same pattern as Product
Manager.

**Scope:**
- List/create/edit/delete categories.
- Guard against deleting a category still referenced by a product (warn or
  block, document the chosen behavior).

**Expected Deliverables:**
- Working Category Manager wired to Shop's category filter and the
  homepage `Categories` section.

**Completion Criteria:**
- Category changes reflect in Shop filters and homepage immediately.
- Build/lint/tests pass.

**Outcome:** `lib/categoriesStore.ts` persists an id-keyed override map
(same shape as Phase 19's `productsStore.ts` - a `Category` value means
created/edited, `{ deleted: true }` means removed), layered over the
static `data/categories.ts` seed list; `resolveAllCategories()`/
`resolveCategoryById()` walk it the same way `resolveAllProducts()` does.
Chosen guard behavior: deletion is **blocked**, not just warned - a
category still assigned to at least one product (checked live via
`countProductsInCategory()`, which reads through `resolveAllProducts()`)
can't be deleted until it's reassigned or removed from every product;
the Category Manager's delete button is disabled with an explanatory
`aria-label`/tooltip rather than opening a confirmation the admin could
accidentally push through. `hooks/useCategories.ts` is the reactive
wrapper (same same-tab-event + cross-tab-`storage` subscription as every
prior editor). `pages/admin/CategoryManager.tsx` (`/admin/categories`) is
a list plus a create/edit modal covering every meaningfully-consumed
`Category` field (name, description, icon, accent tone, item count, image
URL, featured flag), with validation (`lib/categoryValidation.ts`,
including checking the icon name against `ICON_REGISTRY`) and a delete-
confirmation modal for the unblocked case. Every existing storefront/admin
consumer of the static `CATEGORIES` export switched to the live resolver
so an edit shows up without a reload: `components/shop/CategoryFilter.tsx`,
`pages/Shop.tsx`, the homepage `components/home/Categories.tsx` section,
`components/ui/CraftIcon.tsx`, `components/ui/CategoryMosaic.tsx`,
`pages/ProductDetail.tsx`, `pages/admin/ProductManager.tsx`'s own category
picker, and `lib/adminStats.ts`'s category count.
`lib/productFilters.ts`'s `CATEGORY_FILTER_LABELS` (a module-load-frozen
constant) became `getCategoryFilterLabels()`, a function over a passed-in
category list, for the same reason.

---

### Phase 21 — Navigation Editor *(COMPLETE)*

**Objective:** Admin UI over `config/navigation.ts` — edit header nav links
without hand-editing config.

**Scope:**
- Add/remove/reorder/rename nav links; support nested links if the current
  structure allows it.
- Same override/persistence pattern as prior editors.

**Expected Deliverables:**
- Working Navigation Editor; Navbar reflects changes immediately across all
  three `navStyle` variants.

**Completion Criteria:**
- Build/lint/tests pass; at least one test per nav style confirms edited
  links render.

**Outcome:** `lib/navigationSettingsStore.ts` persists an override
(`{ links?: NavLink[] }`) layered over the static `config/navigation.ts`
`MAIN_NAV` default; `resolveMainNav()` returns `override.links ?? MAIN_NAV`.
The simplest override shape of any editor so far: `MAIN_NAV` is already a
flat, unordered-by-id array (`{ label, to }`), so there's no id-keyed map
(Products/Categories) or named-variant pairing (Theme/Homepage) to manage
— the admin edits a local copy of the full list and saves it as one unit,
same as it's always read as one unit. `NavLink` has no nested-link field,
so no nesting support was added — the scope note ("if the current
structure allows it") doesn't apply since it doesn't. `hooks/
useNavigation.ts` is the reactive wrapper (same same-tab-event +
cross-tab-`storage` subscription as every prior editor). `pages/admin/
NavigationEditor.tsx` (`/admin/navigation`) is a list of editable label/
link rows with up/down reorder, per-row delete, an "Add link" button, and
validation (`lib/navigationValidation.ts` — non-empty label, a `to` that
either starts with "/" or is a full URL, and at least one link required
before save) that blocks saving an invalid or empty list. `components/
layout/Navbar.tsx` switched both its desktop and mobile/minimal link
lists from the static `MAIN_NAV` import to `useNavigation()`'s resolved
list, so a save is reflected immediately across all three `navStyle`
variants (`standard`/`centered`/`minimal`) with no reload — verified by a
new `Navbar.test.tsx`, one test per nav style. `FOOTER_LINK_GROUPS`/
`QUICK_LINKS` (also in `config/navigation.ts`) are out of this phase's
scope — Phase 22 (Footer Editor) covers footer links.

---

### Phase 22 — Footer Editor *(COMPLETE)*

**Objective:** Admin UI for footer link columns, social links, and
copyright text — distinct from `footerStyle` (a Theme Editor concern).

**Scope:**
- Edit footer link groups/columns, social links, copyright line.
- Same persistence pattern; respects the active `footerStyle` layout
  variant from Phase 12.

**Expected Deliverables:**
- Working Footer Editor; Footer reflects changes immediately across all
  three `footerStyle` variants.

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 23 — Policy Editor *(COMPLETE)*

**Objective:** Admin UI for the policy page copy wired to routes in Phase
13 (`content/policies.ts`).

**Scope:**
- Rich-enough text editor (at minimum structured multi-paragraph fields) for
  Privacy/Terms/Shipping/Returns content.
- Same persistence pattern.

**Expected Deliverables:**
- Working Policy Editor; policy routes reflect edits immediately.

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 24 — Media Manager *(COMPLETE)*

**Objective:** A basic asset manager admin editors can use to attach images
(logo, favicon, product images, etc.) without a real backend yet.

**Scope:**
- Upload UI storing images as data URLs / object URLs in localStorage (or
  IndexedDB if localStorage size becomes a constraint — decide and
  document), with a size-limit warning since this is pre-backend.
- Asset picker component reused by Store Settings (logo/favicon) and
  Product Manager (product images).
- Explicitly document that this is a stopgap superseded by real file
  storage once Phase 25 (Backend Integration) lands.

**Expected Deliverables:**
- Working upload + picker, usable from at least Store Settings and Product
  Manager.

**Completion Criteria:**
- Build/lint/tests pass; storage-size guard has a test.

---

### Phase 25 — Backend Integration *(COMPLETE)*

**Objective:** Introduce a real backend API layer and an adapter pattern so
every localStorage-backed feature can be migrated to it feature-by-feature
in the phases that follow, without a big-bang rewrite.

**Scope:**
- Choose and document the backend approach (e.g., a small Node/Express or
  serverless API, or a BaaS) — this decision must be confirmed with the
  user before implementation, per project rules.
- Define API contracts (REST or similar) for auth, products, categories,
  orders, customers.
- Build a thin API client layer (`lib/api/`) with the same function
  signatures as the current `lib/auth.ts`/`lib/orders.ts`/mock fetchers, so
  swapping the implementation underneath doesn't require touching
  consuming components.
- Add environment configuration (`.env`) for the API base URL.

**Expected Deliverables:**
- Running backend (local dev instructions in README) + working API client
  layer, not yet wired into any feature's UI.

**Completion Criteria:**
- Backend runs locally per documented steps.
- API client has tests (mocked network layer).
- No existing feature's behavior changes yet — this phase is plumbing only.

---

### Phase 26 — Authentication (Backend-Integrated) *(COMPLETE)*

**Objective:** Replace mock `AuthProvider` with real backend-backed
authentication using Phase 25's API layer.

**Scope:**
- Real signup/login/logout against the backend; session via token
  (documented storage approach — httpOnly cookie preferred over
  localStorage if the backend supports it).
- Migrate existing `/account`, protected routes, and order history to the
  new auth source.
- Remove plaintext-password Known Issue once resolved.

**Expected Deliverables:**
- Fully working real authentication, indistinguishable in UX from the
  mock flow it replaces.

**Completion Criteria:**
- Existing auth-dependent tests pass (updated as needed).
- Security note in `MASTER_HANDOFF.md` updated to reflect real auth.

---

### Phase 27 — Products (Backend-Integrated) *(COMPLETE)*

**Objective:** Move the product catalog from static/localStorage data to
the real backend.

**Scope:**
- Product Manager (Phase 19) reads/writes through the API client instead
  of localStorage.
- Shop/homepage product fetching goes through the API client.
- Data migration/seed script for the existing 24-product catalog.

**Expected Deliverables:**
- Product Manager and storefront both backend-driven; localStorage catalog
  override path removed or clearly deprecated.

**Completion Criteria:**
- Build/lint/tests pass; loading/error states exercised against the real
  API client (mocked in tests).

**Outcome:**
- `hooks/useProducts.ts` (Product Manager), `Shop.tsx`, `ProductDetail.tsx`,
  and the homepage `FeaturedProducts`/`BestSellers`/`NewArrivals` sections
  all fetch through `lib/api/products.ts` (Phase 25) against the real
  backend now - no more localStorage override.
- `lib/productsStore.ts`'s `localStorage` override (`saveProductOverride`/
  `deleteProductOverride`/`resetProductsOverride`/`PRODUCTS_CHANGE_EVENT`)
  is removed outright, not just deprecated. It's replaced by pure
  derivation helpers (`deriveFeaturedProducts`/`deriveBestSellers`/
  `deriveNewArrivals`) plus a small in-memory (non-persistent) cache used
  only by two remaining out-of-scope synchronous consumers - see Known
  Issues below.
- Product Manager's "Reset to defaults" button is gone - there's no
  static default to reset to once the catalog lives in the database.
  Save/delete are real network requests with their own error handling
  (an inline error banner in the modal on failure, list keeps its
  previous state rather than clearing).
- Added admin-only RLS write policies (insert/update/delete gated on
  `profiles.role = 'admin'`) to `supabase/schema.sql`'s `products` table,
  closing the Phase 25 placeholder that left writes ungated.
- Added `supabase/seed_products.sql`, generated directly from
  `data/products.ts`'s `ALL_PRODUCTS` so the two can't drift, to seed a
  fresh Supabase project with the existing 24-product catalog.
- `src/test/fakeSupabaseAuth.ts` (the global in-memory backend fake every
  test gets via `src/test/setup.ts`) now also serves a `products` table,
  seeded from `ALL_PRODUCTS`.

**Known Issues carried forward:**
- `lib/adminStats.ts`'s dashboard product count and
  `lib/categoriesStore.ts`'s `countProductsInCategory()` (the Category
  Manager delete-guard) still read synchronously, since Category Manager
  itself isn't backend-integrated yet. They read `productsStore.ts`'s
  deprecated in-memory cache rather than a live query - accurate once any
  page has fetched the real catalog this session, but seeded with the
  static placeholder catalog as a bootstrap default before that. A future
  phase migrating Category Manager onto the backend should convert both
  to real async calls instead.

---

### Phase 28 — Orders (Backend-Integrated)

**Objective:** Real order persistence, replacing the simulated checkout
submission.

**Scope:**
- Checkout writes a real order via the API.
- Order Confirmation and Account order history read from the backend.

**Expected Deliverables:**
- End-to-end real order flow (still no live payment processing — that's
  Phase 31).

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 29 — Inventory

**Objective:** Real stock tracking per product, replacing the hardcoded
`MAX_QTY` constant.

**Scope:**
- Stock field on `Product` (backend-sourced).
- Cart respects real stock; stock decrements on order placement; low/out-
  of-stock UI states.
- Admin surface (extends Product Manager) to adjust stock levels.

**Expected Deliverables:**
- Working inventory tracking from catalog through checkout.

**Completion Criteria:**
- Build/lint/tests pass; tests cover stock-exhausted edge cases.

---

### Phase 30 — Customers

**Objective:** Admin-facing customer management, distinct from the
account-holder's own `/account` self-service view.

**Scope:**
- Admin list/detail view of registered customers and their order history.
- Basic search/filter.

**Expected Deliverables:**
- Working Customers admin section.

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 31 — Payments

**Objective:** Real payment processing at checkout, replacing the
simulated "place order" submission.

**Scope:**
- Integrate a payment provider (e.g., Stripe) — confirm provider choice
  with the user before implementation.
- Checkout collects and processes real payment; order is only created on
  successful payment.
- Test-mode credentials only; document clearly this must be switched to
  live keys for production use.

**Expected Deliverables:**
- Working real payment flow in test mode.

**Completion Criteria:**
- Build/lint/tests pass (payment provider mocked in tests).
- Security note added: no card data touches the app's own servers directly
  if using a tokenizing provider.

---

### Phase 32 — Shipping

**Objective:** Configurable shipping methods/rates applied at checkout.

**Scope:**
- Admin config for shipping zones/methods/rates (flat rate at minimum).
- Checkout shows and applies shipping cost to order totals.

**Expected Deliverables:**
- Working shipping selection integrated into checkout totals.

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 33 — Notifications

**Objective:** Transactional notifications for key events (order placed,
account created, etc.).

**Scope:**
- Choose and document approach (transactional email provider vs. in-app
  notification center) — confirm with the user before implementation.
- Order-confirmation notification at minimum.

**Expected Deliverables:**
- Working notification on order placement.

**Completion Criteria:**
- Build/lint/tests pass (notification provider mocked in tests).

---

### Phase 34 — Analytics

**Objective:** Basic store analytics for the admin dashboard.

**Scope:**
- Sales/order volume over time, top products, using real backend order
  data from Phase 28.
- Extend the Admin Foundation dashboard (Phase 15) with real charts.

**Expected Deliverables:**
- Working analytics view in admin.

**Completion Criteria:**
- Build/lint/tests pass.

---

### Phase 35 — SEO

**Objective:** Technical SEO pass beyond Phase 13's meta-sync fix.

**Scope:**
- `sitemap.xml` and `robots.txt` generation.
- Structured data (JSON-LD) for products/organization.
- Canonical tags; verify Open Graph/Twitter card coverage on every route.

**Expected Deliverables:**
- Working sitemap/robots/structured data, verifiable in a build.

**Completion Criteria:**
- Build/lint/tests pass; a documented manual check (e.g., a structured-data
  validator) confirms output validity.

---

### Phase 36 — Performance

**Objective:** Performance pass now that the app has grown substantially.

**Scope:**
- Route-based code-splitting (especially the now-large admin section).
- Image optimization/lazy-loading audit.
- Bundle-size analysis and a documented budget going forward.

**Expected Deliverables:**
- Measurable bundle-size reduction; documented before/after numbers.

**Completion Criteria:**
- Build/lint/tests pass; Performance Notes in `MASTER_HANDOFF.md` updated
  with new numbers.

---

### Phase 37 — Commercial Release Preparation

**Objective:** Prepare the template for sale/distribution as a commercial
product.

**Scope:**
- Licensing file and terms.
- A "reset to demo data" script/flow for buyers.
- Deployment guide covering environment variables introduced since Phase
  25 (backend URL, payment keys, etc.).
- Final cross-phase QA pass (build, lint, full test suite, manual smoke
  test checklist).

**Expected Deliverables:**
- A release-ready package a buyer could deploy from scratch using only the
  documentation produced in Phase 38.

**Completion Criteria:**
- Full test suite passes; build is clean; QA checklist in
  `MASTER_HANDOFF.md` fully checked off or each remaining item explicitly
  justified.

---

### Phase 38 — Documentation

**Objective:** End-user-facing documentation, as distinct from the
developer-facing `MASTER_HANDOFF.md`/`ROADMAP.md`/`CHANGELOG.md` chain.

**Scope:**
- Setup guide (install, configure environment, first run).
- Admin user guide covering every editor built in Phases 15–24.
- Final polish pass on `README.md` for a buyer/end-user audience.

**Expected Deliverables:**
- Complete, publishable documentation set.

**Completion Criteria:**
- Every admin feature has at least one corresponding doc section.

---

## Future Development Rules

*(Permanent — applies to every session from this point forward.)*

Claude must always, at the start of every development session on this
project:

1. Read `MASTER_HANDOFF.md`.
2. Read `ROADMAP.md` (this file).
3. Read `CHANGELOG.md`.
4. Determine the next unfinished phase from the **Status** section above.
5. Complete **only that one phase** (or, if it's too large, only its first
   unfinished sub-phase — see below).
6. Never automatically begin another phase after finishing one.
7. Never skip phases.
8. Never rebuild or redesign already-completed work outside the current
   phase's stated scope.
9. Verify the project builds successfully (`tsc -b && vite build`) and that
   lint (`oxlint`) and tests (`vitest run`) pass before considering the
   phase done.
10. Update `MASTER_HANDOFF.md`, `CHANGELOG.md`, and this file's **Status**
    section at the end of the phase.
11. Stop and wait for explicit approval before starting the next phase.

**If the next phase is too large once work begins:** split it into
smaller, self-contained sub-phases (e.g., 25A, 25B), update this file with
the new sub-phase breakdown in place of the original entry, and complete
only the first unfinished sub-phase this session.

**Scope discipline:** if a phase's brief says a decision needs user
confirmation before implementation (several backend-era phases do, since
they involve choosing external providers), stop and ask before writing
code for that phase.
