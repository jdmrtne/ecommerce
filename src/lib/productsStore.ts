import { ALL_PRODUCTS, deriveProductFlags } from "@/data/products";
import type { Product } from "@/types/product";

/**
 * Phase 27 - Products (Backend-Integrated). Prior to this phase, this
 * file owned a `localStorage` override layered over `ALL_PRODUCTS`
 * (Phase 19) - every storefront/admin consumer resolved the live catalog
 * through it. That override path is now removed: the real catalog lives
 * in the backend (`lib/api/products.ts`, wired up in Phase 25), and every
 * page that actually needs product data (`Shop.tsx`, `ProductDetail.tsx`,
 * the homepage `FeaturedProducts`/`BestSellers`/`NewArrivals` sections,
 * `pages/admin/ProductManager.tsx` via `hooks/useProducts.ts`) now calls
 * the API client directly instead of a synchronous resolver here.
 *
 * Two things still live in this file:
 *
 * 1. Pure derivation helpers (`deriveFeaturedProducts`/
 *    `deriveBestSellers`/`deriveNewArrivals`) - the same rules
 *    `data/products.ts`'s `FEATURED_PRODUCTS`/`BEST_SELLERS`/
 *    `NEW_ARRIVALS` use, just re-applicable to *any* product list rather
 *    than baked into the static seed export, so the homepage sections can
 *    re-derive their lists from whatever the API just returned.
 *
 * 2. A small in-memory (NOT `localStorage` - nothing here survives a
 *    reload) product cache, `getCachedProducts()`/`setProductsCache()`,
 *    kept only as a deprecated bootstrap fallback for the two remaining
 *    synchronous consumers this phase intentionally left alone as
 *    out-of-scope (`lib/adminStats.ts`'s dashboard product count and
 *    `lib/categoriesStore.ts`'s `countProductsInCategory()`, which the
 *    Category Manager delete-guard still calls synchronously - migrating
 *    Category Manager itself onto the backend is a future phase's job,
 *    not this one's). The cache starts seeded with the static catalog as
 *    a reasonable first guess, and is overwritten with real data the
 *    first time any page actually fetches the live catalog (Shop,
 *    Product Manager, ProductDetail, or a homepage product section) -
 *    see `MASTER_HANDOFF.md` Known Issues for the accuracy tradeoff this
 *    implies before that first fetch happens.
 */

/** Live equivalent of `data/products.ts`'s `FEATURED_PRODUCTS`, re-derived from any given product list. */
export function deriveFeaturedProducts(products: Product[]): Product[] {
  return products.filter((p) => deriveProductFlags(p).featured);
}

/** Live equivalent of `data/products.ts`'s `BEST_SELLERS`, re-derived from any given product list. */
export function deriveBestSellers(products: Product[]): Product[] {
  return products
    .filter((p): p is Product & { salesRank: number } => deriveProductFlags(p).bestSeller && typeof p.salesRank === "number")
    .sort((a, b) => a.salesRank - b.salesRank);
}

/** Live equivalent of `data/products.ts`'s `NEW_ARRIVALS`, re-derived from any given product list. */
export function deriveNewArrivals(products: Product[]): Product[] {
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
}

let productsCache: Product[] = ALL_PRODUCTS;

/**
 * @deprecated Reads the in-memory cache described above, not the live
 * backend. Only `lib/adminStats.ts` and `lib/categoriesStore.ts` should
 * call this - every other consumer should fetch through `lib/api/products.ts`
 * (directly or via `hooks/useProducts.ts`) and call `setProductsCache()`
 * with the result.
 */
export function getCachedProducts(): Product[] {
  return productsCache;
}

/** Called by any page that just fetched the live catalog, so the deprecated sync readers above stay reasonably fresh. */
export function setProductsCache(products: Product[]): void {
  productsCache = products;
}

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "product";
}

/**
 * Builds a unique product id from a name (e.g. "Woven Basket" -> "p-woven-basket"),
 * appending "-2", "-3", etc. if that id is already taken.
 */
export function generateProductId(name: string, existingIds: Iterable<string>): string {
  const idSet = new Set(existingIds);
  const base = `p-${slugify(name)}`;
  if (!idSet.has(base)) return base;
  let suffix = 2;
  while (idSet.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
