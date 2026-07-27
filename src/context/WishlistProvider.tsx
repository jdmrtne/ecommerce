import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { WishlistContext } from "@/context/WishlistContext";
import { ALL_PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";
import { storageKey } from "@/config/branding";

const STORAGE_KEY = storageKey("wishlist");

function getInitialIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Drop any ids whose product no longer exists in the catalog - same
    // defensive pattern as CartProvider's stored-item filtering.
    return (parsed as string[]).filter(
      (id) => typeof id === "string" && ALL_PRODUCTS.some((p) => p.id === id),
    );
  } catch {
    return [];
  }
}

/**
 * App-wide wishlist state, mounted once in App.tsx alongside CartProvider.
 * Persisted to localStorage using the same read-on-init / write-on-change
 * pattern as CartProvider/useTheme. Only product ids are stored - product
 * data is joined from ALL_PRODUCTS at read time via `items`, same reasoning
 * as CartProvider's `lines`.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>(getInitialIds);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  }, [productIds]);

  const isWishlisted = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  );

  const toggleWishlist = useCallback((productId: string) => {
    setProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setProductIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearWishlist = useCallback(() => setProductIds([]), []);

  const items: Product[] = useMemo(
    () =>
      productIds
        .map((id) => ALL_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
    [productIds],
  );

  const value = useMemo(
    () => ({
      productIds,
      items,
      count: productIds.length,
      isWishlisted,
      toggleWishlist,
      removeItem,
      clearWishlist,
    }),
    [productIds, items, isWishlisted, toggleWishlist, removeItem, clearWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
