import { describe, expect, it } from "vitest";
import { filterAndSortProducts } from "@/lib/productFilters";
import type { Product } from "@/types/product";

function product(overrides: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    category: "category-a",
    price: 100,
    rating: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "A test product.",
    ...overrides,
  };
}

const PRODUCTS: Product[] = [
  product({ id: "1", name: "Sample Product A", category: "category-a", price: 150, createdAt: "2026-01-01", salesRank: 2 }),
  product({ id: "2", name: "Sample Product B", category: "category-b", price: 300, createdAt: "2026-03-01", salesRank: 1 }),
  product({ id: "3", name: "Sample Product C", category: "category-c", price: 200, createdAt: "2026-02-01" }),
  product({ id: "4", name: "Sample Product D", category: "category-d", price: 85, createdAt: "2026-04-01" }),
];

describe("filterAndSortProducts", () => {
  it("returns every product with no filters (default 'featured' keeps catalog order)", () => {
    const result = filterAndSortProducts(PRODUCTS, {});
    expect(result.map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("filters by category", () => {
    const result = filterAndSortProducts(PRODUCTS, { category: "category-a" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("'all' category returns everything", () => {
    expect(filterAndSortProducts(PRODUCTS, { category: "all" })).toHaveLength(4);
  });

  it("matches a search query against the product name, case-insensitively", () => {
    const result = filterAndSortProducts(PRODUCTS, { query: "product b" });
    expect(result.map((p) => p.id)).toEqual(["2"]);
  });

  it("matches a search query against the category name", () => {
    const result = filterAndSortProducts(PRODUCTS, { query: "category-d" });
    expect(result.map((p) => p.id)).toEqual(["4"]);
  });

  it("trims whitespace from the query and ignores an empty query", () => {
    expect(filterAndSortProducts(PRODUCTS, { query: "   " })).toHaveLength(4);
  });

  it("combines category and query filters", () => {
    const result = filterAndSortProducts(PRODUCTS, { category: "category-a", query: "product a" });
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("sorts by price ascending", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "price-asc" });
    expect(result.map((p) => p.id)).toEqual(["4", "1", "3", "2"]);
  });

  it("sorts by price descending", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "price-desc" });
    expect(result.map((p) => p.id)).toEqual(["2", "3", "1", "4"]);
  });

  it("sorts by newest first", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "newest" });
    expect(result.map((p) => p.id)).toEqual(["4", "2", "3", "1"]);
  });

  it("sorts by best-selling, pushing items with no salesRank to the end", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "best-selling" });
    expect(result.map((p) => p.id)).toEqual(["2", "1", "3", "4"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...PRODUCTS];
    filterAndSortProducts(PRODUCTS, { sort: "price-asc" });
    expect(PRODUCTS).toEqual(copy);
  });
});
