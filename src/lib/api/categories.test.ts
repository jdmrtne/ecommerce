import { describe, expect, it } from "vitest";
import { apiDeleteCategory, apiGetCategories, apiGetCategoryById, apiSaveCategory } from "@/lib/api/categories";
import { chainableResult, createMockSupabaseClient } from "@/test/mockSupabaseClient";
import type { CategoryRow } from "@/lib/api/types";
import type { Category } from "@/types/product";

const ROW: CategoryRow = {
  id: "category-a",
  slug: "category-a",
  label: "Category A",
  description: "Short description",
  image: null,
  icon: "Gem",
  tone: "accent",
  featured: true,
  item_count: 6,
};

const CATEGORY: Category = {
  id: "category-a",
  slug: "category-a",
  label: "Category A",
  description: "Short description",
  icon: "Gem",
  tone: "accent",
  featured: true,
  itemCount: 6,
};

describe("lib/api/categories", () => {
  it("apiGetCategories maps every row, ordered by label", async () => {
    const chain = chainableResult({ data: [ROW], error: null });
    const client = createMockSupabaseClient(chain);

    const categories = await apiGetCategories(client);

    expect(client.from).toHaveBeenCalledWith("categories");
    expect(chain.order).toHaveBeenCalledWith("label", { ascending: true });
    expect(categories).toEqual([CATEGORY]);
  });

  it("apiGetCategoryById returns the mapped category when found, undefined otherwise", async () => {
    const found = await apiGetCategoryById("category-a", createMockSupabaseClient(chainableResult({ data: ROW, error: null })));
    expect(found).toEqual(CATEGORY);

    const missing = await apiGetCategoryById("nope", createMockSupabaseClient(chainableResult({ data: null, error: null })));
    expect(missing).toBeUndefined();
  });

  it("apiSaveCategory upserts the mapped row and returns the saved category", async () => {
    const chain = chainableResult({ data: ROW, error: null });
    const client = createMockSupabaseClient(chain);

    const saved = await apiSaveCategory(CATEGORY, client);

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "category-a", item_count: 6 }));
    expect(saved).toEqual(CATEGORY);
  });

  it("apiDeleteCategory deletes by id and throws on error", async () => {
    const okChain = chainableResult({ data: null, error: null });
    await apiDeleteCategory("category-a", createMockSupabaseClient(okChain));
    expect(okChain.eq).toHaveBeenCalledWith("id", "category-a");

    const failClient = createMockSupabaseClient(chainableResult({ data: null, error: { message: "in use" } }));
    await expect(apiDeleteCategory("category-a", failClient)).rejects.toThrow("in use");
  });
});
