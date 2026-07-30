import { describe, expect, it } from "vitest";
import { apiGetOrdersForUser, apiSaveOrderForUser } from "@/lib/api/orders";
import { chainableResult, createMockSupabaseClient } from "@/test/mockSupabaseClient";
import type { OrderRow } from "@/lib/api/types";
import type { Order } from "@/types/order";

const ROW: OrderRow = {
  order_number: "CVE-0001",
  user_email: "jude@example.com",
  placed_at: "2026-01-01T00:00:00.000Z",
  lines: [{ productId: "prod-1", name: "Woven Basket", price: 450, quantity: 1 }],
  subtotal: 450,
  shipping_fee: 60,
  total: 510,
  shipping: {
    fullName: "Jude Tambago",
    email: "jude@example.com",
    phone: "0950 701 9941",
    address: "123 St",
    city: "Caloocan",
    province: "Metro Manila",
    zip: "1400",
    paymentMethod: "cod",
    shippingMethodId: "standard",
    shippingMethodName: "Standard Shipping",
    notes: "",
  },
};

const ORDER: Order = {
  orderNumber: "CVE-0001",
  placedAt: "2026-01-01T00:00:00.000Z",
  lines: [{ productId: "prod-1", name: "Woven Basket", price: 450, quantity: 1 }],
  subtotal: 450,
  shippingFee: 60,
  total: 510,
  shipping: ROW.shipping,
};

describe("lib/api/orders", () => {
  it("apiGetOrdersForUser filters by lowercased email and orders newest-first", async () => {
    const chain = chainableResult({ data: [ROW], error: null });
    const client = createMockSupabaseClient(chain);

    const orders = await apiGetOrdersForUser("Jude@Example.com", client);

    expect(client.from).toHaveBeenCalledWith("orders");
    expect(chain.eq).toHaveBeenCalledWith("user_email", "jude@example.com");
    expect(chain.order).toHaveBeenCalledWith("placed_at", { ascending: false });
    expect(orders).toEqual([ORDER]);
  });

  it("apiGetOrdersForUser returns an empty array when there are no rows", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    expect(await apiGetOrdersForUser("jude@example.com", client)).toEqual([]);
  });

  it("apiGetOrdersForUser throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "denied" } }));
    await expect(apiGetOrdersForUser("jude@example.com", client)).rejects.toThrow("denied");
  });

  it("apiSaveOrderForUser inserts the mapped row", async () => {
    const chain = chainableResult({ data: null, error: null });
    const client = createMockSupabaseClient(chain);

    await apiSaveOrderForUser("Jude@Example.com", ORDER, client);

    expect(client.from).toHaveBeenCalledWith("orders");
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ order_number: "CVE-0001", user_email: "jude@example.com" }));
  });

  it("apiSaveOrderForUser throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "duplicate order" } }));
    await expect(apiSaveOrderForUser("jude@example.com", ORDER, client)).rejects.toThrow("duplicate order");
  });
});
