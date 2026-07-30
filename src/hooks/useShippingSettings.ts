import { useCallback, useEffect, useState } from "react";
import {
  SHIPPING_SETTINGS_CHANGE_EVENT,
  getShippingSettingsOverride,
  resetShippingSettingsOverride,
  resolveShippingMethods,
  saveShippingSettingsOverride,
} from "@/lib/shippingSettingsStore";
import type { ShippingMethod } from "@/types/shipping";

/**
 * Reactive read/write access to the Phase 32 Shipping override. Used by
 * `pages/admin/ShippingEditor.tsx` and `pages/Checkout.tsx` so a save/reset
 * is reflected immediately, without a reload - same subscription shape as
 * every prior editor hook: `SHIPPING_SETTINGS_CHANGE_EVENT` for same-tab
 * saves, the native `storage` event for a different tab/window changing
 * the same key.
 */
export function useShippingSettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(SHIPPING_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(SHIPPING_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((methods: ShippingMethod[]) => {
    saveShippingSettingsOverride(methods);
  }, []);

  const reset = useCallback(() => {
    resetShippingSettingsOverride();
  }, []);

  return {
    methods: resolveShippingMethods(),
    isOverridden: getShippingSettingsOverride().methods !== undefined,
    save,
    reset,
  };
}
