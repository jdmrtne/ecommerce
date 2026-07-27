import type { TemplatePreset } from "@/types/preset";
import type { ThemeConfig } from "@/config/theme";
import { storageKey } from "@/config/branding";
import { ACTIVE_PRESET_ID, PRESETS } from "@/config/presets";
import { classicPreset } from "@/config/presets/classic";

/**
 * Phase 17 - Theme Editor. Same override-over-defaults pattern established
 * in Phase 16 (`lib/storeSettingsStore.ts`): persist edits as a
 * `localStorage` override, resolved over the static config default at read
 * time, never replacing the default outright.
 *
 * Two independent things can be overridden:
 * - `activePresetId` - which of the 10 shipped presets is active, replacing
 *   the code-level `ACTIVE_PRESET_ID` edit from Phase 12.
 * - `theme` - a full customized `ThemeConfig` for the *currently selected*
 *   preset. Stored as a whole object (not merged field-by-field) - picking
 *   a different preset in the editor resets the customization back to that
 *   preset's own shipped `theme` as the new starting point, matching how
 *   `hours`/`social` were saved as whole values in Phase 16's store rather
 *   than deep-merged.
 *
 * `navStyle`/`footerStyle`/`heroStyle`/`sectionSpacing` are NOT
 * independently overridable here - per the Phase 17 brief, those stay
 * bundled with whichever preset is selected (only `ThemeConfig` fields -
 * colors/fonts/radius/card/button style - are customizable on top of it).
 */
export interface ThemeSettingsOverride {
  activePresetId?: string;
  theme?: ThemeConfig;
}

const STORAGE_KEY = storageKey("theme-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `useThemeSettings()`. */
export const THEME_SETTINGS_CHANGE_EVENT = "themesettingschange";

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getThemeSettingsOverride(): ThemeSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as ThemeSettingsOverride;
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(THEME_SETTINGS_CHANGE_EVENT));
}

/**
 * Merges `partial` over any existing override and persists the result.
 *
 * `activePresetId` and `theme` must always describe the *same* preset -
 * saving a new `activePresetId` with no accompanying `theme` means "use
 * that preset's own default theme", so any `theme` left over from a
 * previous save (which customized a *different* preset) is dropped
 * rather than carried forward by the merge.
 */
export function saveThemeSettingsOverride(partial: ThemeSettingsOverride): void {
  if (typeof window === "undefined") return;
  const next: ThemeSettingsOverride = { ...getThemeSettingsOverride(), ...partial };
  if (partial.activePresetId !== undefined && partial.theme === undefined) {
    delete next.theme;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
}

/** Clears the entire override, reverting back to `ACTIVE_PRESET_ID` and that preset's shipped theme. */
export function resetThemeSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/** Resolves which preset id is active: the saved override if it's still a valid preset key, else `ACTIVE_PRESET_ID`. */
export function resolveActivePresetId(): string {
  const override = getThemeSettingsOverride();
  if (override.activePresetId && override.activePresetId in PRESETS) return override.activePresetId;
  return ACTIVE_PRESET_ID;
}

/**
 * Resolves the live active preset: the selected preset (see
 * `resolveActivePresetId()`) with its `theme` replaced by the saved
 * customization, if any. `navStyle`/`footerStyle`/`heroStyle`/
 * `sectionSpacing` always come from the selected preset itself.
 */
export function resolveActivePreset(): TemplatePreset {
  const id = resolveActivePresetId();
  const base = PRESETS[id] ?? classicPreset;
  const override = getThemeSettingsOverride();
  if (override.theme && override.activePresetId === id) {
    return { ...base, theme: override.theme };
  }
  return base;
}
