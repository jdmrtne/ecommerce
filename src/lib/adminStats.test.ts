import { beforeEach, describe, expect, it } from "vitest";
import { getAdminStats } from "@/lib/adminStats";
import { writeUsers } from "@/lib/userStore";
import { saveOrderForUser } from "@/lib/orders";
import { ALL_PRODUCTS, CATEGORIES } from "@/data/products";
import { COLLECTIONS } from "@/data/collections";
import type { Order } from "@/types/order";

function order(orderNumber: string): Order {
  return {
    orderNumber,
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
  };
}

describe("getAdminStats", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reports live catalog/content counts matching the underlying data", () => {
    const stats = getAdminStats();
    expect(stats.productCount).toBe(ALL_PRODUCTS.length);
    expect(stats.categoryCount).toBe(CATEGORIES.length);
    expect(stats.collectionCount).toBe(COLLECTIONS.length);
    expect(stats.activePresetId).toBeTruthy();
    expect(stats.activeHomeLayout).toBeTruthy();
  });

  it("counts only customer-role accounts, excluding the seeded admin", () => {
    writeUsers({
      "admin@example.com": { name: "Admin", email: "admin@example.com", password: "x", role: "admin" },
      "a@example.com": { name: "A", email: "a@example.com", password: "x", role: "customer" },
      "b@example.com": { name: "B", email: "b@example.com", password: "x", role: "customer" },
    });
    expect(getAdminStats().customerCount).toBe(2);
  });

  it("sums orders across every registered account", () => {
    writeUsers({
      "a@example.com": { name: "A", email: "a@example.com", password: "x", role: "customer" },
      "b@example.com": { name: "B", email: "b@example.com", password: "x", role: "customer" },
    });
    saveOrderForUser("a@example.com", order("CV-1"));
    saveOrderForUser("a@example.com", order("CV-2"));
    saveOrderForUser("b@example.com", order("CV-3"));
    expect(getAdminStats().orderCount).toBe(3);
  });
});
