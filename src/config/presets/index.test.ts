import { describe, expect, it } from "vitest";
import { ACTIVE_PRESET_ID, activePreset, PRESETS, TEMPLATE_PRESETS } from "@/config/presets";

const NAV_STYLES = ["standard", "centered", "minimal"];
const FOOTER_STYLES = ["columns", "stacked", "minimal"];
const HERO_STYLES = ["illustrated", "bold", "minimal"];
const SECTION_SPACINGS = ["compact", "cozy", "relaxed", "spacious"];
const CARD_STYLES = ["soft", "flat", "outlined"];
const BUTTON_STYLES = ["rounded", "pill", "square"];

describe("template preset registry", () => {
  it("ships at least 10 presets", () => {
    expect(TEMPLATE_PRESETS.length).toBeGreaterThanOrEqual(10);
  });

  it("has ACTIVE_PRESET_ID pointing at a real preset, and activePreset resolves to it", () => {
    expect(PRESETS[ACTIVE_PRESET_ID]).toBeDefined();
    expect(activePreset).toBe(PRESETS[ACTIVE_PRESET_ID]);
  });

  it("includes the classic preset as the default, matching the original template values", () => {
    expect(PRESETS.classic).toBeDefined();
    expect(PRESETS.classic.theme.colors.primary).toBe("#4a6fa5");
    expect(PRESETS.classic.theme.colors.accent).toBe("#e8639e");
    expect(PRESETS.classic.navStyle).toBe("standard");
    expect(PRESETS.classic.footerStyle).toBe("columns");
    expect(PRESETS.classic.heroStyle).toBe("illustrated");
    expect(PRESETS.classic.sectionSpacing).toBe("cozy");
  });

  it("every preset's id matches its registry key", () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.id, `registry key "${key}" should match preset.id`).toBe(key);
    }
  });

  it("no two presets share an id", () => {
    const ids = TEMPLATE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every preset has a non-empty name and description", () => {
    for (const preset of TEMPLATE_PRESETS) {
      expect(preset.name.length, `${preset.id} should have a name`).toBeGreaterThan(0);
      expect(preset.description.length, `${preset.id} should have a description`).toBeGreaterThan(0);
    }
  });

  it("every preset only uses known style variants", () => {
    for (const preset of TEMPLATE_PRESETS) {
      expect(NAV_STYLES, `${preset.id}.navStyle`).toContain(preset.navStyle);
      expect(FOOTER_STYLES, `${preset.id}.footerStyle`).toContain(preset.footerStyle);
      expect(HERO_STYLES, `${preset.id}.heroStyle`).toContain(preset.heroStyle);
      expect(SECTION_SPACINGS, `${preset.id}.sectionSpacing`).toContain(preset.sectionSpacing);
      expect(CARD_STYLES, `${preset.id}.theme.cardStyle`).toContain(preset.theme.cardStyle);
      expect(BUTTON_STYLES, `${preset.id}.theme.buttonStyle`).toContain(preset.theme.buttonStyle);
    }
  });

  it("every preset defines every required color token as a valid hex color", () => {
    const hex = /^#[0-9a-f]{6}$/i;
    const colorKeys = [
      "cream",
      "surface",
      "beige",
      "beigeDark",
      "ink",
      "inkSoft",
      "primary",
      "primaryDeep",
      "primaryTint",
      "accent",
      "accentDeep",
      "accentTint",
      "success",
      "error",
    ] as const;
    for (const preset of TEMPLATE_PRESETS) {
      for (const key of colorKeys) {
        const value = preset.theme.colors[key];
        expect(value, `${preset.id}.theme.colors.${key}`).toMatch(hex);
      }
    }
  });

  it("every preset defines every radius token as a CSS length or 999px", () => {
    const length = /^(\d+(\.\d+)?(rem|px))$/;
    for (const preset of TEMPLATE_PRESETS) {
      for (const [key, value] of Object.entries(preset.theme.radius)) {
        expect(value, `${preset.id}.theme.radius.${key}`).toMatch(length);
      }
    }
  });

  it("every preset defines a display and body font with a fallback stack", () => {
    for (const preset of TEMPLATE_PRESETS) {
      expect(preset.theme.fonts.display.length, `${preset.id}.theme.fonts.display`).toBeGreaterThan(0);
      expect(preset.theme.fonts.body.length, `${preset.id}.theme.fonts.body`).toBeGreaterThan(0);
      expect(preset.theme.fonts.display, `${preset.id}.theme.fonts.display should have a fallback`).toContain(",");
      expect(preset.theme.fonts.body, `${preset.id}.theme.fonts.body should have a fallback`).toContain(",");
    }
  });
});
