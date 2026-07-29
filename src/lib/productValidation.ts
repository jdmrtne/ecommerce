export interface ProductFormValues {
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  /** Optional - `undefined` means untracked/unlimited stock, not "empty". See `stock`'s error below. */
  stock?: number;
}

export interface ProductFormErrors {
  name?: string;
  category?: string;
  price?: string;
  rating?: string;
  description?: string;
  stock?: string;
}

/**
 * Validation for the Product Manager create/edit form (Phase 19).
 * Deliberately covers only the fields the rest of the app actually
 * depends on being present/well-formed - `ProductCard`/`ProductDetail`
 * always render name/price/rating/description, and `category` has to
 * match a real category for the Shop filter and breadcrumb to make
 * sense. Everything else on `Product` (tag, salesRank, details, images,
 * variants, tags) is optional free-form data with no downstream parsing
 * that would break on an empty value.
 *
 * `stock` is the one exception (Phase 29 - Inventory): once set, it
 * gates real purchasing (`lib/inventory.ts`, `Checkout.tsx`'s stock
 * check, and the `orders_decrement_stock` DB trigger), so a garbage
 * value here would silently block or wrongly allow checkouts. It stays
 * optional - `undefined` is the valid "unlimited/untracked" state, not
 * an error - but *if provided* it must be a non-negative whole number.
 */
export function validateProduct(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!values.name.trim()) errors.name = "Product name is required.";
  if (!values.category.trim()) errors.category = "Category is required.";
  if (!Number.isFinite(values.price) || values.price <= 0) errors.price = "Price must be greater than 0.";
  if (!Number.isFinite(values.rating) || values.rating < 0 || values.rating > 5) {
    errors.rating = "Rating must be between 0 and 5.";
  }
  if (!values.description.trim()) errors.description = "Description is required.";
  if (values.stock !== undefined && (!Number.isInteger(values.stock) || values.stock < 0)) {
    errors.stock = "Stock must be a whole number, 0 or greater.";
  }
  return errors;
}
