import type { DynamicPageDefinition } from "@/config/layouts/pages/types";
import { FAQ_PAGE } from "@/config/layouts/pages/faq";

/**
 * Registry of every dynamic page (Phase 14), keyed by `slug`. This is the
 * one place a new standalone page needs registering - `pages/
 * DynamicPage.tsx` looks a page up here by slug and renders it through
 * `SECTION_REGISTRY`, so a new page never needs a new page component.
 *
 * A new page still needs one `<Route>` entry in `App.tsx` (its route path
 * is site-specific and isn't assumed to follow any single pattern - see
 * `docs/ROADMAP.md` Phase 14), but nothing else.
 */
export const DYNAMIC_PAGES: Record<string, DynamicPageDefinition> = {
  [FAQ_PAGE.slug]: FAQ_PAGE,
};
