import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ALL_PRODUCTS } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import type { Product } from "@/types/product";

const NEW_PRODUCT: Product = {
  id: "p-hook-test",
  name: "Hook Test Product",
  category: ALL_PRODUCTS[0].category,
  price: 100,
  rating: 4,
  createdAt: "2026-01-01",
  description: "Created via the hook.",
};

describe("useProducts", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("starts loading, then resolves to the full catalog from the backend", async () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.products).toHaveLength(ALL_PRODUCTS.length);
  });

  it("re-fetches and includes the new product immediately after save()", async () => {
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      await result.current.save(NEW_PRODUCT);
    });

    expect(result.current.products.find((p) => p.id === NEW_PRODUCT.id)).toEqual(NEW_PRODUCT);
  });

  it("re-fetches without the product immediately after remove()", async () => {
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      await result.current.save(NEW_PRODUCT);
    });
    await act(async () => {
      await result.current.remove(NEW_PRODUCT.id);
    });

    expect(result.current.products.find((p) => p.id === NEW_PRODUCT.id)).toBeUndefined();
  });
});
