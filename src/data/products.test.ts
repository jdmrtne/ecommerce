import { describe, expect, it } from "vitest";
import { ALL_PRODUCTS, NEW_ARRIVALS } from "@/data/products";

describe("NEW_ARRIVALS", () => {
  it("is non-empty and no larger than the full catalog", () => {
    expect(NEW_ARRIVALS.length).toBeGreaterThan(0);
    expect(NEW_ARRIVALS.length).toBeLessThanOrEqual(ALL_PRODUCTS.length);
  });

  it("caps at 8 products", () => {
    expect(NEW_ARRIVALS.length).toBeLessThanOrEqual(8);
  });

  it("is sorted by createdAt, most recent first", () => {
    for (let i = 1; i < NEW_ARRIVALS.length; i++) {
      expect(NEW_ARRIVALS[i - 1].createdAt >= NEW_ARRIVALS[i].createdAt).toBe(true);
    }
  });

  it("only contains products that exist in the full catalog", () => {
    const ids = new Set(ALL_PRODUCTS.map((p) => p.id));
    for (const product of NEW_ARRIVALS) {
      expect(ids.has(product.id)).toBe(true);
    }
  });

  it("matches the actual newest product by createdAt", () => {
    const newest = [...ALL_PRODUCTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    expect(NEW_ARRIVALS[0].id).toBe(newest.id);
  });
});
