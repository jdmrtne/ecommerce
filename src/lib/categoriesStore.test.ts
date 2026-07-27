import { beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "@/data/categories";
import { ALL_PRODUCTS } from "@/data/products";
import { getCachedProducts, setProductsCache } from "@/lib/productsStore";
import {
  CATEGORIES_CHANGE_EVENT,
  countProductsInCategory,
  deleteCategoryOverride,
  generateCategoryId,
  getCategoriesOverride,
  resetCategoriesOverride,
  resolveAllCategories,
  resolveCategoryById,
  saveCategoryOverride,
} from "@/lib/categoriesStore";
import type { Category } from "@/types/product";

const SAMPLE_ID = CATEGORIES[0].id;

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-test",
    slug: "category-test",
    label: "Test Category",
    description: "A test category.",
    icon: "Package",
    tone: "primary",
    itemCount: 0,
    ...overrides,
  };
}

describe("categoriesStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to the static category list when nothing has been saved", () => {
    expect(getCategoriesOverride()).toEqual({ entries: {} });
    expect(resolveAllCategories()).toEqual(CATEGORIES);
  });

  it("creates a new category not present in the static list", () => {
    const category = makeCategory();
    saveCategoryOverride(category);

    const resolved = resolveAllCategories();
    expect(resolved).toHaveLength(CATEGORIES.length + 1);
    expect(resolved.find((c) => c.id === category.id)).toEqual(category);
  });

  it("edits an existing static category without duplicating it", () => {
    const edited = { ...CATEGORIES[0], label: "Renamed Category" };
    saveCategoryOverride(edited);

    const resolved = resolveAllCategories();
    expect(resolved).toHaveLength(CATEGORIES.length);
    expect(resolveCategoryById(SAMPLE_ID)).toEqual(edited);
  });

  it("deletes a static category so it no longer resolves", () => {
    deleteCategoryOverride(SAMPLE_ID);

    const resolved = resolveAllCategories();
    expect(resolved).toHaveLength(CATEGORIES.length - 1);
    expect(resolveCategoryById(SAMPLE_ID)).toBeUndefined();
  });

  it("deletes an admin-created category", () => {
    const category = makeCategory();
    saveCategoryOverride(category);
    deleteCategoryOverride(category.id);

    expect(resolveCategoryById(category.id)).toBeUndefined();
    expect(resolveAllCategories()).toHaveLength(CATEGORIES.length);
  });

  it("resets cleanly back to the static category list", () => {
    saveCategoryOverride(makeCategory());
    deleteCategoryOverride(SAMPLE_ID);
    resetCategoriesOverride();

    expect(getCategoriesOverride()).toEqual({ entries: {} });
    expect(resolveAllCategories()).toEqual(CATEGORIES);
  });

  it("dispatches the change event on save, delete, and reset", () => {
    const handler = vi.fn();
    window.addEventListener(CATEGORIES_CHANGE_EVENT, handler);

    saveCategoryOverride(makeCategory());
    expect(handler).toHaveBeenCalledTimes(1);

    deleteCategoryOverride(SAMPLE_ID);
    expect(handler).toHaveBeenCalledTimes(2);

    resetCategoriesOverride();
    expect(handler).toHaveBeenCalledTimes(3);

    window.removeEventListener(CATEGORIES_CHANGE_EVENT, handler);
  });

  it("ignores corrupted localStorage content instead of throwing", () => {
    window.localStorage.setItem("store-categories", "not json");
    expect(getCategoriesOverride()).toEqual({ entries: {} });

    window.localStorage.setItem("store-categories", JSON.stringify(["array", "not", "object"]));
    expect(getCategoriesOverride()).toEqual({ entries: {} });
  });

  it("counts products currently assigned to a category via the deprecated products cache", () => {
    const targetCategory = SAMPLE_ID;
    const before = countProductsInCategory(targetCategory);
    expect(before).toBe(ALL_PRODUCTS.filter((p) => p.category === targetCategory).length);

    const newProduct = {
      id: "p-category-count-test",
      name: "Category Count Test",
      category: targetCategory,
      price: 100,
      rating: 4,
      createdAt: "2026-01-01",
      description: "test",
    };
    setProductsCache([...getCachedProducts(), newProduct]);
    expect(countProductsInCategory(targetCategory)).toBe(before + 1);

    setProductsCache(getCachedProducts().filter((p) => p.id !== newProduct.id));
    expect(countProductsInCategory(targetCategory)).toBe(before);
  });
});

describe("generateCategoryId", () => {
  it("slugifies the category label", () => {
    expect(generateCategoryId("Home Decor", [])).toBe("home-decor");
  });

  it("appends a numeric suffix on collision", () => {
    expect(generateCategoryId("Home Decor", ["home-decor"])).toBe("home-decor-2");
    expect(generateCategoryId("Home Decor", ["home-decor", "home-decor-2"])).toBe("home-decor-3");
  });

  it("falls back to a generic slug for a label with no alphanumeric characters", () => {
    expect(generateCategoryId("!!!", [])).toBe("category");
  });
});
