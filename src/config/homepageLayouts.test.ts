import { describe, expect, it } from "vitest";
import {
  ACTIVE_HOMEPAGE_LAYOUT,
  HOMEPAGE_LAYOUTS,
  type HomepageSectionKey,
} from "@/config/homepageLayouts";

const ALL_SECTION_KEYS: HomepageSectionKey[] = [
  "hero",
  "categories",
  "featured",
  "bestSellers",
  "about",
  "testimonials",
  "instagram",
  "newsletter",
  "faq",
  "contact",
];

describe("homepageLayouts config", () => {
  it("has ACTIVE_HOMEPAGE_LAYOUT pointing at a real layout", () => {
    expect(HOMEPAGE_LAYOUTS[ACTIVE_HOMEPAGE_LAYOUT]).toBeDefined();
  });

  it("every layout renders at least the hero section first", () => {
    for (const [id, layout] of Object.entries(HOMEPAGE_LAYOUTS)) {
      expect(layout.sections.length, `${id} should not be empty`).toBeGreaterThan(0);
      expect(layout.sections[0], `${id} should open with the hero`).toBe("hero");
    }
  });

  it("every layout only references known section keys, with no duplicates", () => {
    for (const [id, layout] of Object.entries(HOMEPAGE_LAYOUTS)) {
      for (const key of layout.sections) {
        expect(ALL_SECTION_KEYS, `${id} references unknown section "${key}"`).toContain(key);
      }
      const unique = new Set(layout.sections);
      expect(unique.size, `${id} should not list the same section twice`).toBe(layout.sections.length);
    }
  });

  it("the classic layout includes every section (it's the full-template default)", () => {
    expect(new Set(HOMEPAGE_LAYOUTS.classic.sections)).toEqual(new Set(ALL_SECTION_KEYS));
  });
});
