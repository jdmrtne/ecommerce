import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { ProductDetail } from "@/pages/ProductDetail";
import { ALL_PRODUCTS } from "@/data/products";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { apiSaveProduct } from "@/lib/api/products";

const FIRST_PRODUCT = ALL_PRODUCTS[0];

function renderAt(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/shop/:id" element={<ProductDetail />} />
    </Routes>,
    [`/shop/${id}`],
  );
}

describe("ProductDetail", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("shows a loading state, then the product from the backend", async () => {
    renderAt(FIRST_PRODUCT.id);
    expect(screen.getByRole("status")).toBeInTheDocument();

    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });
  });

  it("shows a not-found state for an id that doesn't exist in the catalog", async () => {
    renderAt("does-not-exist");
    await screen.findByText(/product not found/i);
  });

  it("shows an error state with a retry action if the fetch fails", async () => {
    const original = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "products") {
        return {
          select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "network down" } }) }),
        } as never;
      }
      return original(table);
    }) as typeof fakeSupabase.from;

    renderAt(FIRST_PRODUCT.id);
    await screen.findByText(/couldn't load this product/i);

    fakeSupabase.from = original;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });
  });

  it("shows the real product image when one exists, and opens it uncropped in a lightbox on click", async () => {
    await fakeSupabase.from("products").upsert({
      id: FIRST_PRODUCT.id,
      name: FIRST_PRODUCT.name,
      category: FIRST_PRODUCT.category,
      price: FIRST_PRODUCT.price,
      rating: FIRST_PRODUCT.rating,
      tag: FIRST_PRODUCT.tag ?? null,
      created_at: FIRST_PRODUCT.createdAt,
      sales_rank: FIRST_PRODUCT.salesRank ?? null,
      stock: null,
      description: FIRST_PRODUCT.description,
      details: FIRST_PRODUCT.details,
      images: ["https://example.com/product.jpg"],
      variants: null,
      tags: null,
    });

    const user = userEvent.setup();
    renderAt(FIRST_PRODUCT.id);
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });

    const thumbnail = screen.getByRole("button", { name: `View full-size image of ${FIRST_PRODUCT.name}` });
    expect(thumbnail.querySelector("img")).toHaveAttribute("src", "https://example.com/product.jpg");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(thumbnail);
    const dialog = await screen.findByRole("dialog");
    const fullImage = dialog.querySelector("img");
    expect(fullImage).toHaveAttribute("src", "https://example.com/product.jpg");
    expect(fullImage).toHaveClass("object-contain");
  });

  it("falls back to the CraftIcon placeholder for a product with no image", async () => {
    renderAt(FIRST_PRODUCT.id);
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });
    expect(screen.queryByRole("button", { name: `View full-size image of ${FIRST_PRODUCT.name}` })).not.toBeInTheDocument();
  });

  it("shows a low-stock note and caps the quantity stepper at the real stock ceiling", async () => {
    await apiSaveProduct({ ...FIRST_PRODUCT, stock: 3 });
    const user = userEvent.setup();
    renderAt(FIRST_PRODUCT.id);
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });

    await screen.findByText("Only 3 left in stock");
    const increase = screen.getByRole("button", { name: `Increase quantity of ${FIRST_PRODUCT.name}` });
    await user.click(increase);
    await user.click(increase);
    // Now at 3 (the stock ceiling) - the increase button should be disabled.
    expect(increase).toBeDisabled();
  });

  it("disables Add to cart and shows 'Out of stock' when stock has hit 0", async () => {
    await apiSaveProduct({ ...FIRST_PRODUCT, stock: 0 });
    renderAt(FIRST_PRODUCT.id);
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });

    const outOfStockButton = await screen.findByRole("button", { name: "Out of stock" });
    expect(outOfStockButton).toBeDisabled();
  });

  it("allows adding to cart normally when stock is untracked", async () => {
    const user = userEvent.setup();
    renderAt(FIRST_PRODUCT.id);
    await screen.findByRole("heading", { name: FIRST_PRODUCT.name });

    const addButton = screen.getByRole("button", { name: "Add to cart" });
    expect(addButton).not.toBeDisabled();
    await user.click(addButton);
    await screen.findByText(/added .* to your cart/i);
  });
});
