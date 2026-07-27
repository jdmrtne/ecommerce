import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Shop } from "@/pages/Shop";
import { ALL_PRODUCTS } from "@/data/products";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

describe("Shop", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("shows a loading skeleton, then the full catalog from the backend", async () => {
    renderWithProviders(<Shop />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    await screen.findByText(`${ALL_PRODUCTS.length} pieces`);
  });

  it("shows an error state with a retry action if the catalog fails to load", async () => {
    const original = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "products") {
        return {
          select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "network down" } }) }),
        } as never;
      }
      return original(table);
    }) as typeof fakeSupabase.from;

    renderWithProviders(<Shop />);
    await screen.findByText(/couldn't load products/i);

    fakeSupabase.from = original;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByText(`${ALL_PRODUCTS.length} pieces`);
  });
});
