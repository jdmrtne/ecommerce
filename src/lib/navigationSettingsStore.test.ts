import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAIN_NAV } from "@/config/navigation";
import {
  NAVIGATION_SETTINGS_CHANGE_EVENT,
  getNavigationSettingsOverride,
  resetNavigationSettingsOverride,
  resolveMainNav,
  saveNavigationSettingsOverride,
} from "@/lib/navigationSettingsStore";

describe("navigationSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to the static MAIN_NAV when nothing has been saved", () => {
    expect(getNavigationSettingsOverride()).toEqual({});
    expect(resolveMainNav()).toEqual(MAIN_NAV);
  });

  it("saves a full replacement link list and resolves it instead of the default", () => {
    const custom = [
      { label: "Shop", to: "/shop" },
      { label: "Journal", to: "/journal" },
    ];
    saveNavigationSettingsOverride(custom);
    expect(resolveMainNav()).toEqual(custom);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    const custom = [{ label: "Home", to: "/" }];
    saveNavigationSettingsOverride(custom);
    expect(getNavigationSettingsOverride()).toEqual({ links: custom });
  });

  it("reset clears the override and restores MAIN_NAV", () => {
    saveNavigationSettingsOverride([{ label: "Only Link", to: "/only" }]);
    expect(resolveMainNav()).not.toEqual(MAIN_NAV);

    resetNavigationSettingsOverride();
    expect(getNavigationSettingsOverride()).toEqual({});
    expect(resolveMainNav()).toEqual(MAIN_NAV);
  });

  it("dispatches the change event on save and reset", () => {
    const handler = vi.fn();
    window.addEventListener(NAVIGATION_SETTINGS_CHANGE_EVENT, handler);

    saveNavigationSettingsOverride([{ label: "Shop", to: "/shop" }]);
    expect(handler).toHaveBeenCalledTimes(1);

    resetNavigationSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(NAVIGATION_SETTINGS_CHANGE_EVENT, handler);
  });

  it("falls back to the default when localStorage contains corrupted JSON", () => {
    window.localStorage.setItem("store-navigation-settings", "{not valid json");
    expect(getNavigationSettingsOverride()).toEqual({});
    expect(resolveMainNav()).toEqual(MAIN_NAV);
  });

  it("falls back to the default when the saved value isn't an object, or `links` isn't an array", () => {
    window.localStorage.setItem("store-navigation-settings", JSON.stringify([1, 2, 3]));
    expect(getNavigationSettingsOverride()).toEqual({});

    window.localStorage.setItem("store-navigation-settings", JSON.stringify({ links: "not-an-array" }));
    expect(getNavigationSettingsOverride()).toEqual({});
    expect(resolveMainNav()).toEqual(MAIN_NAV);
  });

  it("can save an empty link list explicitly (the store itself performs no minimum-length validation)", () => {
    saveNavigationSettingsOverride([]);
    expect(resolveMainNav()).toEqual([]);
  });
});
