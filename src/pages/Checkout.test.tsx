import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { Checkout } from "@/pages/Checkout";
import { ALL_PRODUCTS } from "@/data/products";
import { storageKey } from "@/config/branding";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { apiSaveProduct } from "@/lib/api/products";
import { attachPaymentMethod, createPaymentIntent, createPaymentMethod, redirectToPaymentAuth } from "@/lib/payments/paymongo";

// Card payments are processed against the real PayMongo API in
// production (see lib/payments/paymongo.ts) - mocked here at the module
// boundary so these tests never make a real network call, per Phase 31's
// completion criteria ("payment provider mocked in tests").
vi.mock("@/lib/payments/paymongo", () => ({
  createPaymentMethod: vi.fn(),
  createPaymentIntent: vi.fn(),
  attachPaymentMethod: vi.fn(),
  redirectToPaymentAuth: vi.fn(),
}));

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

async function fillCardFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("radio", { name: /Credit \/ Debit Card/ }));
  await user.type(screen.getByLabelText("Card number"), "4343434343434345");
  await user.type(screen.getByLabelText("Name on card"), "Jude Tambago");
  await user.type(screen.getByLabelText("Exp. month"), "12");
  await user.type(screen.getByLabelText("Exp. year"), String(new Date().getFullYear() + 2));
  await user.type(screen.getByLabelText("CVC"), "123");
}

describe("Checkout", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
    seedCart();
    vi.mocked(createPaymentMethod).mockReset();
    vi.mocked(createPaymentIntent).mockReset();
    vi.mocked(attachPaymentMethod).mockReset();
    vi.mocked(redirectToPaymentAuth).mockReset();
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

  it("blocks submission and shows an itemized error when a cart line now exceeds live stock", async () => {
    await apiSaveProduct({ ...PRODUCT_A, stock: 0 });

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("no longer available in the quantity you selected");
    expect(alert.textContent).toContain(PRODUCT_A.name);
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();

    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(0);
  });

  it("places the order normally when stock is sufficient", async () => {
    await apiSaveProduct({ ...PRODUCT_A, stock: 5 });

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText("Order confirmed");
  });

  it("processes a card payment via PayMongo and places the order when it succeeds immediately", async () => {
    fakeSupabase.__signInAs(PROFILE);
    vi.mocked(createPaymentMethod).mockResolvedValue("pm_123");
    vi.mocked(createPaymentIntent).mockResolvedValue({ id: "pi_123" });
    vi.mocked(attachPaymentMethod).mockResolvedValue({ status: "succeeded", nextActionUrl: null });

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await fillCardFields(user);
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText("Order confirmed");

    expect(createPaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({ number: "4343434343434345", name: "Jude Tambago", expMonth: 12, cvc: "123" }),
    );
    expect(attachPaymentMethod).toHaveBeenCalledWith("pi_123", "pm_123", expect.stringContaining("/checkout/payment-return"));
    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(1);
  });

  it("sends the shopper to PayMongo's 3D Secure page and does not place the order yet when authentication is required", async () => {
    fakeSupabase.__signInAs(PROFILE);
    vi.mocked(createPaymentMethod).mockResolvedValue("pm_123");
    vi.mocked(createPaymentIntent).mockResolvedValue({ id: "pi_123" });
    vi.mocked(attachPaymentMethod).mockResolvedValue({ status: "awaiting_next_action", nextActionUrl: "https://paymongo.test/3ds" });

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await fillCardFields(user);
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await vi.waitFor(() => expect(redirectToPaymentAuth).toHaveBeenCalledWith("https://paymongo.test/3ds"));

    // No real navigation happens in the test (redirectToPaymentAuth is
    // mocked), so the order must not have been written yet - it's only
    // built and saved to sessionStorage, finished later by
    // CheckoutPaymentReturn once PayMongo confirms the charge.
    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  });

  it("shows an inline error and does not navigate away when PayMongo declines the card", async () => {
    vi.mocked(createPaymentMethod).mockResolvedValue("pm_123");
    vi.mocked(createPaymentIntent).mockResolvedValue({ id: "pi_123" });
    vi.mocked(attachPaymentMethod).mockResolvedValue({ status: "awaiting_payment_method", nextActionUrl: null });

    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await fillCardFields(user);
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByText(/could not be charged/);
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  });

  it("validates the card fields client-side and never calls PayMongo for an obviously invalid card", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/checkout"]);

    await screen.findByRole("heading", { name: "Checkout" });
    await fillRequiredFields(user, "Jude Tambago", "jude@example.com");
    await user.click(screen.getByRole("radio", { name: /Credit \/ Debit Card/ }));
    await user.type(screen.getByLabelText("Card number"), "123");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Enter a valid card number.")).toBeInTheDocument();
    expect(createPaymentMethod).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  });
});
