import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreSettings } from "@/pages/admin/StoreSettings";
import { renderWithProviders } from "@/test/utils";
import { branding as BRANDING_DEFAULTS } from "@/config/branding";
import { getStoreSettingsOverride } from "@/lib/storeSettingsStore";

describe("StoreSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<StoreSettings />);
    expect(document.title).toContain("Store Settings");
  });

  it("prefills the form from the current (default) config", () => {
    renderWithProviders(<StoreSettings />);
    expect(screen.getByLabelText("Business name")).toHaveValue(BRANDING_DEFAULTS.businessName);
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<StoreSettings />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("saves an edited business name to localStorage and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSettings />);

    const nameInput = screen.getByLabelText("Business name");
    await user.clear(nameInput);
    await user.type(nameInput, "Willow & Vine");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(getStoreSettingsOverride().businessName).toBe("Willow & Vine");
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("blocks saving with an empty business name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSettings />);

    const nameInput = screen.getByLabelText("Business name");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Business name is required.")).toBeInTheDocument();
    expect(getStoreSettingsOverride().businessName).toBeUndefined();
  });

  it("reset to defaults clears the override and restores the form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSettings />);

    const nameInput = screen.getByLabelText("Business name");
    await user.clear(nameInput);
    await user.type(nameInput, "Willow & Vine");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getStoreSettingsOverride().businessName).toBe("Willow & Vine");

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getStoreSettingsOverride()).toEqual({});
    expect(screen.getByLabelText("Business name")).toHaveValue(BRANDING_DEFAULTS.businessName);
  });
});
