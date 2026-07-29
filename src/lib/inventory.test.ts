import { describe, expect, it } from "vitest";
import {
  LOW_STOCK_THRESHOLD,
  MAX_CART_QTY,
  availableStock,
  checkStockForLines,
  isLowStock,
  isOutOfStock,
  isStockTracked,
  maxPurchasableQuantity,
} from "@/lib/inventory";
import type { Product } from "@/types/product";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-a",
    name: "Woven Basket",
    category: "category-a",
    price: 500,
    rating: 4.5,
    createdAt: "2026-01-01",
    description: "A nice basket.",
    ...overrides,
  };
}

describe("isStockTracked", () => {
  it("is false when stock is undefined", () => {
    expect(isStockTracked(product())).toBe(false);
  });

  it("is true when stock is a number, including 0", () => {
    expect(isStockTracked(product({ stock: 3 }))).toBe(true);
    expect(isStockTracked(product({ stock: 0 }))).toBe(true);
  });
});

describe("availableStock", () => {
  it("is Infinity for an untracked product", () => {
    expect(availableStock(product())).toBe(Infinity);
  });

  it("returns the stock value for a tracked product", () => {
    expect(availableStock(product({ stock: 4 }))).toBe(4);
  });

  it("never goes negative", () => {
    expect(availableStock(product({ stock: -2 }))).toBe(0);
  });
});

describe("isOutOfStock", () => {
  it("is false for an untracked product regardless of demand", () => {
    expect(isOutOfStock(product())).toBe(false);
  });

  it("is true only when tracked stock is exactly 0", () => {
    expect(isOutOfStock(product({ stock: 0 }))).toBe(true);
    expect(isOutOfStock(product({ stock: 1 }))).toBe(false);
  });
});

describe("isLowStock", () => {
  it("is false for an untracked product", () => {
    expect(isLowStock(product())).toBe(false);
  });

  it("is false when out of stock (0 is its own state, not 'low')", () => {
    expect(isLowStock(product({ stock: 0 }))).toBe(false);
  });

  it("is true at and under the default threshold", () => {
    expect(isLowStock(product({ stock: LOW_STOCK_THRESHOLD }))).toBe(true);
    expect(isLowStock(product({ stock: 1 }))).toBe(true);
  });

  it("is false above the threshold", () => {
    expect(isLowStock(product({ stock: LOW_STOCK_THRESHOLD + 1 }))).toBe(false);
  });

  it("respects a custom threshold", () => {
    expect(isLowStock(product({ stock: 8 }), 10)).toBe(true);
  });
});

describe("maxPurchasableQuantity", () => {
  it("caps at MAX_CART_QTY for an untracked product", () => {
    expect(maxPurchasableQuantity(product())).toBe(MAX_CART_QTY);
  });

  it("caps at the lower of stock and MAX_CART_QTY", () => {
    expect(maxPurchasableQuantity(product({ stock: 3 }))).toBe(3);
    expect(maxPurchasableQuantity(product({ stock: 50 }))).toBe(MAX_CART_QTY);
  });

  it("subtracts what's already in the cart", () => {
    expect(maxPurchasableQuantity(product({ stock: 5 }), 2)).toBe(3);
  });

  it("is 0, not negative, once the cart already holds everything available", () => {
    expect(maxPurchasableQuantity(product({ stock: 2 }), 5)).toBe(0);
  });
});

describe("checkStockForLines", () => {
  const tracked = product({ id: "tracked", stock: 2 });
  const unlimited = product({ id: "unlimited" });

  it("returns no issues when every line is within stock", () => {
    const issues = checkStockForLines([tracked, unlimited], [
      { productId: "tracked", quantity: 2 },
      { productId: "unlimited", quantity: 999 },
    ]);
    expect(issues).toEqual([]);
  });

  it("flags a line that requests more than what's available", () => {
    const issues = checkStockForLines([tracked], [{ productId: "tracked", quantity: 3 }]);
    expect(issues).toEqual([{ productId: "tracked", name: "Woven Basket", requested: 3, available: 2 }]);
  });

  it("treats a product missing from the catalog as 0 available", () => {
    const issues = checkStockForLines([], [{ productId: "gone", quantity: 1, name: "Deleted Item" }]);
    expect(issues).toEqual([{ productId: "gone", name: "Deleted Item", requested: 1, available: 0 }]);
  });
});
