import { loadThemeSettingsOverride } from "@/lib/themeSettingsStore";
import { loadStoreSettingsOverride } from "@/lib/storeSettingsStore";
import { loadHomepageSettingsOverride } from "@/lib/homepageSettingsStore";

/**
 * Fire-and-forget sync of every cross-device settings override
 * (theme/store/homepage) from Supabase into each store's local cache.
 * Called once at boot (`main.tsx`), right after the synchronous
 * localStorage-only `applyPreset(resolveActivePreset())` call - that
 * call still runs first so there's no flash-of-wrong-style on load, and
 * this fills in behind it once the network responds.
 *
 * Nothing here needs to be awaited by the caller: each store dispatches
 * its own change event when its fetch resolves, so any already-mounted
 * component using `useThemeSettings()`/`useStoreSettings()`/
 * `useHomepageSettings()` re-renders automatically with the synced
 * value - no loading state or prop drilling needed at the call site.
 */
export function syncSettingsFromServer(): void {
  void loadThemeSettingsOverride();
  void loadStoreSettingsOverride();
  void loadHomepageSettingsOverride();
}
