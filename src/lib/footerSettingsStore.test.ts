import { beforeEach, describe, expect, it, vi } from "vitest";
import { FOOTER_LINK_GROUPS } from "@/config/navigation";
import { branding } from "@/config/branding";
import {
  FOOTER_SETTINGS_CHANGE_EVENT,
  getFooterSettingsOverride,
  resetFooterSettingsOverride,
  resolveCopyrightHolder,
  resolveFooterLinkGroups,
  saveFooterSettingsOverride,
} from "@/lib/footerSettingsStore";

describe("footerSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to the static defaults when nothing has been saved", () => {
    expect(getFooterSettingsOverride()).toEqual({});
    expect(resolveFooterLinkGroups()).toEqual(FOOTER_LINK_GROUPS);
    expect(resolveCopyrightHolder()).toEqual(branding.copyrightHolder);
  });

  it("saves a full replacement group list and resolves it instead of the default", () => {
    const custom = [{ title: "Shop", links: [{ label: "All Products", to: "/shop" }] }];
    saveFooterSettingsOverride({ groups: custom });
    expect(resolveFooterLinkGroups()).toEqual(custom);
    // copyright default is untouched by a groups-only save
    expect(resolveCopyrightHolder()).toEqual(branding.copyrightHolder);
  });

  it("saves a copyright override independently of groups", () => {
    saveFooterSettingsOverride({ copyrightHolder: "Acme Co" });
    expect(resolveCopyrightHolder()).toBe("Acme Co");
    expect(resolveFooterLinkGroups()).toEqual(FOOTER_LINK_GROUPS);
  });

  it("merges a partial save over an existing override rather than replacing it", () => {
    saveFooterSettingsOverride({ copyrightHolder: "Acme Co" });
    const custom = [{ title: "Help", links: [{ label: "Contact", to: "/contact" }] }];
    saveFooterSettingsOverride({ groups: custom });

    expect(resolveCopyrightHolder()).toBe("Acme Co");
    expect(resolveFooterLinkGroups()).toEqual(custom);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    saveFooterSettingsOverride({ copyrightHolder: "Acme Co" });
    expect(getFooterSettingsOverride()).toEqual({ copyrightHolder: "Acme Co" });
  });

  it("reset clears the whole override and restores both defaults", () => {
    saveFooterSettingsOverride({ copyrightHolder: "Acme Co", groups: [] });
    expect(resolveCopyrightHolder()).not.toEqual(branding.copyrightHolder);

    resetFooterSettingsOverride();
    expect(getFooterSettingsOverride()).toEqual({});
    expect(resolveFooterLinkGroups()).toEqual(FOOTER_LINK_GROUPS);
    expect(resolveCopyrightHolder()).toEqual(branding.copyrightHolder);
  });

  it("dispatches the change event on save and reset", () => {
    const handler = vi.fn();
    window.addEventListener(FOOTER_SETTINGS_CHANGE_EVENT, handler);

    saveFooterSettingsOverride({ copyrightHolder: "Acme Co" });
    expect(handler).toHaveBeenCalledTimes(1);

    resetFooterSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(FOOTER_SETTINGS_CHANGE_EVENT, handler);
  });

  it("falls back to defaults when localStorage contains corrupted JSON", () => {
    window.localStorage.setItem("store-footer-settings", "{not valid json");
    expect(getFooterSettingsOverride()).toEqual({});
    expect(resolveFooterLinkGroups()).toEqual(FOOTER_LINK_GROUPS);
    expect(resolveCopyrightHolder()).toEqual(branding.copyrightHolder);
  });

  it("falls back to defaults when the saved value isn't an object, or fields have the wrong type", () => {
    window.localStorage.setItem("store-footer-settings", JSON.stringify([1, 2, 3]));
    expect(getFooterSettingsOverride()).toEqual({});

    window.localStorage.setItem("store-footer-settings", JSON.stringify({ groups: "not-an-array" }));
    expect(getFooterSettingsOverride()).toEqual({});
    expect(resolveFooterLinkGroups()).toEqual(FOOTER_LINK_GROUPS);

    window.localStorage.setItem("store-footer-settings", JSON.stringify({ copyrightHolder: 42 }));
    expect(getFooterSettingsOverride()).toEqual({});
    expect(resolveCopyrightHolder()).toEqual(branding.copyrightHolder);
  });

  it("can save an empty group list explicitly (the store itself performs no minimum-length validation)", () => {
    saveFooterSettingsOverride({ groups: [] });
    expect(resolveFooterLinkGroups()).toEqual([]);
  });
});
