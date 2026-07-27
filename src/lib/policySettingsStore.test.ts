import { beforeEach, describe, expect, it, vi } from "vitest";
import { POLICY_PAGES } from "@/content/policies";
import {
  POLICY_SETTINGS_CHANGE_EVENT,
  getPolicySettingsOverride,
  resetPolicyOverride,
  resetPolicySettingsOverride,
  resolvePolicyDocument,
  resolvePolicyPages,
  savePolicyOverride,
} from "@/lib/policySettingsStore";

describe("policySettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to the static defaults when nothing has been saved", () => {
    expect(getPolicySettingsOverride()).toEqual({});
    expect(resolvePolicyDocument("privacy")).toEqual(POLICY_PAGES.privacy);
    expect(resolvePolicyPages()).toEqual(POLICY_PAGES);
  });

  it("saves a full replacement document for one slug and resolves it instead of the default", () => {
    const custom = { title: "Custom Privacy", lastUpdated: "2026-02-01", sections: [{ heading: "H", body: "B" }] };
    savePolicyOverride("privacy", custom);
    expect(resolvePolicyDocument("privacy")).toEqual(custom);
    // other slugs are untouched
    expect(resolvePolicyDocument("terms")).toEqual(POLICY_PAGES.terms);
  });

  it("saves overrides for multiple slugs independently", () => {
    const privacy = { title: "P", lastUpdated: "2026-01-02", sections: [{ heading: "H", body: "B" }] };
    const terms = { title: "T", lastUpdated: "2026-01-03", sections: [{ heading: "H2", body: "B2" }] };
    savePolicyOverride("privacy", privacy);
    savePolicyOverride("terms", terms);

    expect(resolvePolicyDocument("privacy")).toEqual(privacy);
    expect(resolvePolicyDocument("terms")).toEqual(terms);
    expect(resolvePolicyDocument("shipping")).toEqual(POLICY_PAGES.shipping);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    const custom = { title: "P", lastUpdated: "2026-01-02", sections: [] };
    savePolicyOverride("privacy", custom);
    expect(getPolicySettingsOverride()).toEqual({ privacy: custom });
  });

  it("resetPolicyOverride clears only the given slug", () => {
    const privacy = { title: "P", lastUpdated: "2026-01-02", sections: [] };
    const terms = { title: "T", lastUpdated: "2026-01-03", sections: [] };
    savePolicyOverride("privacy", privacy);
    savePolicyOverride("terms", terms);

    resetPolicyOverride("privacy");

    expect(resolvePolicyDocument("privacy")).toEqual(POLICY_PAGES.privacy);
    expect(resolvePolicyDocument("terms")).toEqual(terms);
  });

  it("resetPolicySettingsOverride clears every slug's override", () => {
    savePolicyOverride("privacy", { title: "P", lastUpdated: "2026-01-02", sections: [] });
    savePolicyOverride("terms", { title: "T", lastUpdated: "2026-01-03", sections: [] });

    resetPolicySettingsOverride();

    expect(getPolicySettingsOverride()).toEqual({});
    expect(resolvePolicyPages()).toEqual(POLICY_PAGES);
  });

  it("dispatches the change event on save and reset", () => {
    const handler = vi.fn();
    window.addEventListener(POLICY_SETTINGS_CHANGE_EVENT, handler);

    savePolicyOverride("privacy", { title: "P", lastUpdated: "2026-01-02", sections: [] });
    expect(handler).toHaveBeenCalledTimes(1);

    resetPolicyOverride("privacy");
    expect(handler).toHaveBeenCalledTimes(2);

    resetPolicySettingsOverride();
    expect(handler).toHaveBeenCalledTimes(3);

    window.removeEventListener(POLICY_SETTINGS_CHANGE_EVENT, handler);
  });

  it("falls back to defaults when localStorage contains corrupted JSON", () => {
    window.localStorage.setItem("store-policy-settings", "{not valid json");
    expect(getPolicySettingsOverride()).toEqual({});
    expect(resolvePolicyPages()).toEqual(POLICY_PAGES);
  });

  it("falls back to an empty override when the saved value isn't an object, or a slug's value has the wrong shape", () => {
    window.localStorage.setItem("store-policy-settings", JSON.stringify([1, 2, 3]));
    expect(getPolicySettingsOverride()).toEqual({});

    window.localStorage.setItem("store-policy-settings", JSON.stringify({ privacy: "not-a-document" }));
    expect(getPolicySettingsOverride()).toEqual({});
    expect(resolvePolicyDocument("privacy")).toEqual(POLICY_PAGES.privacy);

    window.localStorage.setItem(
      "store-policy-settings",
      JSON.stringify({ privacy: { title: "P", lastUpdated: "2026-01-01", sections: [{ heading: "H" }] } }),
    );
    expect(getPolicySettingsOverride()).toEqual({});
  });

  it("can save a document with an empty section list explicitly (the store performs no minimum-length validation)", () => {
    savePolicyOverride("privacy", { title: "P", lastUpdated: "2026-01-02", sections: [] });
    expect(resolvePolicyDocument("privacy").sections).toEqual([]);
  });
});
