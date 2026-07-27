import { describe, expect, it } from "vitest";
import { getOrdersForUser, saveOrderForUser } from "@/lib/orders";
import type { Order } from "@/types/order";

function order(overrides: Partial<Order> = {}): Order {
  return {
    orderNumber: "CV-100000",
    placedAt: "2026-01-01T00:00:00.000Z",
    lines: [],
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    shipping: {
      fullName: "Jude",
      email: "jude@example.com",
      phone: "0950",
      address: "St",
      city: "City",
      province: "Province",
      zip: "1000",
      paymentMethod: "cod",
      notes: "",
    },
    ...overrides,
  };
}

describe("getOrdersForUser", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(getOrdersForUser("nobody@example.com")).toEqual([]);
  });

  it("returns [] instead of throwing on corrupt JSON", () => {
    window.localStorage.setItem("store-orders:bad@example.com", "{not json");
    expect(getOrdersForUser("bad@example.com")).toEqual([]);
  });

  it("returns [] when the stored value isn't an array", () => {
    window.localStorage.setItem("store-orders:odd@example.com", JSON.stringify({ not: "an array" }));
    expect(getOrdersForUser("odd@example.com")).toEqual([]);
  });
});

describe("saveOrderForUser", () => {
  it("saves and retrieves an order for a user", () => {
    const o = order({ orderNumber: "CV-111111" });
    saveOrderForUser("jude@example.com", o);
    expect(getOrdersForUser("jude@example.com")).toEqual([o]);
  });

  it("prepends new orders so the most recent comes first", () => {
    saveOrderForUser("jude@example.com", order({ orderNumber: "CV-000001" }));
    saveOrderForUser("jude@example.com", order({ orderNumber: "CV-000002" }));
    const orders = getOrdersForUser("jude@example.com");
    expect(orders.map((o) => o.orderNumber)).toEqual(["CV-000002", "CV-000001"]);
  });

  it("keys orders by lowercased email, so lookups are case-insensitive", () => {
    saveOrderForUser("Jude@Example.com", order());
    expect(getOrdersForUser("jude@example.com")).toHaveLength(1);
  });

  it("keeps each user's orders separate", () => {
    saveOrderForUser("a@example.com", order({ orderNumber: "CV-A" }));
    saveOrderForUser("b@example.com", order({ orderNumber: "CV-B" }));
    expect(getOrdersForUser("a@example.com")).toHaveLength(1);
    expect(getOrdersForUser("b@example.com")).toHaveLength(1);
  });
});
