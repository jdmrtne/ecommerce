import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomepageEditor } from "@/pages/admin/HomepageEditor";
import { renderWithProviders } from "@/test/utils";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS } from "@/config/layouts/home";
import { getHomepageSettingsOverride } from "@/lib/homepageSettingsStore";

describe("HomepageEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<HomepageEditor />);
    expect(document.title).toContain("Homepage Editor");
  });

  it("shows every named layout, with the active one marked selected", () => {
    renderWithProviders(<HomepageEditor />);
    for (const layout of Object.values(HOME_LAYOUTS)) {
      expect(screen.getByRole("button", { name: new RegExp(layout.label) })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: new RegExp(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT].label) }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows all 12 sections, all enabled for the default (classic) layout", () => {
    renderWithProviders(<HomepageEditor />);
    expect(screen.getAllByRole("checkbox").length).toBe(12);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
    }
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<HomepageEditor />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("switching to the minimal layout disables sections minimal doesn't include", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomepageEditor />);

    await user.click(screen.getByRole("button", { name: /^minimal/i }));

    expect(screen.getByLabelText("Enable Featured Products")).toBeChecked();
    expect(screen.getByLabelText("Enable Shop by Category")).not.toBeChecked();
  });

  it("toggling a section's checkbox flips its enabled state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomepageEditor />);

    const heroCheckbox = screen.getByLabelText("Enable Hero");
    expect(heroCheckbox).toBeChecked();
    await user.click(heroCheckbox);
    expect(heroCheckbox).not.toBeChecked();
  });

  it("saves the selected layout and full section list to localStorage, and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomepageEditor />);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const override = getHomepageSettingsOverride();
    expect(override.activeLayoutId).toBe(ACTIVE_HOME_LAYOUT);
    expect(override.sections?.length).toBe(12);
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("moving a section up changes its saved order", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomepageEditor />);

    // classic order starts: hero, categories, ... - move "categories" up to swap with "hero".
    await user.click(screen.getByRole("button", { name: /move shop by category up/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const override = getHomepageSettingsOverride();
    const first = override.sections?.find((s) => s.order === 0);
    expect(first?.key).toBe("categories");
  });

  it("reset to defaults clears the override and re-selects the default layout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomepageEditor />);

    await user.click(screen.getByRole("button", { name: /^minimal/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getHomepageSettingsOverride().activeLayoutId).toBe("minimal");

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getHomepageSettingsOverride()).toEqual({});
    expect(
      screen.getByRole("button", { name: new RegExp(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT].label) }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
