import { beforeEach, describe, expect, it, vi } from "vitest";
import { branding as BRANDING_DEFAULTS } from "@/config/branding";
import { business as BUSINESS_DEFAULTS } from "@/config/business";
import {
  STORE_SETTINGS_CHANGE_EVENT,
  getStoreSettingsOverride,
  resetStoreSettingsOverride,
  resolveBranding,
  resolveBusiness,
  saveStoreSettingsOverride,
} from "@/lib/storeSettingsStore";

describe("storeSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty override and the static defaults when nothing has been saved", () => {
    expect(getStoreSettingsOverride()).toEqual({});
    expect(resolveBranding()).toEqual(BRANDING_DEFAULTS);
    expect(resolveBusiness()).toEqual(BUSINESS_DEFAULTS);
  });

  it("layers a saved override over the static branding/business defaults", () => {
    saveStoreSettingsOverride({ businessName: "Willow & Vine", email: "hello@willowvine.example" });

    const branding = resolveBranding();
    expect(branding.businessName).toBe("Willow & Vine");
    expect(branding.tagline).toBe(BRANDING_DEFAULTS.tagline);
    // Non-overridden fields always come from the static default.
    expect(branding.logo).toBe(BRANDING_DEFAULTS.logo);
    // Fields entirely out of Store Settings' scope always come from the static default.
    expect(branding.storageKeyPrefix).toBe(BRANDING_DEFAULTS.storageKeyPrefix);

    const business = resolveBusiness();
    expect(business.email).toBe("hello@willowvine.example");
    expect(business.address).toBe(BUSINESS_DEFAULTS.address);
  });

  it("layers a saved logo/logoAlt/favicon override (Phase 24) the same way as any other field", () => {
    saveStoreSettingsOverride({ logo: "data:image/png;base64,AAAA", logoAlt: "New logo", favicon: "data:image/png;base64,BBBB" });

    const branding = resolveBranding();
    expect(branding.logo).toBe("data:image/png;base64,AAAA");
    expect(branding.logoAlt).toBe("New logo");
    expect(branding.favicon).toBe("data:image/png;base64,BBBB");
  });

  it("merges successive saves instead of replacing the whole override", () => {
    saveStoreSettingsOverride({ businessName: "Willow & Vine" });
    saveStoreSettingsOverride({ tagline: "Handmade, always" });

    const override = getStoreSettingsOverride();
    expect(override.businessName).toBe("Willow & Vine");
    expect(override.tagline).toBe("Handmade, always");
  });

  it("persists the override across a fresh read (survives a refresh)", () => {
    saveStoreSettingsOverride({ businessName: "Willow & Vine" });
    // Simulate a refresh: nothing but localStorage carries over.
    expect(getStoreSettingsOverride()).toEqual({ businessName: "Willow & Vine" });
  });

  it("resets cleanly back to the static defaults", () => {
    saveStoreSettingsOverride({ businessName: "Willow & Vine", email: "hello@willowvine.example" });
    resetStoreSettingsOverride();

    expect(getStoreSettingsOverride()).toEqual({});
    expect(resolveBranding()).toEqual(BRANDING_DEFAULTS);
    expect(resolveBusiness()).toEqual(BUSINESS_DEFAULTS);
  });

  it("dispatches the change event on save and on reset", () => {
    const handler = vi.fn();
    window.addEventListener(STORE_SETTINGS_CHANGE_EVENT, handler);

    saveStoreSettingsOverride({ businessName: "Willow & Vine" });
    expect(handler).toHaveBeenCalledTimes(1);

    resetStoreSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(STORE_SETTINGS_CHANGE_EVENT, handler);
  });

  it("ignores corrupted localStorage content instead of throwing", () => {
    window.localStorage.setItem("store-store-settings", "not json");
    expect(getStoreSettingsOverride()).toEqual({});

    window.localStorage.setItem("store-store-settings", JSON.stringify(["array", "not", "object"]));
    expect(getStoreSettingsOverride()).toEqual({});
  });

  it("preserves nested hours/social overrides as whole values, not merged per-field", () => {
    saveStoreSettingsOverride({
      hours: [{ days: "Every day", hours: "24 hours" }],
      social: { facebook: "https://facebook.com/example" },
    });

    const business = resolveBusiness();
    expect(business.hours).toEqual([{ days: "Every day", hours: "24 hours" }]);
    expect(business.social).toEqual({ facebook: "https://facebook.com/example" });
  });
});
