import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Account } from "@/pages/Account";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import type { OrderRow } from "@/lib/api/types";

const PROFILE = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };

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
    notes: "",
  },
};

describe("Account", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("shows a loading skeleton, then the signed-in user's order history from the backend", async () => {
    fakeSupabase.__signInAs(PROFILE);
    await fakeSupabase.from("orders").insert(ORDER_ROW);

    renderWithProviders(<Account />);

    expect(screen.queryByText("CV-100000")).not.toBeInTheDocument();
    await screen.findByText("CV-100000");
    expect(screen.getByText("Hi, Jude")).toBeInTheDocument();
  });

  it("shows an empty state with no orders", async () => {
    fakeSupabase.__signInAs(PROFILE);
    renderWithProviders(<Account />);

    await screen.findByText("No orders yet");
  });

  it("shows an error state with a retry action if the order history fails to load", async () => {
    fakeSupabase.__signInAs(PROFILE);
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "orders") {
        return {
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: "network down" } }) }) }),
        } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    renderWithProviders(<Account />);
    await screen.findByText("Couldn't load your orders");

    fakeSupabase.from = originalFrom;
    await fakeSupabase.from("orders").insert(ORDER_ROW);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByText("CV-100000");
  });
});
