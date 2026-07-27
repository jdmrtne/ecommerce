import { describe, expect, it } from "vitest";
import { DYNAMIC_PAGES } from "@/config/layouts/pages";
import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { resolveLayoutSections } from "@/types/layout";

describe("dynamic page registry", () => {
  it("keys every entry by its own slug", () => {
    for (const [key, page] of Object.entries(DYNAMIC_PAGES)) {
      expect(page.slug).toBe(key);
    }
  });

  it("gives every page a root-relative path and non-empty meta title/description", () => {
    for (const page of Object.values(DYNAMIC_PAGES)) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(page.meta.title.length).toBeGreaterThan(0);
      expect(page.meta.description.length).toBeGreaterThan(0);
    }
  });

  it("only references known section keys, with no duplicates, and resolves at least one enabled section", () => {
    for (const page of Object.values(DYNAMIC_PAGES)) {
      const keys = page.sections.map((s) => s.key);
      for (const key of keys) {
        expect(Object.keys(SECTION_REGISTRY), `${page.slug} references unknown section "${key}"`).toContain(key);
      }
      expect(new Set(keys).size).toBe(keys.length);
      expect(resolveLayoutSections(page).length).toBeGreaterThan(0);
    }
  });
});
