import { createContext, useContext } from "react";
import type { Product } from "@/types/product";

export interface WishlistContextValue {
  productIds: string[];
  /** Wishlisted ids joined with product data from ALL_PRODUCTS - use this for rendering. */
  items: Product[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);

/** Access wishlist state/actions. Must be called under <WishlistProvider> (mounted in App.tsx). */
export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
