import { afterEach, describe, expect, it } from "vitest";
import { clearPendingCardCheckout, loadPendingCardCheckout, savePendingCardCheckout } from "@/lib/payments/pendingCheckout";
import type { Order } from "@/types/order";

const ORDER: Order = {
  orderNumber: "CV-123456",
  placedAt: "2026-01-01T00:00:00.000Z",
  lines: [{ productId: "p1", name: "Sample", price: 250, quantity: 1 }],
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

describe("pendingCheckout", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips a saved pending checkout by payment intent id", () => {
    savePendingCardCheckout("pi_123", { order: ORDER, userEmail: "jude@example.com" });
    expect(loadPendingCardCheckout("pi_123")).toEqual({ order: ORDER, userEmail: "jude@example.com" });
  });

  it("supports a null userEmail for guest checkouts", () => {
    savePendingCardCheckout("pi_456", { order: ORDER, userEmail: null });
    expect(loadPendingCardCheckout("pi_456")).toEqual({ order: ORDER, userEmail: null });
  });

  it("returns null for an unknown or already-cleared intent id", () => {
    expect(loadPendingCardCheckout("pi_does_not_exist")).toBeNull();
  });

  it("keeps different intent ids from colliding", () => {
    savePendingCardCheckout("pi_a", { order: ORDER, userEmail: "a@example.com" });
    savePendingCardCheckout("pi_b", { order: { ...ORDER, orderNumber: "CV-999999" }, userEmail: "b@example.com" });

    expect(loadPendingCardCheckout("pi_a")?.userEmail).toBe("a@example.com");
    expect(loadPendingCardCheckout("pi_b")?.userEmail).toBe("b@example.com");
  });

  it("removes the entry on clear", () => {
    savePendingCardCheckout("pi_123", { order: ORDER, userEmail: null });
    clearPendingCardCheckout("pi_123");
    expect(loadPendingCardCheckout("pi_123")).toBeNull();
  });
});
