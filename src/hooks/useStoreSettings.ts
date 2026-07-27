import { useCallback, useEffect, useState } from "react";
import {
  STORE_SETTINGS_CHANGE_EVENT,
  getStoreSettingsOverride,
  resetStoreSettingsOverride,
  resolveBranding,
  resolveBusiness,
  saveStoreSettingsOverride,
} from "@/lib/storeSettingsStore";
import type { StoreSettingsOverride } from "@/lib/storeSettingsStore";

/**
 * Reactive read/write access to the Phase 16 Store Settings override.
 * Any component that shows branding/business info the admin can edit
 * (Navbar, Footer, Contact, the admin shell itself, ...) should use this
 * hook instead of importing `branding`/`business` directly, so a save (or
 * reset) is reflected the moment it happens, without needing a full page
 * reload.
 *
 * Re-renders on `STORE_SETTINGS_CHANGE_EVENT` (same-tab saves/resets, via
 * `storeSettingsStore.ts`) and on the native `storage` event (a different
 * tab/window changing the same key) - covering both cases with a single
 * subscription.
 */
export function useStoreSettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(STORE_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(STORE_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((partial: StoreSettingsOverride) => {
    saveStoreSettingsOverride(partial);
  }, []);

  const reset = useCallback(() => {
    resetStoreSettingsOverride();
  }, []);

  return {
    branding: resolveBranding(),
    business: resolveBusiness(),
    override: getStoreSettingsOverride(),
    isOverridden: Object.keys(getStoreSettingsOverride()).length > 0,
    save,
    reset,
  };
}
