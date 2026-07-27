import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { renderWithProviders } from "@/test/utils";
import { ALL_PRODUCTS, CATEGORIES } from "@/data/products";

describe("AdminDashboard", () => {
  it("renders live product/category counts, not placeholders", () => {
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByText(String(ALL_PRODUCTS.length))).toBeInTheDocument();
    expect(screen.getByText(String(CATEGORIES.length))).toBeInTheDocument();
  });

  it("sets the page title", () => {
    renderWithProviders(<AdminDashboard />);
    expect(document.title).toContain("Admin Dashboard");
  });
});
