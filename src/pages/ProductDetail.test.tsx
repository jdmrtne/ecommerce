import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { ProductDetail } from "@/pages/ProductDetail";
import { ALL_PRODUCTS } from "@/data/products";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

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
});
