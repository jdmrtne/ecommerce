import { createContext, useContext } from "react";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";

/** A cart item joined with its full product record, for display. */
export interface CartLine extends CartItem {
  product: Product;
}

export interface CartContextValue {
  items: CartItem[];
  /** items joined with product data from ALL_PRODUCTS - use this for rendering. */
  lines: CartLine[];
  /** Sum of all item quantities - drives the Navbar badge. */
  totalCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  /** Setting quantity to 0 or below removes the item. */
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

/** Access cart state/actions. Must be called under <CartProvider> (mounted in App.tsx). */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
