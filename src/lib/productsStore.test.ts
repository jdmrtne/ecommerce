import { describe, expect, it } from "vitest";
import { ALL_PRODUCTS } from "@/data/products";
import {
  deriveBestSellers,
  deriveFeaturedProducts,
  deriveNewArrivals,
  generateProductId,
  getCachedProducts,
  setProductsCache,
} from "@/lib/productsStore";

describe("deriveFeaturedProducts / deriveBestSellers / deriveNewArrivals", () => {
  it("matches the static FEATURED_PRODUCTS/BEST_SELLERS/NEW_ARRIVALS derivation for the seed catalog", () => {
    expect(deriveFeaturedProducts(ALL_PRODUCTS).every((p) => p.tag === "New")).toBe(true);
    expect(deriveBestSellers(ALL_PRODUCTS).every((p) => typeof p.salesRank === "number")).toBe(true);
    expect(deriveNewArrivals(ALL_PRODUCTS).length).toBeLessThanOrEqual(8);
  });

  it("re-derives from any given product list, not just the static catalog", () => {
    const target = ALL_PRODUCTS.find((p) => p.tag !== "New")!;
    const withEdit = ALL_PRODUCTS.map((p) => (p.id === target.id ? { ...p, tag: "New" as const } : p));

    expect(deriveFeaturedProducts(withEdit).some((p) => p.id === target.id)).toBe(true);
    expect(deriveFeaturedProducts(ALL_PRODUCTS).some((p) => p.id === target.id)).toBe(false);
  });

  it("sorts best sellers by ascending salesRank", () => {
    const bestSellers = deriveBestSellers(ALL_PRODUCTS);
    for (let i = 1; i < bestSellers.length; i++) {
      expect(bestSellers[i - 1].salesRank!).toBeLessThanOrEqual(bestSellers[i].salesRank!);
    }
  });

  it("sorts new arrivals by createdAt, most recent first", () => {
    const newArrivals = deriveNewArrivals(ALL_PRODUCTS);
    for (let i = 1; i < newArrivals.length; i++) {
      expect(newArrivals[i - 1].createdAt >= newArrivals[i].createdAt).toBe(true);
    }
  });
});

describe("getCachedProducts / setProductsCache", () => {
  it("starts seeded with the static catalog as a bootstrap default", () => {
    expect(getCachedProducts()).toEqual(ALL_PRODUCTS);
  });

  it("reflects whatever a page last fetched from the real API", () => {
    const fetched = ALL_PRODUCTS.slice(0, 3);
    setProductsCache(fetched);
    expect(getCachedProducts()).toEqual(fetched);
  });
});

describe("generateProductId", () => {
  it("slugifies the product name", () => {
    expect(generateProductId("Woven Basket", [])).toBe("p-woven-basket");
  });

  it("appends a numeric suffix on collision", () => {
    expect(generateProductId("Woven Basket", ["p-woven-basket"])).toBe("p-woven-basket-2");
    expect(generateProductId("Woven Basket", ["p-woven-basket", "p-woven-basket-2"])).toBe("p-woven-basket-3");
  });

  it("falls back to a generic slug for a name with no alphanumeric characters", () => {
    expect(generateProductId("!!!", [])).toBe("p-product");
  });
});
