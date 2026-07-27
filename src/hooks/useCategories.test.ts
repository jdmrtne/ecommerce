import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CATEGORIES } from "@/data/categories";
import { useCategories } from "@/hooks/useCategories";
import type { Category } from "@/types/product";

const NEW_CATEGORY: Category = {
  id: "category-hook-test",
  slug: "category-hook-test",
  label: "Hook Test Category",
  description: "Created via the hook.",
  icon: "Package",
  tone: "primary",
  itemCount: 0,
};

describe("useCategories", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to the static category list with isOverridden false", () => {
    const { result } = renderHook(() => useCategories());
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new category immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.save(NEW_CATEGORY);
    });

    expect(result.current.categories.find((c) => c.id === NEW_CATEGORY.id)).toEqual(NEW_CATEGORY);
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders without the category immediately after remove()", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.save(NEW_CATEGORY);
    });
    act(() => {
      result.current.remove(NEW_CATEGORY.id);
    });

    expect(result.current.categories.find((c) => c.id === NEW_CATEGORY.id)).toBeUndefined();
  });

  it("re-renders back to the default category list immediately after reset()", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.save(NEW_CATEGORY);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.categories).toEqual(CATEGORIES);
    expect(result.current.isOverridden).toBe(false);
  });

  it("exposes countProductsInCategory for the delete guard", () => {
    const { result } = renderHook(() => useCategories());
    expect(result.current.countProductsInCategory(NEW_CATEGORY.id)).toBe(0);
  });
});
