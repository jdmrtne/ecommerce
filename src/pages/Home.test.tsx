import { beforeEach, describe, expect, it } from "vitest";
import { Home } from "@/pages/Home";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS } from "@/config/layouts/home";
import { resolveLayoutSections } from "@/types/layout";
import { renderWithProviders } from "@/test/utils";
import { saveHomepageSettingsOverride } from "@/lib/homepageSettingsStore";

describe("Home", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders exactly one <section> per enabled section in the active layout", () => {
    const { container } = renderWithProviders(<Home />);
    const expectedCount = resolveLayoutSections(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]).length;
    expect(container.querySelectorAll("section").length).toBe(expectedCount);
  });

  it("reflects a saved Homepage Editor override (switching to the minimal layout)", () => {
    saveHomepageSettingsOverride({ activeLayoutId: "minimal" });
    const { container } = renderWithProviders(<Home />);
    const expectedCount = resolveLayoutSections(HOME_LAYOUTS.minimal).length;
    expect(container.querySelectorAll("section").length).toBe(expectedCount);
  });
});
