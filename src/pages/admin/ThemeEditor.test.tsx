import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeEditor } from "@/pages/admin/ThemeEditor";
import { renderWithProviders } from "@/test/utils";
import { ACTIVE_PRESET_ID, PRESETS } from "@/config/presets";
import { getThemeSettingsOverride } from "@/lib/themeSettingsStore";

describe("ThemeEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<ThemeEditor />);
    expect(document.title).toContain("Theme Editor");
  });

  it("shows every shipped preset, with the active one marked selected", () => {
    renderWithProviders(<ThemeEditor />);
    for (const preset of Object.values(PRESETS)) {
      expect(screen.getByRole("button", { name: new RegExp(preset.name) })).toBeInTheDocument();
    }
    const activeButton = screen.getByRole("button", { name: new RegExp(PRESETS[ACTIVE_PRESET_ID].name) });
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<ThemeEditor />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("switching preset selects it and updates aria-pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeEditor />);

    await user.click(screen.getByRole("button", { name: /modern/i }));

    expect(screen.getByRole("button", { name: /modern/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: new RegExp(PRESETS[ACTIVE_PRESET_ID].name) })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("saves the selected preset and customized theme to localStorage, and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeEditor />);

    await user.click(screen.getByRole("button", { name: /modern/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const override = getThemeSettingsOverride();
    expect(override.activePresetId).toBe("modern");
    expect(override.theme).toEqual(PRESETS.modern.theme);
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("changing a color field updates the saved override on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeEditor />);

    const primaryColorInput = screen.getByLabelText("Primary");
    fireEvent.change(primaryColorInput, { target: { value: "#123456" } });

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getThemeSettingsOverride().theme?.colors.primary).toBe("#123456");
  });

  it("reset to defaults clears the override and re-selects the default preset", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeEditor />);

    await user.click(screen.getByRole("button", { name: /modern/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getThemeSettingsOverride().activePresetId).toBe("modern");

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getThemeSettingsOverride()).toEqual({});
    expect(screen.getByRole("button", { name: new RegExp(PRESETS[ACTIVE_PRESET_ID].name) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
