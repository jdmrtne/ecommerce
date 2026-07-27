export interface CategoryFormValues {
  label: string;
  description: string;
  icon: string;
}

export interface CategoryFormErrors {
  label?: string;
  description?: string;
  icon?: string;
}

/**
 * Validation for the Category Manager create/edit form (Phase 20).
 * Deliberately covers only the fields every consumer actually depends on
 * being present: `label`/`description` render directly (homepage
 * Categories section, Shop heading, CraftIcon fallback text), and `icon`
 * must be a real key in `lib/iconRegistry.ts`'s `ICON_REGISTRY` or every
 * product/category illustration in that category silently falls back to
 * the generic package icon. `tone`/`image`/`featured`/`itemCount` are
 * either cosmetic, optional, or (in `itemCount`'s case) not
 * admin-editable - see `pages/admin/CategoryManager.tsx`.
 */
export function validateCategory(values: CategoryFormValues, validIconNames: string[]): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  if (!values.label.trim()) errors.label = "Category name is required.";
  if (!values.description.trim()) errors.description = "Description is required.";
  if (!values.icon.trim()) {
    errors.icon = "Icon is required.";
  } else if (!validIconNames.includes(values.icon)) {
    errors.icon = "Choose one of the available icons.";
  }
  return errors;
}
