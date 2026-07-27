import { useCallback, useEffect, useState } from "react";
import {
  HOMEPAGE_SETTINGS_CHANGE_EVENT,
  getHomepageSettingsOverride,
  resetHomepageSettingsOverride,
  resolveHomeLayout,
  saveHomepageSettingsOverride,
} from "@/lib/homepageSettingsStore";
import type { HomepageSettingsOverride } from "@/lib/homepageSettingsStore";

/**
 * Reactive read/write access to the Phase 18 Homepage Editor override.
 * Mirrors `hooks/useStoreSettings.ts`/`hooks/useThemeSettings.ts`:
 * re-renders on `HOMEPAGE_SETTINGS_CHANGE_EVENT` (same-tab saves/resets)
 * and the native `storage` event (another tab).
 *
 * Unlike Theme Editor, there's no document-wide side effect to reapply
 * here (a section arrangement is just data `pages/Home.tsx` reads at
 * render time), so this hook only exposes the resolved layout plus
 * `save()`/`reset()` - it doesn't need to touch the DOM.
 */
export function useHomepageSettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(HOMEPAGE_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(HOMEPAGE_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((partial: HomepageSettingsOverride) => {
    saveHomepageSettingsOverride(partial);
  }, []);

  const reset = useCallback(() => {
    resetHomepageSettingsOverride();
  }, []);

  return {
    layout: resolveHomeLayout(),
    override: getHomepageSettingsOverride(),
    isOverridden: Object.keys(getHomepageSettingsOverride()).length > 0,
    save,
    reset,
  };
}
