import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CartContext } from "@/context/CartContext";
import type { CartLine } from "@/context/CartContext";
import { ALL_PRODUCTS } from "@/data/products";
import type { CartItem } from "@/types/cart";
import { storageKey } from "@/config/branding";
import { MAX_CART_QTY as MAX_QTY } from "@/lib/inventory";

const STORAGE_KEY = storageKey("cart");

function getInitialItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Drop any items whose product no longer exists in the catalog - defensive
    // today (the catalog is static), but this is exactly what would matter
    // once ALL_PRODUCTS is swapped for a real API.
    return (parsed as CartItem[]).filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number" &&
        ALL_PRODUCTS.some((p) => p.id === item.productId),
    );
  } catch {
    return [];
  }
}

/**
 * App-wide cart state, mounted once in App.tsx around the router.
 * Persisted to localStorage using the same read-on-init / write-on-change
 * pattern as useTheme.ts, so the cart survives a refresh. Cart items only
 * store { productId, quantity } - product data (name/price/etc) is joined
 * from ALL_PRODUCTS at read time via `lines`, not duplicated into storage.
 *
 * Phase 29 - Inventory. This provider still only enforces the generic
 * `MAX_CART_QTY` sanity cap (now sourced from `lib/inventory.ts`, not a
 * real stock ceiling) - it has no network access to the live catalog and
 * isn't the right layer to fetch it just for this. Real stock-aware
 * limits are enforced by the pages that already hold live product data:
 * `ProductDetail.tsx` (via `maxPurchasableQuantity()`) caps how much can
 * be added in the first place, `Cart.tsx` caps each line's quantity
 * stepper against freshly-fetched stock, and `Checkout.tsx` runs a final
 * `checkStockForLines()` gate against a fresh fetch right before
 * submitting. See `MASTER_HANDOFF.md`'s Known Issues for why this
 * provider still joins from the static `ALL_PRODUCTS` rather than the
 * backend (a pre-existing gap, out of this phase's scope).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getInitialItems);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + quantity) }
            : item,
        );
      }
      return [...prev, { productId, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(MAX_QTY, quantity) } : item,
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const lines: CartLine[] = useMemo(
    () =>
      items
        .map((item) => {
          const product = ALL_PRODUCTS.find((p) => p.id === item.productId);
          return product ? { ...item, product } : null;
        })
        .filter((line): line is CartLine => line !== null),
    [items],
  );

  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({ items, lines, totalCount, subtotal, addItem, removeItem, updateQuantity, clearCart }),
    [items, lines, totalCount, subtotal, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
