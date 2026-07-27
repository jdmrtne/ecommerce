import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavigationEditor } from "@/pages/admin/NavigationEditor";
import { renderWithProviders } from "@/test/utils";
import { MAIN_NAV } from "@/config/navigation";
import { getNavigationSettingsOverride } from "@/lib/navigationSettingsStore";

describe("NavigationEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<NavigationEditor />);
    expect(document.title).toContain("Navigation Editor");
  });

  it("prefills the form from MAIN_NAV", () => {
    renderWithProviders(<NavigationEditor />);
    const labels = screen.getAllByLabelText("Label").map((el) => (el as HTMLInputElement).value);
    const links = screen.getAllByLabelText("Link").map((el) => (el as HTMLInputElement).value);
    expect(labels).toEqual(MAIN_NAV.map((l) => l.label));
    expect(links).toEqual(MAIN_NAV.map((l) => l.to));
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<NavigationEditor />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("saves an edited label to localStorage and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    const firstLabel = screen.getAllByLabelText("Label")[0];
    await user.clear(firstLabel);
    await user.type(firstLabel, "Shop All");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(getNavigationSettingsOverride().links?.[0]).toEqual({ label: "Shop All", to: MAIN_NAV[0].to });
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("adds a new link and persists it on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    await user.click(screen.getByRole("button", { name: /add link/i }));
    const labels = screen.getAllByLabelText("Label");
    const links = screen.getAllByLabelText("Link");
    await user.type(labels[labels.length - 1], "Journal");
    await user.type(links[links.length - 1], "/journal");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getNavigationSettingsOverride().links ?? [];
    expect(saved).toHaveLength(MAIN_NAV.length + 1);
    expect(saved[saved.length - 1]).toEqual({ label: "Journal", to: "/journal" });
  });

  it("removes a link and persists the shorter list on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    await user.click(screen.getByRole("button", { name: `Remove ${MAIN_NAV[0].label}` }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getNavigationSettingsOverride().links ?? [];
    expect(saved).toHaveLength(MAIN_NAV.length - 1);
    expect(saved.find((l) => l.label === MAIN_NAV[0].label)).toBeUndefined();
  });

  it("reorders a link down and persists the new order on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    await user.click(screen.getByRole("button", { name: `Move ${MAIN_NAV[0].label} down` }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    const saved = getNavigationSettingsOverride().links ?? [];
    expect(saved[0].label).toBe(MAIN_NAV[1].label);
    expect(saved[1].label).toBe(MAIN_NAV[0].label);
  });

  it("blocks saving with an empty label", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    const firstLabel = screen.getAllByLabelText("Label")[0];
    await user.clear(firstLabel);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Label is required.")).toBeInTheDocument();
    expect(getNavigationSettingsOverride().links).toBeUndefined();
  });

  it("blocks saving down to zero links", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    for (const link of MAIN_NAV) {
      await user.click(screen.getByRole("button", { name: `Remove ${link.label}` }));
    }
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Add at least one nav link.")).toBeInTheDocument();
    expect(getNavigationSettingsOverride().links).toBeUndefined();
  });

  it("reset to defaults clears every override and restores the original list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationEditor />);

    const firstLabel = screen.getAllByLabelText("Label")[0];
    await user.clear(firstLabel);
    await user.type(firstLabel, "Shop All");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(getNavigationSettingsOverride().links?.[0].label).toBe("Shop All");

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getNavigationSettingsOverride()).toEqual({});
    const labels = screen.getAllByLabelText("Label").map((el) => (el as HTMLInputElement).value);
    expect(labels).toEqual(MAIN_NAV.map((l) => l.label));
  });
});
