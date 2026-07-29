import { describe, expect, it } from "vitest";
import { validateProduct } from "@/lib/productValidation";

const VALID = {
  name: "Woven Basket",
  category: "category-a",
  price: 500,
  rating: 4.5,
  description: "A nice basket.",
};

describe("validateProduct", () => {
  it("returns no errors for valid values", () => {
    expect(validateProduct(VALID)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateProduct({ ...VALID, name: "  " }).name).toBeDefined();
  });

  it("requires a category", () => {
    expect(validateProduct({ ...VALID, category: "" }).category).toBeDefined();
  });

  it("requires a price greater than 0", () => {
    expect(validateProduct({ ...VALID, price: 0 }).price).toBeDefined();
    expect(validateProduct({ ...VALID, price: -5 }).price).toBeDefined();
    expect(validateProduct({ ...VALID, price: NaN }).price).toBeDefined();
  });

  it("requires a rating between 0 and 5", () => {
    expect(validateProduct({ ...VALID, rating: -1 }).rating).toBeDefined();
    expect(validateProduct({ ...VALID, rating: 5.1 }).rating).toBeDefined();
    expect(validateProduct({ ...VALID, rating: NaN }).rating).toBeDefined();
    expect(validateProduct({ ...VALID, rating: 0 }).rating).toBeUndefined();
    expect(validateProduct({ ...VALID, rating: 5 }).rating).toBeUndefined();
  });

  it("requires a description", () => {
    expect(validateProduct({ ...VALID, description: "  " }).description).toBeDefined();
  });

  it("allows stock to be omitted (untracked/unlimited)", () => {
    expect(validateProduct(VALID).stock).toBeUndefined();
  });

  it("requires stock, when provided, to be a non-negative whole number", () => {
    expect(validateProduct({ ...VALID, stock: -1 }).stock).toBeDefined();
    expect(validateProduct({ ...VALID, stock: 1.5 }).stock).toBeDefined();
    expect(validateProduct({ ...VALID, stock: NaN }).stock).toBeDefined();
    expect(validateProduct({ ...VALID, stock: 0 }).stock).toBeUndefined();
    expect(validateProduct({ ...VALID, stock: 12 }).stock).toBeUndefined();
  });
});
