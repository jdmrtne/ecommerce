import { MAIN_NAV } from "@/config/navigation";
import type { NavLink } from "@/config/navigation";
import { storageKey } from "@/config/branding";

/**
 * Phase 21 - Navigation Editor. Same override-over-defaults pattern as
 * every prior editor: persist edits as a `localStorage` override, resolved
 * over the static `config/navigation.ts` default at read time rather than
 * replacing it outright.
 *
 * `MAIN_NAV` is a flat, ordered array with no stable id per entry (just
 * `label`/`to`) - unlike Phase 19/20's product/category catalogs, there's
 * nothing here that's *referenced by* another record, and unlike Phase 18's
 * per-layout section list there's only ever one nav to edit, not several
 * named variants to pick between. So this is the simplest override shape
 * yet: a single optional whole-array field, saved and resolved as a unit -
 * closer to how Phase 18 saved `sections` as a whole array than to Phase
 * 19/20's id-keyed maps. Editing one link's label doesn't merge into a
 * stored per-id entry; the admin page edits a local copy of the full list
 * and saves it as one array, same as it always reads it as one array.
 *
 * `FOOTER_LINK_GROUPS`/`QUICK_LINKS` (also in `config/navigation.ts`) are
 * out of this phase's scope - Phase 22 (Footer Editor) covers footer
 * links.
 */
export interface NavigationSettingsOverride {
  links?: NavLink[];
}

const STORAGE_KEY = storageKey("navigation-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `useNavigation()`. */
export const NAVIGATION_SETTINGS_CHANGE_EVENT = "navigationsettingschange";

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getNavigationSettingsOverride(): NavigationSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const { links } = parsed as NavigationSettingsOverride;
    if (links !== undefined && !Array.isArray(links)) return {};
    return { links };
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(NAVIGATION_SETTINGS_CHANGE_EVENT));
}

/** Saves a full replacement nav link list, overriding `MAIN_NAV` in its entirety. */
export function saveNavigationSettingsOverride(links: NavLink[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ links }));
  notifyChange();
}

/** Clears the override, reverting the header nav back to the static `MAIN_NAV` default. */
export function resetNavigationSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/**
 * Resolves the live main nav link list: the saved override if one exists,
 * else the static `MAIN_NAV` default. This is what `Navbar.tsx` renders -
 * both the desktop links and the mobile/minimal menu links, across all
 * three `navStyle` variants, since they all read from the same list.
 */
export function resolveMainNav(): NavLink[] {
  const override = getNavigationSettingsOverride();
  return override.links ?? MAIN_NAV;
}
