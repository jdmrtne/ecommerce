import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShippingEditor } from "@/pages/admin/ShippingEditor";
import { renderWithProviders } from "@/test/utils";
import { DEFAULT_SHIPPING_METHODS } from "@/config/shipping";
import { getShippingSettingsOverride } from "@/lib/shippingSettingsStore";

describe("ShippingEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<ShippingEditor />);
    expect(document.title).toContain("Shipping");
  });

  it("prefills the form from DEFAULT_SHIPPING_METHODS", () => {
    renderWithProviders(<ShippingEditor />);
    const names = screen.getAllByLabelText("Name").map((el) => (el as HTMLInputElement).value);
    const rates = screen.getAllByLabelText("Rate (₱)").map((el) => (el as HTMLInputElement).value);
    expect(names).toEqual(DEFAULT_SHIPPING_METHODS.map((m) => m.name));
    expect(rates).toEqual(DEFAULT_SHIPPING_METHODS.map((m) => String(m.rate)));
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<ShippingEditor />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("saves an edited rate to localStorage and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    const firstRate = screen.getAllByLabelText("Rate (₱)")[0];
    await user.clear(firstRate);
    await user.type(firstRate, "120");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(getShippingSettingsOverride().methods?.[0]).toMatchObject({ rate: 120 });
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("adds a new method, generates an id from its name, and persists it on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    await user.click(screen.getByRole("button", { name: /add shipping method/i }));
    const names = screen.getAllByLabelText("Name");
    const rates = screen.getAllByLabelText("Rate (₱)");
    await user.type(names[names.length - 1], "Metro Manila Express");
    await user.type(rates[rates.length - 1], "150");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getShippingSettingsOverride().methods ?? [];
    expect(saved).toHaveLength(DEFAULT_SHIPPING_METHODS.length + 1);
    expect(saved[saved.length - 1]).toMatchObject({
      id: "metro-manila-express",
      name: "Metro Manila Express",
      rate: 150,
    });
  });

  it("saves an optional free-shipping threshold and province zone list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    await user.click(screen.getByRole("button", { name: /add shipping method/i }));
    const names = screen.getAllByLabelText("Name");
    const rates = screen.getAllByLabelText("Rate (₱)");
    const thresholds = screen.getAllByLabelText(/free shipping at or above/i);
    const provinces = screen.getAllByLabelText("Provinces (optional)");
    await user.type(names[names.length - 1], "Metro Manila Express");
    await user.type(rates[rates.length - 1], "150");
    await user.type(thresholds[thresholds.length - 1], "3000");
    await user.type(provinces[provinces.length - 1], "Metro Manila, Cavite");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getShippingSettingsOverride().methods ?? [];
    expect(saved[saved.length - 1]).toMatchObject({
      freeThreshold: 3000,
      provinces: ["Metro Manila", "Cavite"],
    });
  });

  it("removes a method and persists the shorter list on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    await user.click(screen.getByRole("button", { name: `Remove ${DEFAULT_SHIPPING_METHODS[0].name}` }));
    await user.click(screen.getByRole("button", { name: /add shipping method/i }));
    const names = screen.getAllByLabelText("Name");
    const rates = screen.getAllByLabelText("Rate (₱)");
    await user.type(names[names.length - 1], "Backup Method");
    await user.type(rates[rates.length - 1], "50");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getShippingSettingsOverride().methods ?? [];
    expect(saved.find((m) => m.name === DEFAULT_SHIPPING_METHODS[0].name)).toBeUndefined();
  });

  it("blocks saving with an empty name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    const firstName = screen.getAllByLabelText("Name")[0];
    await user.clear(firstName);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(getShippingSettingsOverride().methods).toBeUndefined();
  });

  it("blocks saving with an invalid rate", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    const firstRate = screen.getAllByLabelText("Rate (₱)")[0];
    await user.clear(firstRate);
    await user.type(firstRate, "-5");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Enter a rate of 0 or more.")).toBeInTheDocument();
    expect(getShippingSettingsOverride().methods).toBeUndefined();
  });

  it("blocks saving down to zero methods", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    for (const method of DEFAULT_SHIPPING_METHODS) {
      await user.click(screen.getByRole("button", { name: `Remove ${method.name}` }));
    }
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Add at least one shipping method.")).toBeInTheDocument();
    expect(getShippingSettingsOverride().methods).toBeUndefined();
  });

  it("reset to defaults clears every override and restores the original list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShippingEditor />);

    const firstRate = screen.getAllByLabelText("Rate (₱)")[0];
    await user.clear(firstRate);
    await user.type(firstRate, "120");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getShippingSettingsOverride().methods?.[0]).toMatchObject({ rate: 120 });

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getShippingSettingsOverride()).toEqual({});
    const rates = screen.getAllByLabelText("Rate (₱)").map((el) => (el as HTMLInputElement).value);
    expect(rates).toEqual(DEFAULT_SHIPPING_METHODS.map((m) => String(m.rate)));
  });
});
