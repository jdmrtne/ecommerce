import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductManager } from "@/pages/admin/ProductManager";
import { renderWithProviders } from "@/test/utils";
import { ALL_PRODUCTS } from "@/data/products";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { apiGetProducts } from "@/lib/api/products";

const FIRST_PRODUCT = ALL_PRODUCTS[0];

describe("ProductManager", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("sets the page title", () => {
    renderWithProviders(<ProductManager />);
    expect(document.title).toContain("Product Manager");
  });

  it("shows a loading state, then lists every product from the catalog", async () => {
    renderWithProviders(<ProductManager />);
    expect(screen.getByTestId("product-list").querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);

    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);
    expect(screen.getByText(FIRST_PRODUCT.name)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.type(screen.getByLabelText("Search products"), FIRST_PRODUCT.id);
    expect(screen.getByText(`1 of ${ALL_PRODUCTS.length} products`)).toBeInTheDocument();
    expect(screen.getByText(FIRST_PRODUCT.name)).toBeInTheDocument();
  });

  it("filters the list by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.selectOptions(screen.getByLabelText("Filter by category"), FIRST_PRODUCT.category);
    const expectedCount = ALL_PRODUCTS.filter((p) => p.category === FIRST_PRODUCT.category).length;
    expect(screen.getByText(`${expectedCount} of ${ALL_PRODUCTS.length} products`)).toBeInTheDocument();
  });

  it("creates a new product end-to-end and persists it to the backend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.click(screen.getByRole("button", { name: /add product/i }));
    const dialog = screen.getByRole("dialog", { name: /add product/i });

    await user.type(within(dialog).getByLabelText("Name"), "Handmade Mug");
    await user.clear(within(dialog).getByLabelText("Price (PHP)"));
    await user.type(within(dialog).getByLabelText("Price (PHP)"), "450");
    await user.clear(within(dialog).getByLabelText("Description"));
    await user.type(within(dialog).getByLabelText("Description"), "A cozy handmade mug.");
    await user.click(within(dialog).getByRole("button", { name: /^add product$/i }));

    await screen.findByText("Handmade Mug");
    expect(screen.getByText(`${ALL_PRODUCTS.length + 1} of ${ALL_PRODUCTS.length + 1} products`)).toBeInTheDocument();

    const backendProducts = await apiGetProducts();
    expect(backendProducts.some((p) => p.name === "Handmade Mug")).toBe(true);
  });

  it("blocks creating a product with no name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.click(screen.getByRole("button", { name: /add product/i }));
    const dialog = screen.getByRole("dialog", { name: /add product/i });
    await user.click(within(dialog).getByRole("button", { name: /^add product$/i }));

    expect(within(dialog).getByText("Product name is required.")).toBeInTheDocument();
    const backendProducts = await apiGetProducts();
    expect(backendProducts).toHaveLength(ALL_PRODUCTS.length);
  });

  it("edits an existing product and reflects the change in the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.click(screen.getByRole("button", { name: `Edit ${FIRST_PRODUCT.name}` }));
    const dialog = screen.getByRole("dialog", { name: /edit product/i });

    const nameInput = within(dialog).getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Product");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    const list = screen.getByTestId("product-list");
    await waitFor(() => expect(within(list).getByText("Renamed Product")).toBeInTheDocument());
    expect(within(list).queryByText(FIRST_PRODUCT.name)).not.toBeInTheDocument();

    const backendProducts = await apiGetProducts();
    expect(backendProducts).toHaveLength(ALL_PRODUCTS.length);
  });

  it("deletes a product after confirming", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductManager />);
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);

    await user.click(screen.getByRole("button", { name: `Delete ${FIRST_PRODUCT.name}` }));
    const dialog = screen.getByRole("dialog", { name: /delete product/i });
    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    const list = screen.getByTestId("product-list");
    await waitFor(() => expect(within(list).queryByText(FIRST_PRODUCT.name)).not.toBeInTheDocument());

    const backendProducts = await apiGetProducts();
    expect(backendProducts).toHaveLength(ALL_PRODUCTS.length - 1);
  });

  it("shows an error state with a retry action if the catalog fails to load", async () => {
    const original = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "products") {
        return { select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "network down" } }) }) } as never;
      }
      return original(table);
    }) as typeof fakeSupabase.from;

    renderWithProviders(<ProductManager />);
    await screen.findByText(/couldn't load the catalog/i);

    fakeSupabase.from = original;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByText(`${ALL_PRODUCTS.length} of ${ALL_PRODUCTS.length} products`);
  });
});
