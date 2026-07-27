/** A single line in the cart - just an id + quantity. Product details are
 * joined from ALL_PRODUCTS at read time (see CartProvider) rather than
 * duplicated here, so a catalog edit is reflected everywhere automatically. */
export interface CartItem {
  productId: string;
  quantity: number;
}
