import { useCallback, useEffect, useState } from "react";
import { apiDeleteProduct, apiGetProducts, apiSaveProduct } from "@/lib/api/products";
import { setProductsCache } from "@/lib/productsStore";
import type { Product } from "@/types/product";

export type ProductsStatus = "loading" | "success" | "error";

/**
 * Phase 27 - Products (Backend-Integrated). Replaces the Phase 19
 * `localStorage`-override hook of the same name: reads/writes now go
 * through `lib/api/products.ts` against the real backend, so this is
 * async where the old hook was synchronous. Used by
 * `pages/admin/ProductManager.tsx`.
 *
 * Every successful load also calls `setProductsCache()` so the
 * deprecated synchronous readers in `lib/productsStore.ts` (used by
 * `lib/adminStats.ts`/`lib/categoriesStore.ts`) stay reasonably fresh
 * after an admin visits this page - see `productsStore.ts`'s doc comment.
 *
 * `save`/`remove` re-fetch the full list afterwards rather than
 * optimistically patching local state, so the list is always exactly
 * what the backend has (including anything a real Postgres default -
 * like `created_at` - filled in), the same "server owns the truth"
 * posture Product Manager took even in its Phase 19 local form.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ProductsStatus>("loading");

  const load = useCallback(() => {
    setStatus("loading");
    apiGetProducts()
      .then((data) => {
        setProducts(data);
        setProductsCache(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (product: Product) => {
      await apiSaveProduct(product);
      load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await apiDeleteProduct(id);
      load();
    },
    [load],
  );

  return { products, status, reload: load, save, remove };
}
