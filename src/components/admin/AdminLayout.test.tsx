import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_NAV } from "@/config/adminNav";
import { renderWithProviders } from "@/test/utils";

describe("AdminLayout", () => {
  it("lists every future admin section in the sidebar", () => {
    renderWithProviders(<AdminLayout />, ["/admin"]);
    for (const item of ADMIN_NAV) {
      expect(screen.getAllByText(item.label).length).toBeGreaterThan(0);
    }
  });

  it("marks unavailable sections as coming soon rather than linking them", () => {
    renderWithProviders(<AdminLayout />, ["/admin"]);
    const soonBadges = screen.queryAllByText("Soon");
    const unavailableCount = ADMIN_NAV.filter((item) => !item.available).length;
    expect(soonBadges).toHaveLength(unavailableCount);
  });
});
