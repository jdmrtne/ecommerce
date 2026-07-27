import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PolicyEditor } from "@/pages/admin/PolicyEditor";
import { renderWithProviders } from "@/test/utils";
import { POLICY_PAGES } from "@/content/policies";
import { getPolicySettingsOverride } from "@/lib/policySettingsStore";

describe("PolicyEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<PolicyEditor />);
    expect(document.title).toContain("Policy Editor");
  });

  it("prefills the form from the Privacy policy by default", () => {
    renderWithProviders(<PolicyEditor />);

    expect(screen.getByLabelText("Title")).toHaveValue(POLICY_PAGES.privacy.title);
    expect(screen.getByLabelText("Last updated")).toHaveValue(POLICY_PAGES.privacy.lastUpdated);

    const headings = screen.getAllByLabelText("Heading").map((el) => (el as HTMLInputElement).value);
    expect(headings).toEqual(POLICY_PAGES.privacy.sections.map((s) => s.heading));
  });

  it("switches to another policy's content when its tab is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    await user.click(screen.getByRole("button", { name: "Terms" }));

    expect(screen.getByLabelText("Title")).toHaveValue(POLICY_PAGES.terms.title);
  });

  it("disables both reset buttons until something has been overridden", () => {
    renderWithProviders(<PolicyEditor />);
    expect(screen.getByRole("button", { name: /reset all policies/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reset this policy/i })).toBeDisabled();
  });

  it("saves an edited title and shows a confirmation, without touching other policies", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Our Privacy Promise");

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const override = getPolicySettingsOverride();
    expect(override.privacy?.title).toBe("Our Privacy Promise");
    expect(override.terms).toBeUndefined();
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("adds a new section and persists it on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    await user.click(screen.getByRole("button", { name: /add section/i }));

    const headings = screen.getAllByLabelText("Heading");
    const bodies = screen.getAllByLabelText("Body");
    await user.type(headings[headings.length - 1], "Cookies");
    await user.type(bodies[bodies.length - 1], "We use cookies to keep your cart in sync.");

    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const saved = getPolicySettingsOverride().privacy?.sections ?? [];
    expect(saved).toHaveLength(POLICY_PAGES.privacy.sections.length + 1);
    expect(saved[saved.length - 1]).toEqual({
      heading: "Cookies",
      body: "We use cookies to keep your cart in sync.",
    });
  });

  it("removes a section and persists the shorter list on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const firstHeading = POLICY_PAGES.privacy.sections[0].heading;
    await user.click(screen.getByRole("button", { name: `Remove ${firstHeading}` }));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const saved = getPolicySettingsOverride().privacy?.sections ?? [];
    expect(saved).toHaveLength(POLICY_PAGES.privacy.sections.length - 1);
    expect(saved.find((s) => s.heading === firstHeading)).toBeUndefined();
  });

  it("reorders a section down and persists the new order on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const [first, second] = POLICY_PAGES.privacy.sections;
    await user.click(screen.getByRole("button", { name: `Move ${first.heading} down` }));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    const saved = getPolicySettingsOverride().privacy?.sections ?? [];
    expect(saved[0].heading).toBe(second.heading);
    expect(saved[1].heading).toBe(first.heading);
  });

  it("blocks saving with an empty title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(getPolicySettingsOverride().privacy).toBeUndefined();
  });

  it("blocks saving with an empty last-updated date", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    await user.clear(screen.getByLabelText("Last updated"));
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Last updated date is required.")).toBeInTheDocument();
    expect(getPolicySettingsOverride().privacy).toBeUndefined();
  });

  it("blocks saving a section with a heading but empty body", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const bodies = screen.getAllByLabelText("Body");
    await user.clear(bodies[0]);
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Body text is required.")).toBeInTheDocument();
    expect(getPolicySettingsOverride().privacy).toBeUndefined();
  });

  it("blocks saving a policy with zero sections", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    for (const heading of POLICY_PAGES.privacy.sections.map((s) => s.heading)) {
      await user.click(screen.getByRole("button", { name: `Remove ${heading}` }));
    }
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(screen.getByText("Add at least one section.")).toBeInTheDocument();
    expect(getPolicySettingsOverride().privacy).toBeUndefined();
  });

  it("reset this policy clears only the active slug's override and restores its original content", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Changed");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));
    expect(getPolicySettingsOverride().privacy?.title).toBe("Changed");

    await user.click(screen.getByRole("button", { name: /reset this policy/i }));

    expect(getPolicySettingsOverride().privacy).toBeUndefined();
    expect(screen.getByLabelText("Title")).toHaveValue(POLICY_PAGES.privacy.title);
  });

  it("reset all policies clears every slug's override", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyEditor />);

    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Changed");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    await user.click(screen.getByRole("button", { name: "Terms" }));
    const termsTitle = screen.getByLabelText("Title");
    await user.clear(termsTitle);
    await user.type(termsTitle, "Changed Terms");
    await user.click(screen.getByRole("button", { name: /^save changes$/i }));

    expect(getPolicySettingsOverride().privacy).toBeDefined();
    expect(getPolicySettingsOverride().terms).toBeDefined();

    await user.click(screen.getByRole("button", { name: /reset all policies/i }));

    expect(getPolicySettingsOverride()).toEqual({});
  });
});
