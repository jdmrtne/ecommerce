import { ALL_PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";

/**
 * A curated group of products, distinct from `Category` (a taxonomy
 * field on every product) - a Collection is an editorial grouping that
 * can cut across categories (e.g. "Under 500", "Gift Ideas",
 * "Staff Picks"). Rendered by the homepage `Collections` section
 * (`components/home/Collections.tsx`, Phase 13). A real
 * `/collections/:slug` browsing page is a Phase 14 (Dynamic Pages)
 * concern - for now each card links back to `/shop`.
 */
export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Optional cover image; falls back to a product/category illustration when omitted. */
  image?: string;
  /** Explicit product ids in this collection, in display order. */
  productIds: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    id: "staff-picks",
    slug: "staff-picks",
    title: "Staff Picks",
    description: "A hand-picked spread of what the team is loving right now.",
    productIds: ["p-a1", "p-b2", "p-c1", "p-d2"],
  },
  {
    id: "gift-ideas",
    slug: "gift-ideas",
    title: "Gift Ideas",
    description: "Easy, crowd-pleasing picks for whenever you need a gift.",
    productIds: ["p-a2", "p-b1", "p-c3", "p-d1"],
  },
  {
    id: "under-400",
    slug: "under-400",
    title: "Under ₱400",
    description: "Great picks that won't stretch the budget.",
    productIds: ALL_PRODUCTS.filter((p) => p.price < 400)
      .slice(0, 8)
      .map((p) => p.id),
  },
];

/** Resolves a collection's `productIds` into full `Product` objects, skipping any id that no longer matches the catalog. */
export function getCollectionProducts(collection: Collection): Product[] {
  return collection.productIds
    .map((id) => ALL_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
