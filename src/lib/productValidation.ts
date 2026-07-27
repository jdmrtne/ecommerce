export interface ProductFormValues {
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
}

export interface ProductFormErrors {
  name?: string;
  category?: string;
  price?: string;
  rating?: string;
  description?: string;
}

/**
 * Validation for the Product Manager create/edit form (Phase 19).
 * Deliberately covers only the fields the rest of the app actually
 * depends on being present/well-formed - `ProductCard`/`ProductDetail`
 * always render name/price/rating/description, and `category` has to
 * match a real category for the Shop filter and breadcrumb to make
 * sense. Everything else on `Product` (tag, salesRank, details, images,
 * variants, stock, tags) is optional free-form data with no downstream
 * parsing that would break on an empty value.
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
  return errors;
}
