import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/layout/Navbar";
import { renderWithProviders } from "@/test/utils";
import { MAIN_NAV } from "@/config/navigation";
import { saveNavigationSettingsOverride } from "@/lib/navigationSettingsStore";
import { saveThemeSettingsOverride } from "@/lib/themeSettingsStore";

// jsdom doesn't implement matchMedia - `useTheme` reads it for the
// prefers-color-scheme fallback on mount. No prior test rendered Navbar
// directly (Footer's test doesn't touch useTheme), so this gap went
// unnoticed until now - same category of fix as the IntersectionObserver
// stub in `test/setup.ts`.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
});

/**
 * Phase 21 - confirms `Navbar.tsx` reads the live, override-aware nav link
 * list (`useNavigation()`) instead of the static `MAIN_NAV` import, across
 * all three `navStyle` variants a template preset can select
 * (`standard`/`centered`/`minimal` - see `config/presets/`).
 */
describe("Navbar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the default MAIN_NAV links when no Navigation Editor override exists", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByRole("link", { name: MAIN_NAV[0].label }).length).toBeGreaterThan(0);
  });

  it("reflects a saved Navigation Editor override without a reload (standard navStyle)", () => {
    saveThemeSettingsOverride({ activePresetId: "classic" }); // navStyle: "standard"
    saveNavigationSettingsOverride([{ label: "Journal", to: "/journal" }]);
    renderWithProviders(<Navbar />);

    expect(screen.getAllByRole("link", { name: "Journal" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: MAIN_NAV[0].label })).not.toBeInTheDocument();
  });

  it("reflects a saved Navigation Editor override without a reload (centered navStyle)", () => {
    saveThemeSettingsOverride({ activePresetId: "luxury" }); // navStyle: "centered"
    saveNavigationSettingsOverride([{ label: "Journal", to: "/journal" }]);
    renderWithProviders(<Navbar />);

    expect(screen.getAllByRole("link", { name: "Journal" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: MAIN_NAV[0].label })).not.toBeInTheDocument();
  });

  it("reflects a saved Navigation Editor override without a reload (minimal navStyle)", async () => {
    const user = userEvent.setup();
    saveThemeSettingsOverride({ activePresetId: "minimal" }); // navStyle: "minimal"
    saveNavigationSettingsOverride([{ label: "Journal", to: "/journal" }]);
    renderWithProviders(<Navbar />);

    // The minimal navStyle tucks links behind the menu toggle rather than
    // showing them inline - open it to reach the menu panel, which reads
    // from the same resolved link list.
    await user.click(screen.getByLabelText("Toggle menu"));

    expect(screen.getAllByRole("link", { name: "Journal" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: MAIN_NAV[0].label })).not.toBeInTheDocument();
  });
});
