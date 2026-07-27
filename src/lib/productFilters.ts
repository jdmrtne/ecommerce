import type { Category, CraftCategory, Product, SortOption } from "@/types/product";

export interface ProductFilters {
  category?: CraftCategory | "all";
  query?: string;
  sort?: SortOption;
}

/**
 * Filters + sorts a product list for the Shop grid. Pure function so it's
 * easy to unit test and reuse (e.g. for a future search page) without
 * pulling in routing or component state.
 */
export function filterAndSortProducts(
  products: Product[],
  { category = "all", query = "", sort = "featured" }: ProductFilters,
): Product[] {
  let result = products;

  if (category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmedQuery) ||
        p.category.toLowerCase().includes(trimmedQuery),
    );
  }

  const sorted = [...result];
  switch (sort) {
    case "best-selling":
      sorted.sort((a, b) => (a.salesRank ?? Infinity) - (b.salesRank ?? Infinity));
      break;
    case "newest":
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "featured":
    default:
      // Keep curated catalog order.
      break;
  }

  return sorted;
}

export const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  "best-selling": "Best selling",
  newest: "Newest",
  "price-asc": "Price: Low to high",
  "price-desc": "Price: High to low",
};

/**
 * Short label per category, for the pill-style filter row. Built from
 * whatever category list is passed in (the live, override-aware
 * `resolveAllCategories()` result as of Phase 20 - see
 * `components/shop/CategoryFilter.tsx`) instead of a hardcoded
 * per-business Record or a module-load-frozen constant, so it
 * automatically follows whatever categories a white-labeled store
 * defines *and* reflects a Category Manager edit without a reload.
 * Falls back to the category's full `label` if no shorter form exists.
 */
export function getCategoryFilterLabels(categories: Category[]): Record<CraftCategory | "all", string> {
  return {
    all: "All",
    ...Object.fromEntries(categories.map((c) => [c.id, c.label.split(" ")[0]])),
  };
}
