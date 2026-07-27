import { beforeEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryManager } from "@/pages/admin/CategoryManager";
import { renderWithProviders } from "@/test/utils";
import { CATEGORIES } from "@/data/categories";
import { resolveAllCategories } from "@/lib/categoriesStore";

const FIRST_CATEGORY = CATEGORIES[0];

describe("CategoryManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sets the page title", () => {
    renderWithProviders(<CategoryManager />);
    expect(document.title).toContain("Category Manager");
  });

  it("lists every category from the catalog", () => {
    renderWithProviders(<CategoryManager />);
    expect(screen.getByText(`${CATEGORIES.length} categories`)).toBeInTheDocument();
    expect(screen.getByText(FIRST_CATEGORY.label)).toBeInTheDocument();
  });

  it("disables Reset to defaults until something has been overridden", () => {
    renderWithProviders(<CategoryManager />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled();
  });

  it("creates a new category end-to-end and persists it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />);

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: /add category/i });

    await user.type(within(dialog).getByLabelText("Name"), "Home Decor");
    await user.type(within(dialog).getByLabelText("Description"), "Cozy things for the home.");
    await user.click(within(dialog).getByRole("button", { name: /^add category$/i }));

    expect(screen.getByText("Home Decor")).toBeInTheDocument();
    expect(resolveAllCategories().some((c) => c.label === "Home Decor")).toBe(true);
  });

  it("blocks creating a category with no name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />);

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: /add category/i });
    await user.click(within(dialog).getByRole("button", { name: /^add category$/i }));

    expect(within(dialog).getByText("Category name is required.")).toBeInTheDocument();
    expect(resolveAllCategories()).toHaveLength(CATEGORIES.length);
  });

  it("edits an existing category and reflects the change in the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />);

    await user.click(screen.getByRole("button", { name: `Edit ${FIRST_CATEGORY.label}` }));
    const dialog = screen.getByRole("dialog", { name: /edit category/i });

    const nameInput = within(dialog).getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Category");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    const list = screen.getByTestId("category-list");
    expect(within(list).getByText("Renamed Category")).toBeInTheDocument();
    expect(within(list).queryByText(FIRST_CATEGORY.label)).not.toBeInTheDocument();
    expect(resolveAllCategories()).toHaveLength(CATEGORIES.length);
  });

  it("blocks deleting a category that still has products assigned", () => {
    renderWithProviders(<CategoryManager />);
    // Every seeded category has products assigned in the static catalog.
    const deleteButton = screen.getByRole("button", {
      name: new RegExp(`Can't delete ${FIRST_CATEGORY.label}`, "i"),
    });
    expect(deleteButton).toBeDisabled();
  });

  it("allows deleting a category with no products assigned, after confirming", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />);

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const createDialog = screen.getByRole("dialog", { name: /add category/i });
    await user.type(within(createDialog).getByLabelText("Name"), "Empty Category");
    await user.type(within(createDialog).getByLabelText("Description"), "Nothing here yet.");
    await user.click(within(createDialog).getByRole("button", { name: /^add category$/i }));

    await user.click(screen.getByRole("button", { name: "Delete Empty Category" }));
    const deleteDialog = screen.getByRole("dialog", { name: /delete category/i });
    await user.click(within(deleteDialog).getByRole("button", { name: /^delete$/i }));

    expect(within(screen.getByTestId("category-list")).queryByText("Empty Category")).not.toBeInTheDocument();
    expect(resolveAllCategories().some((c) => c.label === "Empty Category")).toBe(false);
  });

  it("reset to defaults clears every override and restores the full category list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />);

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: /add category/i });
    await user.type(within(dialog).getByLabelText("Name"), "Temp Category");
    await user.type(within(dialog).getByLabelText("Description"), "Temporary.");
    await user.click(within(dialog).getByRole("button", { name: /^add category$/i }));

    expect(screen.getByText(`${CATEGORIES.length + 1} categories`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(screen.getByText(`${CATEGORIES.length} categories`)).toBeInTheDocument();
    expect(within(screen.getByTestId("category-list")).getByText(FIRST_CATEGORY.label)).toBeInTheDocument();
  });
});
