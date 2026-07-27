import { FOOTER_LINK_GROUPS, type NavLink } from "@/config/navigation";
import { branding, storageKey } from "@/config/branding";

/**
 * Phase 22 - Footer Editor. Same override-over-defaults pattern as every
 * prior editor: persist edits as a `localStorage` override, resolved over
 * a static default at read time rather than replacing it outright.
 *
 * Covers the two footer fields that had no editor yet:
 * - `config/navigation.ts`'s `FOOTER_LINK_GROUPS` (link columns) - flagged
 *   as out of scope by Phase 21's `navigationSettingsStore.ts`, which only
 *   covers `MAIN_NAV`.
 * - `config/branding.ts`'s `copyrightHolder` - never made overridable by
 *   Phase 16 Store Settings (that store only covers `businessName`/
 *   `tagline`/`businessDescription` off `branding`).
 *
 * `FOOTER_LINK_GROUPS` is a list of groups, each themselves holding a list
 * of links - one level deeper than Phase 21's flat `MAIN_NAV`, but the same
 * "no per-entry id, only one list to edit" shape applies at the *group*
 * level (no id needed to reference a group from elsewhere), so this reuses
 * Phase 21's whole-array-as-one-field approach rather than Phase 19/20's
 * id-keyed map.
 *
 * Social links (`business.social`) are explicitly NOT duplicated here even
 * though they're in this phase's brief scope line - Phase 16 already made
 * them fully editable (`storeSettingsStore.ts`'s `social` field, live via
 * `useStoreSettings()`, already consumed by `Footer.tsx`). Storing them a
 * second time under a second key would create two competing sources of
 * truth for the same data. `pages/admin/FooterEditor.tsx` instead edits
 * social links in-place through `useStoreSettings()`, so "edit social
 * links from the Footer Editor" is satisfied without a duplicate store -
 * see that file's module comment for the full reasoning.
 */
export interface FooterLinkGroup {
  title: string;
  links: NavLink[];
}

export interface FooterSettingsOverride {
  groups?: FooterLinkGroup[];
  copyrightHolder?: string;
}

const STORAGE_KEY = storageKey("footer-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `useFooterSettings()`. */
export const FOOTER_SETTINGS_CHANGE_EVENT = "footersettingschange";

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getFooterSettingsOverride(): FooterSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const { groups, copyrightHolder } = parsed as FooterSettingsOverride;
    const result: FooterSettingsOverride = {};
    if (groups !== undefined) {
      if (!Array.isArray(groups)) return {};
      result.groups = groups;
    }
    if (copyrightHolder !== undefined) {
      if (typeof copyrightHolder !== "string") return {};
      result.copyrightHolder = copyrightHolder;
    }
    return result;
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(FOOTER_SETTINGS_CHANGE_EVENT));
}

/** Merges `partial` over any existing override and persists the result. */
export function saveFooterSettingsOverride(partial: FooterSettingsOverride): void {
  if (typeof window === "undefined") return;
  const next: FooterSettingsOverride = { ...getFooterSettingsOverride(), ...partial };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
}

/** Clears the entire override, reverting both fields back to their static defaults. */
export function resetFooterSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/** Resolves the live footer link groups: the saved override if one exists, else the static `FOOTER_LINK_GROUPS` default. */
export function resolveFooterLinkGroups(): FooterLinkGroup[] {
  const override = getFooterSettingsOverride();
  return override.groups ?? FOOTER_LINK_GROUPS;
}

/** Resolves the live copyright-line holder name: the saved override if one exists, else the static `branding.copyrightHolder` default. */
export function resolveCopyrightHolder(): string {
  const override = getFooterSettingsOverride();
  return override.copyrightHolder ?? branding.copyrightHolder;
}
