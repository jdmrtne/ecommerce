import type { SupabaseClient } from "@supabase/supabase-js";
import type { PageLayout, SectionInstance } from "@/types/layout";
import { storageKey } from "@/config/branding";
import type { HomeLayoutId, HomepageSectionKey } from "@/config/layouts/home";
import { ACTIVE_HOME_LAYOUT, ALL_HOMEPAGE_SECTION_KEYS, HOME_LAYOUTS } from "@/config/layouts/home";
import { apiGetSetting, apiSaveSetting } from "@/lib/api/settings";

/** Row key this store uses in the `site_settings` table (see `lib/api/settings.ts`). */
const REMOTE_KEY = "homepage";

/**
 * Phase 18 - Homepage Editor. Same override-over-defaults pattern as
 * Phase 16/17: persist edits as a `localStorage` override, resolved over
 * the static config default at read time.
 *
 * Two independent things can be overridden, mirroring Phase 17's
 * `activePresetId`/`theme` shape:
 * - `activeLayoutId` - which of the 4 named homepage layouts
 *   (`classic`/`minimal`/`modern`/`luxury`) is the starting point,
 *   replacing the code-level `ACTIVE_HOME_LAYOUT` edit.
 * - `sections` - a full customized section list (enabled/order/title/
 *   subtitle/settings) for that specific layout, saved as a whole array
 *   rather than merged entry-by-entry. Picking a different base layout
 *   in the editor resets the customization back to that layout's own
 *   `sections`, same reasoning as Phase 17's `theme` reset-on-switch.
 */
export interface HomepageSettingsOverride {
  activeLayoutId?: HomeLayoutId;
  sections?: SectionInstance<HomepageSectionKey>[];
}

const STORAGE_KEY = storageKey("homepage-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `useHomepageSettings()`. */
export const HOMEPAGE_SETTINGS_CHANGE_EVENT = "homepagesettingschange";

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getHomepageSettingsOverride(): HomepageSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as HomepageSettingsOverride;
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(HOMEPAGE_SETTINGS_CHANGE_EVENT));
}

/**
 * Merges `partial` over any existing override and persists the result.
 *
 * `activeLayoutId` and `sections` must always describe the *same* layout
 * (a section arrangement only makes sense for the layout it was built
 * against) - saving a new `activeLayoutId` with no accompanying
 * `sections` means "use that layout's own default arrangement", so any
 * `sections` left over from a previous save (customizing a *different*
 * layout) is dropped rather than carried forward by the merge. Same
 * reasoning as Phase 17's `activePresetId`/`theme` pairing.
 */
export function saveHomepageSettingsOverride(partial: HomepageSettingsOverride): void {
  if (typeof window === "undefined") return;
  const next: HomepageSettingsOverride = { ...getHomepageSettingsOverride(), ...partial };
  if (partial.activeLayoutId !== undefined && partial.sections === undefined) {
    delete next.sections;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
  void apiSaveSetting(REMOTE_KEY, next).catch((error) => {
    console.error("Failed to sync homepage settings to the server - saved locally on this device only for now.", error);
  });
}

/** Clears the entire override, reverting back to `ACTIVE_HOME_LAYOUT` and its shipped section list. */
export function resetHomepageSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/**
 * Pulls the latest saved override from Supabase into the local cache -
 * see `themeSettingsStore.ts`'s `loadThemeSettingsOverride()` for the
 * full rationale. Called once at app boot (`lib/settingsSync.ts`).
 */
export async function loadHomepageSettingsOverride(client?: SupabaseClient): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const remote = await apiGetSetting<HomepageSettingsOverride>(REMOTE_KEY, client);
    if (remote === undefined) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    notifyChange();
  } catch (error) {
    console.error("Failed to load homepage settings from the server - showing this device's last-known settings instead.", error);
  }
}

/** Resolves which layout id is active: the saved override if it's still a valid layout key, else `ACTIVE_HOME_LAYOUT`. */
export function resolveActiveHomeLayoutId(): HomeLayoutId {
  const override = getHomepageSettingsOverride();
  if (override.activeLayoutId && override.activeLayoutId in HOME_LAYOUTS) return override.activeLayoutId;
  return ACTIVE_HOME_LAYOUT;
}

/**
 * Resolves the live homepage layout: the selected layout (see
 * `resolveActiveHomeLayoutId()`) with its `sections` replaced by the
 * saved customization, if any exists for that same layout. This is what
 * `pages/Home.tsx` renders - a plain function call, not a hook, since
 * Home isn't mounted while the admin is editing (the admin/storefront
 * route trees are separate, so navigating back to `/` after a save
 * re-mounts Home and resolves fresh).
 */
export function resolveHomeLayout(): PageLayout<HomepageSectionKey> {
  const id = resolveActiveHomeLayoutId();
  const base = HOME_LAYOUTS[id];
  const override = getHomepageSettingsOverride();
  if (override.sections && override.activeLayoutId === id) {
    return { ...base, sections: override.sections };
  }
  return base;
}

/**
 * Expands a layout's `sections` (which, for layouts like `minimal`, only
 * lists a handful of keys) into a full ordered list covering every
 * `HomepageSectionKey` - missing ones are appended as disabled, with
 * `order` renumbered sequentially across the whole list. This is what the
 * Homepage Editor's section-list UI edits: every section is always shown
 * and toggleable, not just the ones a given layout happens to enable.
 */
export function buildFullSectionList(
  layout: PageLayout<HomepageSectionKey>,
): SectionInstance<HomepageSectionKey>[] {
  const present = [...layout.sections].sort((a, b) => a.order - b.order);
  const presentKeys = new Set(present.map((section) => section.key));
  const missing: SectionInstance<HomepageSectionKey>[] = ALL_HOMEPAGE_SECTION_KEYS.filter(
    (key) => !presentKeys.has(key),
  ).map((key) => ({ key, enabled: false, order: 0 }));

  return [...present, ...missing].map((section, index) => ({ ...section, order: index }));
}
