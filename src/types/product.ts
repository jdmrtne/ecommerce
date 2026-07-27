/**
 * Category id is a plain string (a slug into `src/data/categories.ts`)
 * rather than a hardcoded union of literal category names, so this type
 * works unchanged for any business's category set. `CraftCategory` is
 * kept as a name (rather than renaming every import site to
 * `CategoryId`) for backwards compatibility with existing imports across
 * the app.
 */
export type CraftCategory = string;

export interface ProductVariant {
  /** e.g. "Color", "Size". */
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  category: CraftCategory;
  price: number;
  rating: number;
  tag?: "New" | "Limited";
  /** ISO date string - drives the "Newest" sort in Shop. */
  createdAt: string;
  /** Lower = better seller. Optional - only set for items that actually rank. Drives "Best selling" sort and the homepage BEST_SELLERS list. */
  salesRank?: number;
  /** Shown as the main copy on the product detail page (Phase 4). */
  description: string;
  /** Short spec bullets (materials, dimensions, care) shown on the product detail page. */
  details?: string[];
  /**
   * Product photos. Optional - when omitted, ProductCard/ProductDetail
   * fall back to the illustrated CraftIcon placeholder, so a white-label
   * store can go live before real product photography exists and swap
   * in images later without any component changes.
   */
  images?: string[];
  /** Purchasable options (color/size/etc). Architecture only - not yet wired into cart/checkout (see Phase 8 handoff, Remaining Tasks). */
  variants?: ProductVariant[];
  /** Units available. Architecture only - not yet wired into cart/checkout stock checks. */
  stock?: number;
  /** Free-form tags for search/merchandising, distinct from the single display `tag` badge above. */
  tags?: string[];
}

/**
 * Derived, read-only flags computed from a product's raw data
 * (`tag`/`salesRank`) rather than authored by hand on every product -
 * see `deriveProductFlags` in `src/data/products.ts`. Exposed as real
 * fields (not just filter logic) so any future admin panel/CMS has a
 * single boolean per product to toggle, matching the "Featured / Best
 * Seller / New Arrival" fields requested for the white-label catalog.
 */
export interface ProductFlags {
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
}

export type SortOption = "featured" | "best-selling" | "newest" | "price-asc" | "price-desc";

export interface Category {
  id: CraftCategory;
  /** URL-safe identifier, e.g. for /shop?category=<slug>. Currently equal to `id`. */
  slug: string;
  label: string;
  description: string;
  /** Optional category image; falls back to the illustrated CraftIcon when omitted. */
  image?: string;
  /** Name of a lucide-react icon, resolved via the icon registry in CraftIcon.tsx. */
  icon: string;
  /** Accent tone used for the icon tint - kept generic (not tied to a specific hex) so it follows the active theme. */
  tone: "primary" | "accent";
  featured?: boolean;
  itemCount: number;
}
