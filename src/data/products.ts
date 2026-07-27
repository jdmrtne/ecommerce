import type { Product, ProductFlags } from "@/types/product";

/**
 * Categories now live in `src/data/categories.ts` (Phase 8, Part 5 - kept
 * as a separate file so category and product data can be edited/replaced
 * independently). Re-exported here so existing `import { CATEGORIES }
 * from "@/data/products"` call sites keep working without changes.
 */
export { CATEGORIES } from "@/data/categories";

/**
 * Full mock catalog - single source of truth for every product shown
 * anywhere on the site. This is sample/placeholder data only: replace it
 * with your own products (any category labels work, since `category` is
 * a plain string - see src/data/categories.ts). FEATURED_PRODUCTS and
 * BEST_SELLERS below are derived from this list rather than duplicated.
 *
 * `createdAt` and `salesRank` drive Shop's "Newest" and "Best selling"
 * sorts - `salesRank` is only set on a few sample items so that sort has
 * something to show.
 */
export const ALL_PRODUCTS: Product[] = [
  // -- category-a --------------------------------------------------------------
  {
    id: "p-a1", name: "Product 1", category: "category-a", price: 999, rating: 4.8, tag: "New", createdAt: "2026-07-10",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-a2", name: "Product 2", category: "category-a", price: 1299, rating: 4.9, createdAt: "2026-02-14", salesRank: 2,
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-a3", name: "Product 3", category: "category-a", price: 799, rating: 4.6, createdAt: "2026-03-02",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-a4", name: "Product 4", category: "category-a", price: 1499, rating: 4.7, createdAt: "2026-05-18",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-a5", name: "Product 5", category: "category-a", price: 649, rating: 4.5, createdAt: "2026-01-20",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-a6", name: "Product 6", category: "category-a", price: 899, rating: 4.4, createdAt: "2026-04-11",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },

  // -- category-b --------------------------------------------------------------
  {
    id: "p-b1", name: "Product 7", category: "category-b", price: 550, rating: 4.7, tag: "New", createdAt: "2026-07-12",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-b2", name: "Product 8", category: "category-b", price: 2200, rating: 5.0, createdAt: "2026-01-05", salesRank: 1,
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-b3", name: "Product 9", category: "category-b", price: 1900, rating: 4.8, createdAt: "2026-06-01",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-b4", name: "Product 10", category: "category-b", price: 3200, rating: 4.9, createdAt: "2026-03-22",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-b5", name: "Product 11", category: "category-b", price: 950, rating: 4.6, createdAt: "2026-02-08",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-b6", name: "Product 12", category: "category-b", price: 1550, rating: 4.7, createdAt: "2026-05-29",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },

  // -- category-c --------------------------------------------------------------
  {
    id: "p-c1", name: "Product 13", category: "category-c", price: 1750, rating: 4.8, tag: "New", createdAt: "2026-07-08",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-c2", name: "Product 14", category: "category-c", price: 1050, rating: 4.9, createdAt: "2026-01-15", salesRank: 3,
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-c3", name: "Product 15", category: "category-c", price: 1150, rating: 4.7, createdAt: "2026-04-19",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-c4", name: "Product 16", category: "category-c", price: 1100, rating: 4.6, createdAt: "2026-02-27",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-c5", name: "Product 17", category: "category-c", price: 850, rating: 4.5, createdAt: "2026-06-14",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-c6", name: "Product 18", category: "category-c", price: 990, rating: 4.4, createdAt: "2026-03-09",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },

  // -- category-d --------------------------------------------------------------
  {
    id: "p-d1", name: "Product 19", category: "category-d", price: 450, rating: 4.6, tag: "New", createdAt: "2026-07-15",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-d2", name: "Product 20", category: "category-d", price: 350, rating: 4.9, createdAt: "2026-01-30", salesRank: 4,
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-d3", name: "Product 21", category: "category-d", price: 380, rating: 4.7, createdAt: "2026-05-05",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-d4", name: "Product 22", category: "category-d", price: 600, rating: 4.5, createdAt: "2026-02-18",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-d5", name: "Product 23", category: "category-d", price: 440, rating: 4.4, createdAt: "2026-06-22",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
  {
    id: "p-d6", name: "Product 24", category: "category-d", price: 340, rating: 4.8, createdAt: "2026-04-03",
    description: "Product description goes here. Replace with your own product details.",
    details: ["Sample detail line 1", "Sample detail line 2", "Sample detail line 3", "Sample detail line 4"],
  },
];

/**
 * Derives the `featured`/`bestSeller`/`newArrival` flags requested by the
 * white-label product schema from each product's raw authored data,
 * instead of requiring every mock product to be hand-edited to add three
 * more fields. New products added going forward can still set
 * `tag`/`salesRank` as before - the flags fall out automatically - or a
 * future CMS could set them directly.
 */
export function deriveProductFlags(product: Product): ProductFlags {
  return {
    featured: product.tag === "New",
    bestSeller: typeof product.salesRank === "number",
    newArrival: product.tag === "New",
  };
}

/** Curated / newer pieces - shown in the horizontal "Featured" strip. */
export const FEATURED_PRODUCTS: Product[] = ALL_PRODUCTS.filter((p) => deriveProductFlags(p).featured);

/** Ranked by sales - shown in the "Customer favorites" grid with numbered badges. */
export const BEST_SELLERS: Product[] = ALL_PRODUCTS.filter(
  (p): p is Product & { salesRank: number } => deriveProductFlags(p).bestSeller && typeof p.salesRank === "number",
).sort((a, b) => a.salesRank - b.salesRank);

/**
 * The newest products in the catalog by `createdAt`, most recent first -
 * shown in the homepage "New Arrivals" section (Phase 13). Deliberately
 * date-driven rather than reusing `deriveProductFlags(p).newArrival`
 * (which is just `tag === "New"`, the same rule `FEATURED_PRODUCTS`
 * uses) - a chronological list stays accurate as the catalog grows
 * without every new product needing to also be manually tagged, and
 * gives this section content genuinely distinct from "Fresh arrivals".
 */
export const NEW_ARRIVALS: Product[] = [...ALL_PRODUCTS]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 8);
