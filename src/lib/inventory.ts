import type { Product } from "@/types/product";

/**
 * Phase 29 - Inventory. Pure helpers for real stock tracking, shared by
 * `ProductDetail.tsx`/`Cart.tsx`'s stock-aware UI and by
 * `Checkout.tsx`'s pre-submit `checkStockForLines()` gate.
 *
 * `Product.stock` (see `types/product.ts`) is optional and was
 * "architecture only" before this phase - a product with no `stock` set
 * is untracked/unlimited (e.g. a made-to-order item), not out of stock.
 * Every helper below treats `undefined` as "no limit" rather than 0, so
 * a white-label store that doesn't care about inventory can leave the
 * field blank on every product and see no behavior change from before
 * this phase.
 *
 * `MAX_CART_QTY` is the same per-line sanity ceiling `CartProvider.tsx`
 * enforced before this phase (previously a private `MAX_QTY` constant
 * there) - moved here so it's one source of truth shared with the real
 * stock ceiling computed below, instead of two constants that could
 * drift apart.
 */

export const MAX_CART_QTY = 10;
export const LOW_STOCK_THRESHOLD = 5;

export function isStockTracked(product: Pick<Product, "stock">): boolean {
  return typeof product.stock === "number";
}

/** Units actually available, or Infinity for an untracked product. Never negative. */
export function availableStock(product: Pick<Product, "stock">): number {
  if (!isStockTracked(product)) return Infinity;
  return Math.max(0, product.stock as number);
}

/** True only for a *tracked* product with zero units left - an untracked product is never "out of stock". */
export function isOutOfStock(product: Pick<Product, "stock">): boolean {
  return isStockTracked(product) && availableStock(product) === 0;
}

export function isLowStock(product: Pick<Product, "stock">, threshold = LOW_STOCK_THRESHOLD): boolean {
  const stock = availableStock(product);
  return isStockTracked(product) && stock > 0 && stock <= threshold;
}

/**
 * Highest quantity purchasable in one cart line right now, given how
 * many of this product are already in the cart. Combines the real stock
 * ceiling with the app-wide `MAX_CART_QTY` sanity cap - whichever is
 * lower wins. Returns 0 when the shopper already has every available
 * unit in their cart (or the product is out of stock).
 */
export function maxPurchasableQuantity(product: Pick<Product, "stock">, alreadyInCart = 0): number {
  const remaining = Math.max(0, availableStock(product) - alreadyInCart);
  return Math.min(MAX_CART_QTY, remaining);
}

export interface StockIssue {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

/**
 * Final pre-checkout gate: given a freshly-fetched catalog and the cart
 * lines about to be ordered, returns one issue per line whose requested
 * quantity now exceeds real stock (e.g. someone else bought the last
 * one while this shopper was mid-checkout). An empty array means it's
 * safe to place the order.
 *
 * This is the client-side half of the guarantee - a friendly message
 * before attempting the write. The actual enforcement against a
 * concurrent race is the `orders_decrement_stock` trigger in
 * `supabase/schema.sql`, which re-checks and decrements inside the same
 * transaction as the order insert.
 *
 * A product missing from the supplied catalog (e.g. deleted mid-
 * checkout) is treated as 0 available rather than skipped.
 */
export function checkStockForLines(
  products: Product[],
  lines: { productId: string; quantity: number; name?: string }[],
): StockIssue[] {
  const issues: StockIssue[] = [];
  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) {
      issues.push({ productId: line.productId, name: line.name ?? line.productId, requested: line.quantity, available: 0 });
      continue;
    }
    const available = availableStock(product);
    if (line.quantity > available) {
      issues.push({ productId: product.id, name: product.name, requested: line.quantity, available });
    }
  }
  return issues;
}
