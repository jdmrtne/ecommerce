import { describe, expect, it } from "vitest";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS, type HomepageSectionKey } from "@/config/layouts/home";
import { resolveLayoutSections } from "@/types/layout";

const ALL_SECTION_KEYS: HomepageSectionKey[] = [
  "hero",
  "categories",
  "featured",
  "bestSellers",
  "newArrivals",
  "collections",
  "about",
  "testimonials",
  "instagram",
  "newsletter",
  "faq",
  "contact",
];

describe("home layout config", () => {
  it("has ACTIVE_HOME_LAYOUT pointing at a real layout", () => {
    expect(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]).toBeDefined();
  });

  it("every layout renders at least the hero section first", () => {
    for (const [id, layout] of Object.entries(HOME_LAYOUTS)) {
      const sections = resolveLayoutSections(layout);
      expect(sections.length, `${id} should not be empty`).toBeGreaterThan(0);
      expect(sections[0].key, `${id} should open with the hero`).toBe("hero");
    }
  });

  it("every layout only references known section keys, with no duplicates", () => {
    for (const [id, layout] of Object.entries(HOME_LAYOUTS)) {
      const keys = layout.sections.map((s) => s.key);
      for (const key of keys) {
        expect(ALL_SECTION_KEYS, `${id} references unknown section "${key}"`).toContain(key);
      }
      const unique = new Set(keys);
      expect(unique.size, `${id} should not list the same section twice`).toBe(keys.length);
    }
  });

  it("the classic layout includes every section, all enabled (it's the full-template default)", () => {
    const keys = resolveLayoutSections(HOME_LAYOUTS.classic).map((s) => s.key);
    expect(new Set(keys)).toEqual(new Set(ALL_SECTION_KEYS));
  });

  it("resolveLayoutSections sorts by order and drops disabled sections", () => {
    const sample = {
      label: "Sample",
      description: "test fixture",
      sections: [
        { key: "contact" as const, enabled: true, order: 2 },
        { key: "hero" as const, enabled: true, order: 0 },
        { key: "faq" as const, enabled: false, order: 1 },
      ],
    };
    expect(resolveLayoutSections(sample).map((s) => s.key)).toEqual(["hero", "contact"]);
  });
});
