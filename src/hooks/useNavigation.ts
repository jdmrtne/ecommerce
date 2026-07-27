import { useCallback, useEffect, useState } from "react";
import {
  NAVIGATION_SETTINGS_CHANGE_EVENT,
  getNavigationSettingsOverride,
  resetNavigationSettingsOverride,
  resolveMainNav,
  saveNavigationSettingsOverride,
} from "@/lib/navigationSettingsStore";
import type { NavLink } from "@/config/navigation";

/**
 * Reactive read/write access to the Phase 21 Navigation Editor override.
 * Used by `pages/admin/NavigationEditor.tsx` and `components/layout/
 * Navbar.tsx` so a save/reset re-renders immediately, without a reload -
 * same subscription shape as every prior editor hook:
 * `NAVIGATION_SETTINGS_CHANGE_EVENT` for same-tab saves, the native
 * `storage` event for a different tab/window changing the same key.
 */
export function useNavigation() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(NAVIGATION_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(NAVIGATION_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((links: NavLink[]) => {
    saveNavigationSettingsOverride(links);
  }, []);

  const reset = useCallback(() => {
    resetNavigationSettingsOverride();
  }, []);

  return {
    mainNav: resolveMainNav(),
    isOverridden: getNavigationSettingsOverride().links !== undefined,
    save,
    reset,
  };
}
