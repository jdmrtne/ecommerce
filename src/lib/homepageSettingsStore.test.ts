import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS } from "@/config/layouts/home";
import { resolveLayoutSections } from "@/types/layout";
import {
  HOMEPAGE_SETTINGS_CHANGE_EVENT,
  buildFullSectionList,
  getHomepageSettingsOverride,
  resetHomepageSettingsOverride,
  resolveActiveHomeLayoutId,
  resolveHomeLayout,
  saveHomepageSettingsOverride,
} from "@/lib/homepageSettingsStore";

describe("homepageSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to ACTIVE_HOME_LAYOUT and its own sections when nothing has been saved", () => {
    expect(getHomepageSettingsOverride()).toEqual({});
    expect(resolveActiveHomeLayoutId()).toBe(ACTIVE_HOME_LAYOUT);
    expect(resolveHomeLayout()).toEqual(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]);
  });

  it("switches the active layout id when saved", () => {
    saveHomepageSettingsOverride({ activeLayoutId: "minimal" });
    expect(resolveActiveHomeLayoutId()).toBe("minimal");
    expect(resolveHomeLayout().sections).toEqual(HOME_LAYOUTS.minimal.sections);
  });

  it("layers a custom section arrangement over the selected layout", () => {
    const customSections = [{ key: "hero" as const, enabled: true, order: 0 }];
    saveHomepageSettingsOverride({ activeLayoutId: "minimal", sections: customSections });

    const resolved = resolveHomeLayout();
    expect(resolved.sections).toEqual(customSections);
    expect(resolveLayoutSections(resolved).map((s) => s.key)).toEqual(["hero"]);
  });

  it("ignores a saved section arrangement that belongs to a different layout than the currently active one", () => {
    saveHomepageSettingsOverride({
      activeLayoutId: "minimal",
      sections: [{ key: "hero" as const, enabled: true, order: 0 }],
    });
    // Switching layout without a matching sections save should not carry the old arrangement along.
    saveHomepageSettingsOverride({ activeLayoutId: "luxury" });

    const resolved = resolveHomeLayout();
    expect(resolved.sections).toEqual(HOME_LAYOUTS.luxury.sections);
  });

  it("falls back to ACTIVE_HOME_LAYOUT if the saved layout id is no longer valid", () => {
    saveHomepageSettingsOverride({ activeLayoutId: "not-a-real-layout" as never });
    expect(resolveActiveHomeLayoutId()).toBe(ACTIVE_HOME_LAYOUT);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    saveHomepageSettingsOverride({ activeLayoutId: "modern" });
    expect(getHomepageSettingsOverride()).toEqual({ activeLayoutId: "modern" });
  });

  it("resets cleanly back to ACTIVE_HOME_LAYOUT and its shipped sections", () => {
    saveHomepageSettingsOverride({ activeLayoutId: "minimal", sections: HOME_LAYOUTS.minimal.sections });
    resetHomepageSettingsOverride();

    expect(getHomepageSettingsOverride()).toEqual({});
    expect(resolveHomeLayout()).toEqual(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]);
  });

  it("dispatches the change event on save and on reset", () => {
    const handler = vi.fn();
    window.addEventListener(HOMEPAGE_SETTINGS_CHANGE_EVENT, handler);

    saveHomepageSettingsOverride({ activeLayoutId: "modern" });
    expect(handler).toHaveBeenCalledTimes(1);

    resetHomepageSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(HOMEPAGE_SETTINGS_CHANGE_EVENT, handler);
  });

  it("ignores corrupted localStorage content instead of throwing", () => {
    window.localStorage.setItem("store-homepage-settings", "not json");
    expect(getHomepageSettingsOverride()).toEqual({});

    window.localStorage.setItem("store-homepage-settings", JSON.stringify(["array", "not", "object"]));
    expect(getHomepageSettingsOverride()).toEqual({});
  });
});

describe("buildFullSectionList", () => {
  it("expands a partial layout (minimal) into all 12 keys, missing ones appended as disabled", () => {
    const full = buildFullSectionList(HOME_LAYOUTS.minimal);
    expect(full.length).toBe(12);

    const minimalKeys = new Set(HOME_LAYOUTS.minimal.sections.map((s) => s.key));
    for (const section of full) {
      expect(section.enabled).toBe(minimalKeys.has(section.key));
    }
  });

  it("renumbers order sequentially across the whole list", () => {
    const full = buildFullSectionList(HOME_LAYOUTS.minimal);
    expect(full.map((s) => s.order)).toEqual(full.map((_, i) => i));
  });

  it("leaves a full layout (classic) with all 12 keys still enabled", () => {
    const full = buildFullSectionList(HOME_LAYOUTS.classic);
    expect(full.every((s) => s.enabled)).toBe(true);
    expect(full.length).toBe(12);
  });
});
