import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  placeOrder,
  validateCheckout,
} from "@/lib/checkout";
import type { CartLine } from "@/context/CartContext";
import type { CheckoutFormData } from "@/types/order";
import type { Product } from "@/types/product";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Sample Product",
    category: "category-a",
    price: 250,
    rating: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "A test product.",
    ...overrides,
  };
}

const VALID_SHIPPING: CheckoutFormData = {
  fullName: "Jude Tambago",
  email: "jude@example.com",
  phone: "09501234567",
  address: "123 Test St",
  city: "Caloocan",
  province: "Metro Manila",
  zip: "1400",
  paymentMethod: "cod",
  notes: "",
};

describe("validateCheckout", () => {
  it("returns no errors for a fully valid form", () => {
    expect(validateCheckout(VALID_SHIPPING)).toEqual({});
  });

  it("flags every required field when blank", () => {
    const errors = validateCheckout({
      ...VALID_SHIPPING,
      fullName: "  ",
      email: "bad-email",
      phone: "",
      address: "",
      city: "",
      province: "",
      zip: "",
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["fullName", "email", "phone", "address", "city", "province", "zip"].sort(),
    );
  });

  it("does not require the notes field", () => {
    expect(validateCheckout(VALID_SHIPPING).notes).toBeUndefined();
  });
});

describe("placeOrder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("charges the standard shipping fee below the free-shipping threshold", async () => {
    const lines: CartLine[] = [{ productId: "p1", quantity: 2, product: product({ price: 250 }) }];
    const subtotal = 500;
    const promise = placeOrder(VALID_SHIPPING, lines, subtotal);
    await vi.runAllTimersAsync();
    const order = await promise;

    expect(order.subtotal).toBe(500);
    expect(order.shippingFee).toBe(SHIPPING_FEE);
    expect(order.total).toBe(500 + SHIPPING_FEE);
    expect(order.orderNumber).toMatch(/^CV-\d{6}$/);
    expect(order.lines).toEqual([
      { productId: "p1", name: "Sample Product", price: 250, quantity: 2 },
    ]);
  });

  it("waives shipping at or above the free-shipping threshold", async () => {
    const lines: CartLine[] = [
      { productId: "p1", quantity: 1, product: product({ price: FREE_SHIPPING_THRESHOLD }) },
    ];
    const promise = placeOrder(VALID_SHIPPING, lines, FREE_SHIPPING_THRESHOLD);
    await vi.runAllTimersAsync();
    const order = await promise;

    expect(order.shippingFee).toBe(0);
    expect(order.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("carries the shipping details through to the order", async () => {
    const promise = placeOrder(VALID_SHIPPING, [], 0);
    await vi.runAllTimersAsync();
    const order = await promise;
    expect(order.shipping).toEqual(VALID_SHIPPING);
  });
});
