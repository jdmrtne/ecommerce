import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ACTIVE_PRESET_ID, PRESETS } from "@/config/presets";
import { useThemeSettings } from "@/hooks/useThemeSettings";

describe("useThemeSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to ACTIVE_PRESET_ID with isOverridden false", () => {
    const { result } = renderHook(() => useThemeSettings());
    expect(result.current.activePreset.id).toBe(ACTIVE_PRESET_ID);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new preset immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useThemeSettings());

    act(() => {
      result.current.save({ activePresetId: "modern" });
    });

    expect(result.current.activePreset.id).toBe("modern");
    expect(result.current.isOverridden).toBe(true);
  });

  it("applies the resolved theme to the document root as CSS custom properties", () => {
    renderHook(() => useThemeSettings());
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-denim") || document.getElementById("brand-theme-overrides")).toBeTruthy();
  });

  it("re-renders back to the default immediately after reset()", () => {
    const { result } = renderHook(() => useThemeSettings());

    act(() => {
      result.current.save({ activePresetId: "modern" });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.activePreset.id).toBe(ACTIVE_PRESET_ID);
    expect(result.current.isOverridden).toBe(false);
  });

  it("applies the custom theme's primary color to the document on save", () => {
    const { result } = renderHook(() => useThemeSettings());
    const customTheme = { ...PRESETS.modern.theme, colors: { ...PRESETS.modern.theme.colors, primary: "#123456" } };

    act(() => {
      result.current.save({ activePresetId: "modern", theme: customTheme });
    });

    const styleEl = document.getElementById("brand-theme-overrides");
    expect(styleEl?.textContent).toContain("#123456");
  });
});
