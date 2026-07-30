import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { CustomerDetail } from "@/pages/admin/CustomerDetail";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import type { OrderRow } from "@/lib/api/types";

const CUSTOMER = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };

const ORDER_ROW: OrderRow = {
  order_number: "CV-100000",
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

function renderDetail(email: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/customers/:email" element={<CustomerDetail />} />
    </Routes>,
    [`/admin/customers/${encodeURIComponent(email)}`],
  );
}

describe("CustomerDetail", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("shows the customer's profile info and order history from the backend", async () => {
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    await fakeSupabase.from("orders").insert(ORDER_ROW);

    renderDetail(CUSTOMER.email);

    expect(screen.queryByText("CV-100000")).not.toBeInTheDocument();
    await screen.findByText("CV-100000");
    expect(screen.getAllByText(CUSTOMER.name).length).toBeGreaterThan(0);
    expect(screen.getByText(CUSTOMER.email)).toBeInTheDocument();
  });

  it("shows an empty state with no orders for that customer", async () => {
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    renderDetail(CUSTOMER.email);

    await screen.findByText("No orders yet");
  });

  it("shows a not-found state for an email with no matching profile", async () => {
    renderDetail("nobody@example.com");
    await screen.findByText("Customer not found");
  });
});
