import { useCallback, useEffect, useState } from "react";
import {
  CATEGORIES_CHANGE_EVENT,
  countProductsInCategory,
  deleteCategoryOverride,
  getCategoriesOverride,
  resetCategoriesOverride,
  resolveAllCategories,
  saveCategoryOverride,
} from "@/lib/categoriesStore";
import type { Category } from "@/types/product";

/**
 * Reactive read/write access to the Phase 20 Category Manager override.
 * Used by `pages/admin/CategoryManager.tsx` so a save/delete/reset
 * re-renders the list immediately, without a reload - same subscription
 * shape as `useProducts`/`useStoreSettings`/`useThemeSettings`/
 * `useHomepageSettings`: `CATEGORIES_CHANGE_EVENT` for same-tab saves,
 * the native `storage` event for a different tab/window changing the
 * same key.
 */
export function useCategories() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(CATEGORIES_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(CATEGORIES_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((category: Category) => {
    saveCategoryOverride(category);
  }, []);

  const remove = useCallback((id: string) => {
    deleteCategoryOverride(id);
  }, []);

  const reset = useCallback(() => {
    resetCategoriesOverride();
  }, []);

  return {
    categories: resolveAllCategories(),
    isOverridden: Object.keys(getCategoriesOverride().entries).length > 0,
    countProductsInCategory,
    save,
    remove,
    reset,
  };
}
