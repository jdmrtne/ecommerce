import { useCallback, useEffect, useState } from "react";
import { applyPreset } from "@/config/presets";
import {
  THEME_SETTINGS_CHANGE_EVENT,
  getThemeSettingsOverride,
  resetThemeSettingsOverride,
  resolveActivePreset,
  saveThemeSettingsOverride,
} from "@/lib/themeSettingsStore";
import type { ThemeSettingsOverride } from "@/lib/themeSettingsStore";

/**
 * Reactive read/write access to the Phase 17 Theme Editor override.
 * Mirrors `hooks/useStoreSettings.ts` (Phase 16): re-renders on
 * `THEME_SETTINGS_CHANGE_EVENT` (same-tab saves/resets) and the native
 * `storage` event (another tab), and re-applies the resolved preset to the
 * document (`applyPreset()` - CSS custom properties + layout data
 * attributes) whenever it changes, so a save/reset is visible immediately
 * without a reload.
 *
 * `Navbar`/`Footer`/`Hero` should read `activePreset` from this hook
 * instead of the static `config/presets` import, so a preset switch is
 * reflected the next time they render.
 */
export function useThemeSettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(THEME_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(THEME_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const activePreset = resolveActivePreset();

  // Keep the actual document in sync with whatever this hook currently
  // resolves to - this is what makes a Theme Editor save (or a preset
  // switch from anywhere else this hook is mounted) update the live page
  // colors/fonts/radius/card/button style instantly.
  useEffect(() => {
    applyPreset(activePreset);
  }, [activePreset]);

  const save = useCallback((partial: ThemeSettingsOverride) => {
    saveThemeSettingsOverride(partial);
  }, []);

  const reset = useCallback(() => {
    resetThemeSettingsOverride();
  }, []);

  return {
    activePreset,
    override: getThemeSettingsOverride(),
    isOverridden: Object.keys(getThemeSettingsOverride()).length > 0,
    save,
    reset,
  };
}
