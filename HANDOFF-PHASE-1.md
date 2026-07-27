# CrafteeVee — Phase 1 Handoff: Foundation

## Phase Summary

Built the complete reusable foundation the rest of the site builds on: project
scaffold, routing, design token system (colors/type/radius/shadow/motion),
global layout (navbar + footer), dark mode, and the core reusable UI kit
(Button, Card, Input, Textarea, Modal, Spinner/LoadingState, Skeleton
loaders, EmptyState/ErrorState/OfflineState, ErrorBoundary).

**Palette decision:** the spec called for a soft pastel cream/beige/brown
theme, but the actual CrafteeVee logo uses a denim blue (`#3860A8`) and a hot
pink (`#F868C0`). Per your direction, the pastel palette was built *around*
the logo's real colors — cream/beige/brown stayed as the base, and the
logo's blue and pink were softened slightly and kept as the two accent
colors, so the site reads as CrafteeVee rather than a generic pastel shop.

**Signature element:** the wavy string-of-sparkles motif from under the
logo's wordmark was extracted into a reusable `<Squiggle />` component, used
as a section divider / underline accent — this is the one recurring visual
signature, used deliberately rather than decoratively.

### Files created
```
crafteevee/
├── index.html
├── vite.config.ts
├── tsconfig.app.json          (added @/* path alias)
├── src/
│   ├── main.tsx
│   ├── App.tsx                 (router)
│   ├── index.css               (design tokens, @theme, dark mode, base styles)
│   ├── lib/cn.ts                (className merge utility)
│   ├── hooks/
│   │   ├── useTheme.ts          (dark mode toggle + persistence)
│   │   └── useOnlineStatus.ts
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── PagePlaceholder.tsx  (temp content for unbuilt-phase pages)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx       (shared shell via <Outlet />)
│   │   │   └── OfflineBanner.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx        (Input + Textarea)
│   │       ├── Modal.tsx
│   │       ├── Loading.tsx      (Spinner, LoadingState)
│   │       ├── Skeleton.tsx     (Skeleton, ProductCardSkeleton, ProductGridSkeleton)
│   │       ├── StateMessage.tsx (EmptyState, ErrorState, OfflineState)
│   │       └── Squiggle.tsx     (signature divider motif)
│   ├── pages/
│   │   ├── Home.tsx    (placeholder — real content is Phase 2)
│   │   ├── Shop.tsx    (placeholder — real content is Phase 3)
│   │   ├── About.tsx   (placeholder — real content is Phase 2)
│   │   ├── Contact.tsx (placeholder — real content is Phase 2)
│   │   └── NotFound.tsx (fully built — 404 is foundation-level)
│   └── assets/images/logo.png
└── public/favicon.png
```

### Architecture decisions
- **Tailwind v4**, config-in-CSS via `@theme` in `index.css` — no
  `tailwind.config.js`. All design tokens (`--color-*`, `--font-*`,
  `--radius-*`, `--shadow-*`) live there and auto-generate utility classes
  (`bg-denim`, `text-ink-soft`, `rounded-lg`, `shadow-soft`, etc).
- **Dark mode** is a `.dark` class on `<html>`, toggled by `useTheme()`,
  persisted to `localStorage`, defaults to OS preference on first visit.
  Dark mode re-maps the same token names to a warm dark palette rather than
  a cold gray one.
- **Path alias** `@/*` → `src/*`, configured in both `vite.config.ts` and
  `tsconfig.app.json`.
- **Routing**: React Router v7, one shared `<Layout />` (navbar + footer +
  offline banner + error boundary) wraps all pages via `<Outlet />`.
- **lucide-react v1.x dropped brand icons** (Facebook/Instagram etc. no
  longer exported) — Footer uses small inline SVGs for those instead.

### Dependencies installed
`react-router-dom`, `framer-motion`, `@tailwindcss/vite`, `tailwindcss`,
`clsx`, `tailwind-merge`, `lucide-react`, `@types/node` (dev).

### Known limitations
- Cart/wishlist icon badges in the navbar are visual placeholders (always
  show 0, no click behavior) — real state comes in Phase 5 (cart) and
  Phase 7 (wishlist/auth).
- Search icon in navbar has no behavior yet — Phase 3.
- Home/Shop/About/Contact render `<PagePlaceholder />` — confirms routing
  and layout work end-to-end without building ahead of the current phase.
- No test suite yet (Phase 14).

### Potential risks
- Google Fonts are loaded via `@import url(...)` in CSS — fine for
  development; consider self-hosting or `<link rel="preload">` in Phase 12
  (SEO/performance) to avoid render-blocking font loads.
- `framer-motion` + `lucide-react` add real bundle weight; current gzipped
  JS is ~129KB. Worth a lazy-loading/code-splitting pass once real pages
  (with images) are in.

## QA Checklist
- [ ] Navbar: all links navigate correctly, active link is visually marked
- [ ] Navbar: mobile hamburger opens/closes, closes on link click
- [ ] Dark mode toggle switches theme and persists across a page refresh
- [ ] Dark mode respects OS preference on first visit (clear localStorage to test)
- [ ] Keyboard navigation: Tab through navbar/footer, focus ring visible on every control
- [ ] Modal: opens, closes on Escape, closes on backdrop click, closes on X button, body scroll locked while open
- [ ] Buttons: hover/active/disabled/loading states all look correct in both themes
- [ ] Form inputs: label, error, and hint states render correctly
- [ ] Skeleton loaders animate (shimmer) without layout shift
- [ ] 404 page renders for an unknown route and "Back to home" works
- [ ] Resize from 375px → 1440px: no horizontal scroll, no overlap, navbar collapses to hamburger at `md` breakpoint
- [ ] `prefers-reduced-motion: reduce` disables animations (test via OS/browser setting)
- [ ] Offline banner appears when browser goes offline (DevTools → Network → Offline)

## Remaining Tasks
- Phase 2 onward — no foundation work is outstanding for what was scoped in Phase 1.

## Next Phase
**Phase 2 — Homepage.** Build inside `src/pages/Home.tsx`, replacing its
`<PagePlaceholder />`: hero section, featured products, categories, best
sellers, about-brand section, testimonials, Instagram gallery, newsletter
signup, FAQ, contact section — all responsive, using the existing Button /
Card / Squiggle / design tokens. Do not start Phase 3 (Shop) work until
Phase 2 is approved.

## Context Preservation
- **Stack**: Vite + React 19 + TypeScript + Tailwind v4 (CSS-first config) + React Router v7 + Framer Motion.
- **Tokens live in** `src/index.css` under `@theme` — always reference
  colors as Tailwind classes (`bg-denim`, `text-ink`), never hardcode hex
  values in components.
- **Palette**: cream `#fbf6ee` (bg), surface `#fffdf9` (cards), beige
  `#efe3d2` (secondary/borders), ink `#4a3628` (text), ink-soft `#8a7565`
  (secondary text), denim `#4a6fa5` (primary accent, from logo blue), bloom
  `#e8639e` (secondary accent, from logo pink). Full dark-mode remap exists
  under `.dark`.
- **Type**: display = Fraunces (serif, headings only), body = Manrope.
- **Naming convention**: PascalCase component files matching their default
  export; hooks are `useX.ts` in `src/hooks/`; one component per file.
- **Reusable utility**: `cn()` in `src/lib/cn.ts` for merging Tailwind
  classes — use it in every component that accepts `className`.
- **State management**: none yet — no cart/auth state exists. Phase 5
  (cart) and Phase 7 (auth) will need to decide on Context vs a small store
  (Zustand recommended given "no unnecessary dependencies" but cart/auth
  state is exactly the kind of cross-tree state Context alone gets clunky
  for — flag this decision for the user at the start of Phase 5).
- **Signature motif**: `<Squiggle />` in `src/components/ui/Squiggle.tsx` —
  reuse this for dividers instead of inventing a new one.
- **Known gotcha**: lucide-react v1.x has no brand icons (Facebook,
  Instagram, Twitter, etc. were removed) — write inline SVGs for those, as
  done in `Footer.tsx`.
- **Completed**: full foundation as listed above.
- **Pending**: everything from Phase 2 onward, per the original spec.
- **No known bugs** as of this handoff — production build and dev preview
  both verified clean (`npm run build` succeeds, screenshots taken in
  light/dark/mobile).
