import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { Cart } from "@/pages/Cart";
import { ALL_PRODUCTS } from "@/data/products";
import { storageKey } from "@/config/branding";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { apiSaveProduct } from "@/lib/api/products";

const [PRODUCT_A] = ALL_PRODUCTS;

function seedCart(quantity: number) {
  window.localStorage.setItem(storageKey("cart"), JSON.stringify([{ productId: PRODUCT_A.id, quantity }]));
}

function TestApp() {
  return (
    <Routes>
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<p>Checkout page</p>} />
    </Routes>
  );
}

describe("Cart", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("shows a low-stock note when live stock is at or under the threshold", async () => {
    await apiSaveProduct({ ...PRODUCT_A, stock: 3 });
    seedCart(1);
    renderWithProviders(<TestApp />, ["/cart"]);

    await screen.findByText(PRODUCT_A.name);
    await screen.findByText("Only 3 left in stock");
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).not.toBeDisabled();
  });

  it("flags a line that already exceeds live stock and disables checkout", async () => {
    await apiSaveProduct({ ...PRODUCT_A, stock: 1 });
    seedCart(2);
    renderWithProviders(<TestApp />, ["/cart"]);

    await screen.findByText(PRODUCT_A.name);
    await screen.findByText("Only 1 available - please lower the quantity");
    expect(screen.getByText("Update the quantities above before checking out.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).toBeDisabled();
  });

  it("shows 'Out of stock' and disables checkout when live stock has hit 0", async () => {
    await apiSaveProduct({ ...PRODUCT_A, stock: 0 });
    seedCart(1);
    renderWithProviders(<TestApp />, ["/cart"]);

    await screen.findByText(PRODUCT_A.name);
    await screen.findByText("Out of stock");
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).toBeDisabled();
  });

  it("allows checkout when stock is untracked (no stock set on the product)", async () => {
    seedCart(1);
    renderWithProviders(<TestApp />, ["/cart"]);

    await screen.findByText(PRODUCT_A.name);
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).not.toBeDisabled();
  });
});
