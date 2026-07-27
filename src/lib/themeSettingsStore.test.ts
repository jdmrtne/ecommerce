import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_PRESET_ID, PRESETS } from "@/config/presets";
import {
  THEME_SETTINGS_CHANGE_EVENT,
  getThemeSettingsOverride,
  resetThemeSettingsOverride,
  resolveActivePreset,
  resolveActivePresetId,
  saveThemeSettingsOverride,
} from "@/lib/themeSettingsStore";

describe("themeSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to ACTIVE_PRESET_ID and its own theme when nothing has been saved", () => {
    expect(getThemeSettingsOverride()).toEqual({});
    expect(resolveActivePresetId()).toBe(ACTIVE_PRESET_ID);
    expect(resolveActivePreset()).toEqual(PRESETS[ACTIVE_PRESET_ID]);
  });

  it("switches the active preset id when saved", () => {
    saveThemeSettingsOverride({ activePresetId: "modern" });
    expect(resolveActivePresetId()).toBe("modern");
    expect(resolveActivePreset().id).toBe("modern");
    // No theme customization saved alongside it - falls back to modern's own theme.
    expect(resolveActivePreset().theme).toEqual(PRESETS.modern.theme);
  });

  it("layers a custom theme over the selected preset, leaving nav/footer/hero/spacing untouched", () => {
    const customTheme = { ...PRESETS.modern.theme, colors: { ...PRESETS.modern.theme.colors, primary: "#ff0000" } };
    saveThemeSettingsOverride({ activePresetId: "modern", theme: customTheme });

    const resolved = resolveActivePreset();
    expect(resolved.theme.colors.primary).toBe("#ff0000");
    expect(resolved.navStyle).toBe(PRESETS.modern.navStyle);
    expect(resolved.footerStyle).toBe(PRESETS.modern.footerStyle);
    expect(resolved.heroStyle).toBe(PRESETS.modern.heroStyle);
    expect(resolved.sectionSpacing).toBe(PRESETS.modern.sectionSpacing);
  });

  it("ignores a saved theme override that belongs to a different preset than the currently active one", () => {
    const staleTheme = { ...PRESETS.modern.theme, colors: { ...PRESETS.modern.theme.colors, primary: "#ff0000" } };
    saveThemeSettingsOverride({ activePresetId: "modern", theme: staleTheme });
    // Switching preset without a matching theme save should not carry the old theme along.
    saveThemeSettingsOverride({ activePresetId: "luxury" });

    const resolved = resolveActivePreset();
    expect(resolved.id).toBe("luxury");
    expect(resolved.theme).toEqual(PRESETS.luxury.theme);
  });

  it("falls back to ACTIVE_PRESET_ID if the saved preset id is no longer valid", () => {
    saveThemeSettingsOverride({ activePresetId: "not-a-real-preset" });
    expect(resolveActivePresetId()).toBe(ACTIVE_PRESET_ID);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    saveThemeSettingsOverride({ activePresetId: "luxury" });
    expect(getThemeSettingsOverride()).toEqual({ activePresetId: "luxury" });
  });

  it("resets cleanly back to ACTIVE_PRESET_ID and its shipped theme", () => {
    saveThemeSettingsOverride({ activePresetId: "modern", theme: PRESETS.modern.theme });
    resetThemeSettingsOverride();

    expect(getThemeSettingsOverride()).toEqual({});
    expect(resolveActivePreset()).toEqual(PRESETS[ACTIVE_PRESET_ID]);
  });

  it("dispatches the change event on save and on reset", () => {
    const handler = vi.fn();
    window.addEventListener(THEME_SETTINGS_CHANGE_EVENT, handler);

    saveThemeSettingsOverride({ activePresetId: "modern" });
    expect(handler).toHaveBeenCalledTimes(1);

    resetThemeSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(THEME_SETTINGS_CHANGE_EVENT, handler);
  });

  it("ignores corrupted localStorage content instead of throwing", () => {
    window.localStorage.setItem("store-theme-settings", "not json");
    expect(getThemeSettingsOverride()).toEqual({});

    window.localStorage.setItem("store-theme-settings", JSON.stringify(["array", "not", "object"]));
    expect(getThemeSettingsOverride()).toEqual({});
  });
});
