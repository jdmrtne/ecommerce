import { CATEGORIES } from "@/data/categories";
import { getCachedProducts } from "@/lib/productsStore";
import { storageKey } from "@/config/branding";
import type { Category } from "@/types/product";

/**
 * Phase 20 - Category Manager. Same override-over-defaults pattern as
 * `lib/productsStore.ts` (Phase 19): persist edits as a `localStorage`
 * override layered over the static seed catalog (`data/categories.ts`'s
 * `CATEGORIES`), resolved at read time rather than replacing the default
 * outright. Pre-backend, same as every other override store in this app -
 * Phase 27+ (Products/Categories, backend-integrated) is where this layer
 * gets swapped for a real API.
 *
 * Like the product catalog, this is a *list* of records rather than a
 * handful of named fields on one settings object, so the override shape
 * is an id-keyed map:
 * - A `Category` value means "this id's data has been created or edited -
 *   use this instead of (or in addition to) the static entry."
 * - A `{ deleted: true }` sentinel value means "this id has been removed -
 *   exclude it even though it may still exist in the static seed data."
 *
 * `resolveAllCategories()` walks the static catalog applying overrides/
 * deletions, then appends any admin-created categories (ids with no
 * static counterpart) in the order they were created.
 *
 * Unlike products, a category id is referenced *by* other records
 * (`Product.category`) rather than only referencing things itself, so
 * this file also exposes `countProductsInCategory()` - the Category
 * Manager UI uses it to block deleting a category that's still assigned
 * to at least one product, rather than silently orphaning those
 * products' category reference. As of Phase 27 the product catalog moved
 * to the real backend and is fetched asynchronously elsewhere, so this
 * check reads `productsStore.ts`'s deprecated synchronous cache instead
 * of a live resolver - see `countProductsInCategory()`'s own doc comment
 * for the accuracy tradeoff this implies.
 */
export type CategoryOverrideEntry = Category | { deleted: true };

export interface CategoriesOverride {
  entries: Record<string, CategoryOverrideEntry>;
}

const STORAGE_KEY = storageKey("categories");

/** Dispatched on `window` whenever the override is saved/deleted/reset - same-tab reactivity for `useCategories()`. */
export const CATEGORIES_CHANGE_EVENT = "categorieschange";

function isDeletedEntry(entry: CategoryOverrideEntry | undefined): entry is { deleted: true } {
  return typeof entry === "object" && entry !== null && "deleted" in entry && entry.deleted === true;
}

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getCategoriesOverride(): CategoriesOverride {
  if (typeof window === "undefined") return { entries: {} };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { entries: {} };
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { entries: {} };
    const entries = (parsed as CategoriesOverride).entries;
    if (typeof entries !== "object" || entries === null || Array.isArray(entries)) return { entries: {} };
    return { entries };
  } catch {
    return { entries: {} };
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(CATEGORIES_CHANGE_EVENT));
}

function persist(override: CategoriesOverride) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(override));
  notifyChange();
}

/** Creates a new category, or updates an existing one (static or previously created) - same entry either way. */
export function saveCategoryOverride(category: Category): void {
  if (typeof window === "undefined") return;
  const current = getCategoriesOverride();
  persist({ entries: { ...current.entries, [category.id]: category } });
}

/**
 * Marks a category as deleted, whether it originated from the static seed
 * data or was created in admin. Callers (the Category Manager UI) should
 * check `countProductsInCategory()` first and block this call entirely
 * when it's non-zero - this function itself performs no such check, same
 * as `deleteProductOverride()` performs no validation of its own.
 */
export function deleteCategoryOverride(id: string): void {
  if (typeof window === "undefined") return;
  const current = getCategoriesOverride();
  persist({ entries: { ...current.entries, [id]: { deleted: true } } });
}

/** Clears every override/deletion, reverting the whole category list back to the static seed data. */
export function resetCategoriesOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/**
 * Resolves the live category list: every static category (edited if
 * overridden, excluded if deleted), followed by any admin-created
 * categories (ids with no static counterpart), in creation order. This is
 * what every storefront/admin consumer should read instead of the static
 * `CATEGORIES` import, so Category Manager edits show up without a
 * reload.
 */
export function resolveAllCategories(): Category[] {
  const { entries } = getCategoriesOverride();
  const staticIds = new Set(CATEGORIES.map((c) => c.id));

  const base = CATEGORIES.filter((c) => !isDeletedEntry(entries[c.id])).map((c) => {
    const entry = entries[c.id];
    return entry && !isDeletedEntry(entry) ? entry : c;
  });

  const created = Object.entries(entries)
    .filter(([id, entry]) => !staticIds.has(id) && !isDeletedEntry(entry))
    .map(([, entry]) => entry as Category);

  return [...base, ...created];
}

/** Looks up a single category from the resolved list by id. */
export function resolveCategoryById(id: string): Category | undefined {
  return resolveAllCategories().find((c) => c.id === id);
}

/**
 * Number of products currently assigned to this category id. Used by the
 * Category Manager to block deleting a category still in use, rather
 * than leaving products pointing at a category id that no longer
 * resolves to anything.
 *
 * As of Phase 27, the product catalog itself lives in the backend and is
 * fetched asynchronously - this function stays synchronous by reading
 * `productsStore.ts`'s deprecated in-memory cache rather than the live
 * API, since migrating Category Manager onto the backend is a future
 * phase's job. See that file's doc comment for the accuracy tradeoff
 * this implies.
 */
export function countProductsInCategory(id: string): number {
  return getCachedProducts().filter((p) => p.category === id).length;
}

function slugify(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "category";
}

/**
 * Builds a unique category id/slug from a label (e.g. "Home Decor" ->
 * "home-decor"), appending "-2", "-3", etc. on collision. Defaults to
 * checking against the live resolved list so it never collides with a
 * static or previously-created category. `id` and `slug` are always kept
 * equal, matching every static category in `data/categories.ts` today.
 */
export function generateCategoryId(label: string, existingIds: Iterable<string> = resolveAllCategories().map((c) => c.id)): string {
  const idSet = new Set(existingIds);
  const base = slugify(label);
  if (!idSet.has(base)) return base;
  let suffix = 2;
  while (idSet.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
