import { describe, expect, it } from "vitest";
import { apiDeleteProduct, apiGetProductById, apiGetProducts, apiSaveProduct } from "@/lib/api/products";
import { chainableResult, createMockSupabaseClient } from "@/test/mockSupabaseClient";
import type { ProductRow } from "@/lib/api/types";
import type { Product } from "@/types/product";

const ROW: ProductRow = {
  id: "prod-1",
  name: "Woven Basket",
  category: "category-a",
  price: 450,
  rating: 4.5,
  tag: "New",
  created_at: "2026-01-01T00:00:00.000Z",
  sales_rank: 1,
  description: "A basket.",
  details: ["Handwoven"],
  images: ["https://example.com/basket.png"],
  variants: null,
  stock: 10,
  tags: ["gift"],
};

const PRODUCT: Product = {
  id: "prod-1",
  name: "Woven Basket",
  category: "category-a",
  price: 450,
  rating: 4.5,
  tag: "New",
  createdAt: "2026-01-01T00:00:00.000Z",
  salesRank: 1,
  description: "A basket.",
  details: ["Handwoven"],
  images: ["https://example.com/basket.png"],
  stock: 10,
  tags: ["gift"],
};

describe("lib/api/products", () => {
  it("apiGetProducts maps every row and orders by created_at desc", async () => {
    const chain = chainableResult({ data: [ROW], error: null });
    const client = createMockSupabaseClient(chain);

    const products = await apiGetProducts(client);

    expect(client.from).toHaveBeenCalledWith("products");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(products).toEqual([PRODUCT]);
  });

  it("apiGetProducts returns an empty array when there are no rows", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    expect(await apiGetProducts(client)).toEqual([]);
  });

  it("apiGetProducts throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "network down" } }));
    await expect(apiGetProducts(client)).rejects.toThrow("network down");
  });

  it("apiGetProductById returns the mapped product when found", async () => {
    const chain = chainableResult({ data: ROW, error: null });
    const client = createMockSupabaseClient(chain);

    const product = await apiGetProductById("prod-1", client);

    expect(chain.eq).toHaveBeenCalledWith("id", "prod-1");
    expect(product).toEqual(PRODUCT);
  });

  it("apiGetProductById returns undefined when not found", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    expect(await apiGetProductById("missing", client)).toBeUndefined();
  });

  it("apiSaveProduct upserts the mapped row and returns the saved product", async () => {
    const chain = chainableResult({ data: ROW, error: null });
    const client = createMockSupabaseClient(chain);

    const saved = await apiSaveProduct(PRODUCT, client);

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "prod-1", sales_rank: 1 }));
    expect(saved).toEqual(PRODUCT);
  });

  it("apiDeleteProduct deletes by id and throws on error", async () => {
    const okChain = chainableResult({ data: null, error: null });
    const okClient = createMockSupabaseClient(okChain);
    await apiDeleteProduct("prod-1", okClient);
    expect(okChain.eq).toHaveBeenCalledWith("id", "prod-1");

    const failClient = createMockSupabaseClient(chainableResult({ data: null, error: { message: "not allowed" } }));
    await expect(apiDeleteProduct("prod-1", failClient)).rejects.toThrow("not allowed");
  });
});
