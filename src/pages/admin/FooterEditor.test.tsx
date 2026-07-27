import { beforeEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FooterEditor } from "@/pages/admin/FooterEditor";
import { renderWithProviders } from "@/test/utils";
import { FOOTER_LINK_GROUPS } from "@/config/navigation";
import { branding } from "@/config/branding";
import { getFooterSettingsOverride } from "@/lib/footerSettingsStore";
import { getStoreSettingsOverride } from "@/lib/storeSettingsStore";

describe("FooterEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<FooterEditor />);
    expect(document.title).toContain("Footer Editor");
  });

  it("prefills the form from FOOTER_LINK_GROUPS and the default copyright name", () => {
    renderWithProviders(<FooterEditor />);

    const titles = screen.getAllByLabelText("Column title").map((el) => (el as HTMLInputElement).value);
    expect(titles).toEqual(FOOTER_LINK_GROUPS.map((g) => g.title));

    const allLabels = FOOTER_LINK_GROUPS.flatMap((g) => g.links.map((l) => l.label));
    const labels = screen.getAllByLabelText("Label").map((el) => (el as HTMLInputElement).value);
    expect(labels).toEqual(allLabels);

    expect(screen.getByLabelText("Copyright name")).toHaveValue(branding.copyrightHolder);
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<FooterEditor />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("saves an edited column title and copyright line, and shows a confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    const firstTitle = screen.getAllByLabelText("Column title")[0];
    await user.clear(firstTitle);
    await user.type(firstTitle, "Store");

    const copyright = screen.getByLabelText("Copyright name");
    await user.clear(copyright);
    await user.type(copyright, "Acme Co");

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const override = getFooterSettingsOverride();
    expect(override.groups?.[0].title).toBe("Store");
    expect(override.copyrightHolder).toBe("Acme Co");
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(/saved/i);
  });

  it("adds a new column with a link and persists it on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const titles = screen.getAllByLabelText("Column title");
    await user.type(titles[titles.length - 1], "Legal");

    // The new empty column needs a link added before it can be saved.
    const addLinkButtons = screen.getAllByRole("button", { name: /add link/i });
    await user.click(addLinkButtons[addLinkButtons.length - 1]);

    const labels = screen.getAllByLabelText("Label");
    const links = screen.getAllByLabelText("Link");
    await user.type(labels[labels.length - 1], "Terms");
    await user.type(links[links.length - 1], "/policies/terms");

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const savedGroups = getFooterSettingsOverride().groups ?? [];
    expect(savedGroups).toHaveLength(FOOTER_LINK_GROUPS.length + 1);
    expect(savedGroups[savedGroups.length - 1]).toEqual({
      title: "Legal",
      links: [{ label: "Terms", to: "/policies/terms" }],
    });
  });

  it("removes a column and persists the shorter list on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    await user.click(screen.getByRole("button", { name: `Remove ${FOOTER_LINK_GROUPS[0].title}` }));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const saved = getFooterSettingsOverride().groups ?? [];
    expect(saved).toHaveLength(FOOTER_LINK_GROUPS.length - 1);
    expect(saved.find((g) => g.title === FOOTER_LINK_GROUPS[0].title)).toBeUndefined();
  });

  it("reorders a column down and persists the new order on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    await user.click(screen.getByRole("button", { name: `Move ${FOOTER_LINK_GROUPS[0].title} down` }));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const saved = getFooterSettingsOverride().groups ?? [];
    expect(saved[0].title).toBe(FOOTER_LINK_GROUPS[1].title);
    expect(saved[1].title).toBe(FOOTER_LINK_GROUPS[0].title);
  });

  it("blocks saving with an empty column title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    const firstTitle = screen.getAllByLabelText("Column title")[0];
    await user.clear(firstTitle);
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Column title is required.")).toBeInTheDocument();
    expect(getFooterSettingsOverride().groups).toBeUndefined();
  });

  it("blocks saving a column with a title but zero links", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const titles = screen.getAllByLabelText("Column title");
    await user.type(titles[titles.length - 1], "Empty Column");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Add at least one link, or remove this column.")).toBeInTheDocument();
    expect(getFooterSettingsOverride().groups).toBeUndefined();
  });

  it("blocks saving an empty copyright name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    const copyright = screen.getByLabelText("Copyright name");
    await user.clear(copyright);
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Copyright name is required.")).toBeInTheDocument();
    expect(getFooterSettingsOverride().copyrightHolder).toBeUndefined();
  });

  it("reset to defaults clears the override and restores the original groups and copyright", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    const copyright = screen.getByLabelText("Copyright name");
    await user.clear(copyright);
    await user.type(copyright, "Acme Co");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));
    expect(getFooterSettingsOverride().copyrightHolder).toBe("Acme Co");

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(getFooterSettingsOverride()).toEqual({});
    expect(screen.getByLabelText("Copyright name")).toHaveValue(branding.copyrightHolder);
    const titles = screen.getAllByLabelText("Column title").map((el) => (el as HTMLInputElement).value);
    expect(titles).toEqual(FOOTER_LINK_GROUPS.map((g) => g.title));
  });

  it("edits social links through the same Store Settings override Store Settings itself uses", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FooterEditor />);

    const socialCard = screen.getByText("Social links").closest("div")!.parentElement!;
    const facebookInput = within(socialCard).getByLabelText("Facebook URL");
    await user.clear(facebookInput);
    await user.type(facebookInput, "https://facebook.com/acme");
    await user.click(screen.getByRole("button", { name: /save social links/i }));

    expect(getStoreSettingsOverride().social?.facebook).toBe("https://facebook.com/acme");
    // Editing social links never touches the Footer Editor's own override.
    expect(getFooterSettingsOverride().groups).toBeUndefined();
    expect(getFooterSettingsOverride().copyrightHolder).toBeUndefined();
  });
});
