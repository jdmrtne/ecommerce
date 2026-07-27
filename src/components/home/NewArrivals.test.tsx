import { beforeEach, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { NewArrivals } from "@/components/home/NewArrivals";
import { NEW_ARRIVALS } from "@/data/products";
import { NEW_ARRIVALS_SECTION } from "@/content/homepage";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

describe("NewArrivals", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("renders the section heading immediately, then one card per new-arrival product once loaded", async () => {
    const { container, getByText } = renderWithProviders(<NewArrivals />);

    expect(getByText(NEW_ARRIVALS_SECTION.title)).toBeInTheDocument();
    expect(container.querySelectorAll("section").length).toBe(1);

    await waitFor(() =>
      expect(container.querySelectorAll("a[href^='/shop/']").length).toBe(NEW_ARRIVALS.length),
    );
  });

  it("prefers a title/subtitle override when provided", () => {
    const { getByText } = renderWithProviders(
      <NewArrivals title="Custom Title" subtitle="Custom subtitle" />,
    );
    expect(getByText("Custom Title")).toBeInTheDocument();
    expect(getByText("Custom subtitle")).toBeInTheDocument();
  });
});
