import { DEFAULT_SHIPPING_METHODS } from "@/config/shipping";
import type { ShippingMethod } from "@/types/shipping";
import { storageKey } from "@/config/branding";

/**
 * Phase 32 - Shipping. Same override-over-defaults pattern as every prior
 * editor: persist edits as a `localStorage` override, resolved over the
 * static `config/shipping.ts` default at read time rather than replacing
 * it outright.
 *
 * `DEFAULT_SHIPPING_METHODS` is a flat, ordered array with no external
 * references to any one method's id (nothing else in the app points at a
 * specific shipping method the way `Product.category` points at a
 * `Category.id`) - so, like Phase 21's Navigation Editor, this is the
 * simplest override shape: a single optional whole-array field, saved and
 * resolved as one unit rather than an id-keyed map.
 *
 * Unlike Navigation, this store also does the actual shipping-cost math
 * (`computeShippingFee`) and zone filtering (`filterMethodsForProvince`),
 * since both `Checkout.tsx` and `pages/admin/ShippingEditor.tsx` need the
 * exact same logic and shouldn't be able to drift apart on it.
 */
export interface ShippingSettingsOverride {
  methods?: ShippingMethod[];
}

const STORAGE_KEY = storageKey("shipping-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `useShippingSettings()`. */
export const SHIPPING_SETTINGS_CHANGE_EVENT = "shippingsettingschange";

function isShippingMethod(value: unknown): value is ShippingMethod {
  if (typeof value !== "object" || value === null) return false;
  const method = value as Partial<ShippingMethod>;
  if (typeof method.id !== "string" || typeof method.name !== "string") return false;
  if (typeof method.rate !== "number" || Number.isNaN(method.rate)) return false;
  if (method.description !== undefined && typeof method.description !== "string") return false;
  if (method.freeThreshold !== undefined && typeof method.freeThreshold !== "number") return false;
  if (method.provinces !== undefined) {
    if (!Array.isArray(method.provinces) || !method.provinces.every((p) => typeof p === "string")) return false;
  }
  return true;
}

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getShippingSettingsOverride(): ShippingSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const { methods } = parsed as ShippingSettingsOverride;
    if (methods !== undefined && (!Array.isArray(methods) || !methods.every(isShippingMethod))) return {};
    return { methods };
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(SHIPPING_SETTINGS_CHANGE_EVENT));
}

/** Saves a full replacement shipping method list, overriding the static defaults in their entirety. */
export function saveShippingSettingsOverride(methods: ShippingMethod[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ methods }));
  notifyChange();
}

/** Clears the override, reverting shipping methods back to the static `DEFAULT_SHIPPING_METHODS`. */
export function resetShippingSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/** Resolves the live shipping method list: the saved override if one exists, else the static default. */
export function resolveShippingMethods(): ShippingMethod[] {
  const override = getShippingSettingsOverride();
  return override.methods ?? DEFAULT_SHIPPING_METHODS;
}

/**
 * Filters a method list down to what's offerable for a given shipping
 * address province: every method with no `provinces` restriction
 * (nationwide), plus any whose `provinces` list contains a
 * case-insensitive match. A blank/unrecognized province (e.g. before the
 * shipping fieldset is filled in) still resolves to every nationwide
 * method, so the result is never empty as long as at least one
 * nationwide method is configured.
 */
export function filterMethodsForProvince(methods: ShippingMethod[], province: string): ShippingMethod[] {
  const normalized = province.trim().toLowerCase();
  return methods.filter((method) => {
    if (!method.provinces || method.provinces.length === 0) return true;
    return method.provinces.some((p) => p.trim().toLowerCase() === normalized);
  });
}

/** Convenience: resolves the live method list and filters it for a province in one call. */
export function resolveShippingMethodsForProvince(province: string): ShippingMethod[] {
  return filterMethodsForProvince(resolveShippingMethods(), province);
}

/** A method's actual shipping fee for a given subtotal - the flat rate, or free once the subtotal meets its own `freeThreshold` (if any). */
export function computeShippingFee(method: ShippingMethod, subtotal: number): number {
  if (method.freeThreshold !== undefined && subtotal >= method.freeThreshold) return 0;
  return method.rate;
}

function slugify(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "method"
  );
}

/**
 * Generates a stable id for a newly-added shipping method from its name,
 * same slug-with-numeric-suffix-on-collision approach as
 * `categoriesStore.ts`'s `generateCategoryId()` - `ShippingEditor.tsx`
 * calls this once per new row on save, passing every other row's current
 * id as `existingIds`.
 */
export function generateShippingMethodId(name: string, existingIds: Iterable<string>): string {
  const idSet = new Set(existingIds);
  const base = slugify(name);
  if (!idSet.has(base)) return base;
  let suffix = 2;
  while (idSet.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
