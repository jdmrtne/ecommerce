import { useCallback, useEffect, useState } from "react";
import type { PolicyDocument, PolicySlug } from "@/content/policies";
import {
  POLICY_SETTINGS_CHANGE_EVENT,
  getPolicySettingsOverride,
  resetPolicyOverride,
  resetPolicySettingsOverride,
  resolvePolicyDocument,
  resolvePolicyPages,
  savePolicyOverride,
} from "@/lib/policySettingsStore";

/**
 * Reactive read/write access to the Phase 23 Policy Editor override. Used
 * by `pages/admin/PolicyEditor.tsx` and `pages/Policy.tsx` so a save/reset
 * re-renders immediately, without a reload - same subscription shape as
 * every prior editor hook: `POLICY_SETTINGS_CHANGE_EVENT` for same-tab
 * saves, the native `storage` event for a different tab/window changing
 * the same key.
 */
export function usePolicySettings() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(POLICY_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(POLICY_SETTINGS_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const save = useCallback((slug: PolicySlug, doc: PolicyDocument) => {
    savePolicyOverride(slug, doc);
  }, []);

  const reset = useCallback((slug: PolicySlug) => {
    resetPolicyOverride(slug);
  }, []);

  const resetAll = useCallback(() => {
    resetPolicySettingsOverride();
  }, []);

  const override = getPolicySettingsOverride();

  return {
    pages: resolvePolicyPages(),
    isOverridden: (slug: PolicySlug) => override[slug] !== undefined,
    save,
    reset,
    resetAll,
  };
}

export { resolvePolicyDocument };
