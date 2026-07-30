import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { CheckoutPaymentReturn } from "@/pages/CheckoutPaymentReturn";
import { savePendingCardCheckout } from "@/lib/payments/pendingCheckout";
import { retrievePaymentIntent } from "@/lib/payments/paymongo";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { storageKey } from "@/config/branding";
import type { Order } from "@/types/order";

vi.mock("@/lib/payments/paymongo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/paymongo")>();
  return { ...actual, retrievePaymentIntent: vi.fn() };
});

// See Checkout.test.tsx for why this is mocked at the module boundary
// rather than left to hit a real /api/resend endpoint.
vi.mock("@/lib/notifications/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

const ORDER: Order = {
  orderNumber: "CV-123456",
  placedAt: "2026-01-01T00:00:00.000Z",
  lines: [{ productId: "p1", name: "Sample Tee", price: 250, quantity: 1 }],
  subtotal: 250,
  shippingFee: 80,
  total: 330,
  shipping: {
    fullName: "Jude Tambago",
    email: "jude@example.com",
    phone: "09501234567",
    address: "123 Test St",
    city: "Caloocan",
    province: "Metro Manila",
    zip: "1400",
    paymentMethod: "card",
    shippingMethodId: "standard",
    shippingMethodName: "Standard Shipping",
    notes: "",
  },
};

function TestApp() {
  return (
    <Routes>
      <Route path="/checkout/payment-return" element={<CheckoutPaymentReturn />} />
      <Route path="/order-confirmation" element={<p>Order confirmed</p>} />
      <Route path="/checkout" element={<p>Checkout page</p>} />
    </Routes>
  );
}

function seedCart() {
  window.localStorage.setItem(storageKey("cart"), JSON.stringify([{ productId: "p1", quantity: 1 }]));
}

describe("CheckoutPaymentReturn", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
    window.sessionStorage.clear();
    vi.mocked(retrievePaymentIntent).mockReset();
  });

  it("finishes placing the order once PayMongo confirms the payment succeeded", async () => {
    fakeSupabase.__signInAs({ id: "u1", email: "jude@example.com", name: "Jude Tambago", role: "customer" });
    seedCart();
    savePendingCardCheckout("pi_123", { order: ORDER, userEmail: "jude@example.com" });
    vi.mocked(retrievePaymentIntent).mockResolvedValue("succeeded");

    renderWithProviders(<TestApp />, ["/checkout/payment-return?intent_id=pi_123"]);

    await screen.findByText("Order confirmed");

    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(1);
    expect(window.localStorage.getItem(storageKey("cart"))).toBe("[]");

    const { data: notifications } = await fakeSupabase
      .from("notifications")
      .select("*")
      .eq("user_email", "jude@example.com")
      .order("created_at");
    expect(notifications).toHaveLength(1);
    expect((notifications as { order_number: string }[])[0].order_number).toBe("CV-123456");
  });

  it("does not write an order and shows an error when the payment did not succeed", async () => {
    savePendingCardCheckout("pi_123", { order: ORDER, userEmail: "jude@example.com" });
    vi.mocked(retrievePaymentIntent).mockResolvedValue("awaiting_payment_method");

    renderWithProviders(<TestApp />, ["/checkout/payment-return?intent_id=pi_123"]);

    await screen.findByText(/wasn't completed/);
    const { data } = await fakeSupabase.from("orders").select("*").eq("user_email", "jude@example.com").order("placed_at");
    expect(data).toHaveLength(0);
  });

  it("shows an error when there's no pending checkout data for the given intent id", async () => {
    vi.mocked(retrievePaymentIntent).mockResolvedValue("succeeded");

    renderWithProviders(<TestApp />, ["/checkout/payment-return?intent_id=pi_unknown"]);

    await screen.findByText(/couldn't find your order details/);
    expect(retrievePaymentIntent).not.toHaveBeenCalled();
  });

  it("shows an error when the URL has no intent id at all", async () => {
    renderWithProviders(<TestApp />, ["/checkout/payment-return"]);

    await screen.findByText(/couldn't find your payment details/);
  });

  it("shows a dead-end message instead of a retryable error when the payment succeeded but saving the order failed", async () => {
    fakeSupabase.__signInAs({ id: "u1", email: "jude@example.com", name: "Jude Tambago", role: "customer" });
    savePendingCardCheckout("pi_123", { order: ORDER, userEmail: "jude@example.com" });
    vi.mocked(retrievePaymentIntent).mockResolvedValue("succeeded");
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "orders") {
        return { insert: () => Promise.resolve({ data: null, error: { message: "insert denied" } }) } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    renderWithProviders(<TestApp />, ["/checkout/payment-return?intent_id=pi_123"]);

    await screen.findByText(/successful, but we ran into a problem recording your order/);
    expect(screen.getByText(/CV-123456/)).toBeInTheDocument();
    expect(screen.queryByText("Order confirmed")).not.toBeInTheDocument();

    fakeSupabase.from = originalFrom;
  });
});
