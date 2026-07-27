import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { Checkout } from "@/pages/Checkout";
import { ALL_PRODUCTS } from "@/data/products";
import { storageKey } from "@/config/branding";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

const [PRODUCT_A] = ALL_PRODUCTS;

const PROFILE = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };

function seedCart() {
  window.localStorage.setItem(storageKey("cart"), JSON.stringify([{ productId: PRODUCT_A.id, quantity: 1 }]));
}

function TestApp() {
  return (
    <Routes>
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation" element={<p>Order confirmed</p>} />
      <Route path="/cart" element={<p>Cart page</p>} />
    </Routes>
  );
}

// Full name/email are typed explicitly in every test rather than relying
// on Checkout's account pre-fill, since that pre-fill reads `useAuth()`'s
// `user` at first render - before AuthProvider's async session check has
// necessarily resolved (a pre-existing, unrelated timing gap documented
// in MASTER_HANDOFF.md Known Issues, not something this phase changes).
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, name: string, email: string) {
  await user.type(screen.getByLabelText("Full name"), name);
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Phone number"), "09501234567");
  await user.type(screen.getByLabelText("Street address"), "123 Test St");
  await user.type(screen.getByLabelText("City"), "Caloocan");
  await user.type(screen.getByLabelText("Province"), "Metro Manila");
  await user.type(screen.getByLabelText("ZIP code"), "1400");
}

describe("Checkout", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
    seedCart();
  });

  it("writes a real order via the API for a signed-in checkout and navigates to the confirmation page", async () => {
    fakeSupabase.__signInAs(PROFILE);
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText("Order confirmed");

    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(1);
  });

  it("shows an inline error and does not navigate away when the order write fails", async () => {
    fakeSupabase.__signInAs(PROFILE);
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "orders") {
        return { insert: () => Promise.resolve({ data: null, error: { message: "insert denied" } }) } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText("insert denied");
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();

    fakeSupabase.from = originalFrom;
  });

  it("does not write to the backend for a guest checkout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Guest Shopper", "guest@example.com");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText("Order confirmed");

    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "guest@example.com").order("placed_at");
    expect(data).toHaveLength(0);
  });
});
