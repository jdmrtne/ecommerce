import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";
import { renderWithProviders } from "@/test/utils";
import { branding as BRANDING_DEFAULTS } from "@/config/branding";
import { FOOTER_LINK_GROUPS } from "@/config/navigation";
import { saveStoreSettingsOverride } from "@/lib/storeSettingsStore";
import { saveFooterSettingsOverride } from "@/lib/footerSettingsStore";
import { saveThemeSettingsOverride } from "@/lib/themeSettingsStore";

describe("Footer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the default business name/tagline when no Store Settings override exists", () => {
    renderWithProviders(<Footer />);
    expect(screen.getAllByText(BRANDING_DEFAULTS.tagline).length).toBeGreaterThan(0);
  });

  it("reflects a saved Store Settings override without a reload", () => {
    saveStoreSettingsOverride({ tagline: "Handmade, always" });
    renderWithProviders(<Footer />);
    expect(screen.getAllByText("Handmade, always").length).toBeGreaterThan(0);
    expect(screen.queryByText(BRANDING_DEFAULTS.tagline)).not.toBeInTheDocument();
  });

  /**
   * Phase 22 - confirms `Footer.tsx` reads the live, override-aware link
   * groups and copyright name (`useFooterSettings()`) instead of the
   * static `FOOTER_LINK_GROUPS`/`branding.copyrightHolder` imports, across
   * the `footerStyle` variants a template preset can select
   * (`columns`/`stacked`/`minimal` - see `config/presets/`).
   */
  describe("Footer Editor overrides", () => {
    it("shows the default FOOTER_LINK_GROUPS and copyright when no override exists (columns footerStyle)", () => {
      saveThemeSettingsOverride({ activePresetId: "classic" }); // footerStyle: "columns"
      renderWithProviders(<Footer />);

      expect(screen.getAllByText(FOOTER_LINK_GROUPS[0].title).length).toBeGreaterThan(0);
      expect(screen.getAllByText(FOOTER_LINK_GROUPS[0].links[0].label).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(BRANDING_DEFAULTS.copyrightHolder)).length).toBeGreaterThan(0);
    });

    it("reflects a saved override without a reload (columns footerStyle)", () => {
      saveThemeSettingsOverride({ activePresetId: "classic" }); // footerStyle: "columns"
      saveFooterSettingsOverride({
        groups: [{ title: "Legal", links: [{ label: "Terms", to: "/policies/terms" }] }],
        copyrightHolder: "Acme Co",
      });
      renderWithProviders(<Footer />);

      expect(screen.getAllByText("Legal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Terms").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Acme Co/).length).toBeGreaterThan(0);
      expect(screen.queryByText(FOOTER_LINK_GROUPS[0].title)).not.toBeInTheDocument();
    });

    it("reflects a saved override without a reload (stacked footerStyle)", () => {
      saveThemeSettingsOverride({ activePresetId: "modern" }); // footerStyle: "stacked"
      saveFooterSettingsOverride({
        groups: [{ title: "Legal", links: [{ label: "Terms", to: "/policies/terms" }] }],
        copyrightHolder: "Acme Co",
      });
      renderWithProviders(<Footer />);

      expect(screen.getAllByText("Legal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Terms").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Acme Co/).length).toBeGreaterThan(0);
      expect(screen.queryByText(FOOTER_LINK_GROUPS[0].title)).not.toBeInTheDocument();
    });

    it("reflects a saved copyright override without a reload (minimal footerStyle, no link groups shown)", () => {
      saveThemeSettingsOverride({ activePresetId: "minimal" }); // footerStyle: "minimal"
      saveFooterSettingsOverride({
        groups: [{ title: "Legal", links: [{ label: "Terms", to: "/policies/terms" }] }],
        copyrightHolder: "Acme Co",
      });
      renderWithProviders(<Footer />);

      // The minimal footerStyle never renders link groups at all, even
      // when an override exists - only the copyright line does.
      expect(screen.queryByText("Legal")).not.toBeInTheDocument();
      expect(screen.queryByText("Terms")).not.toBeInTheDocument();
      expect(screen.getAllByText(/Acme Co/).length).toBeGreaterThan(0);
    });
  });
});
