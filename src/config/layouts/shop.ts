/**
 * `/shop` page settings (Phase 11).
 *
 * Shop is a single stateful view (search + filter + sort all wired into
 * URL query params), not a stack of independent content sections like
 * Home/About/Contact - decomposing it into reorderable sections would
 * mean redesigning its interactive layout, which is explicitly out of
 * scope for this phase. Instead it gets page-level *settings*: display
 * toggles and defaults a store owner can flip without editing
 * `pages/Shop.tsx`. This is intentionally a different shape from
 * `PageLayout` (see `types/layout.ts`) for that reason.
 */
export interface ShopPageSettings {
  /** Show the search input above the product grid. */
  showSearch: boolean;
  /** Show the category filter pills. */
  showCategoryFilter: boolean;
  /** Show the sort dropdown. */
  showSort: boolean;
  /** Sort applied on first load, before the shopper changes anything (still a key of `SORT_LABELS` in `lib/productFilters.ts`). */
  defaultSort: "featured" | "best-selling" | "newest" | "price-asc" | "price-desc";
  /** Product grid columns at the `lg` breakpoint (2 columns below `sm` either way). */
  desktopColumns: 3 | 4 | 5;
}

export const SHOP_SETTINGS: ShopPageSettings = {
  showSearch: true,
  showCategoryFilter: true,
  showSort: true,
  defaultSort: "featured",
  desktopColumns: 4,
};
