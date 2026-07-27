import { useCallback, useEffect, useState } from "react";
import {
  FOOTER_SETTINGS_CHANGE_EVENT,
  getFooterSettingsOverride,
  resetFooterSettingsOverride,
  resolveCopyrightHolder,
  resolveFooterLinkGroups,
  saveFooterSettingsOverride,
} from "@/lib/footerSettingsStore";
import type { FooterLinkGroup, FooterSettingsOverride } from "@/lib/footerSettingsStore";

/**
 * Reactive read/write access to the Phase 22 Footer Editor override. Used
 * by `pages/admin/FooterEditor.tsx` and `components/layout/Footer.tsx` so
 * a save/reset re-renders immediately, without a reload - same
 * subscription shape as every prior editor hook:
 * `FOOTER_SETTINGS_CHANGE_EVENT` for same-tab saves, the native `storage`
 * event for a different tab/window changing the same key.
 */
export function useFooterSettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(FOOTER_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(FOOTER_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((partial: FooterSettingsOverride) => {
    saveFooterSettingsOverride(partial);
  }, []);

  const reset = useCallback(() => {
    resetFooterSettingsOverride();
  }, []);

  const override = getFooterSettingsOverride();

  return {
    linkGroups: resolveFooterLinkGroups(),
    copyrightHolder: resolveCopyrightHolder(),
    isOverridden: Object.keys(override).length > 0,
    save,
    reset,
  };
}

export type { FooterLinkGroup };
