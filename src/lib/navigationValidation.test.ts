import { describe, expect, it } from "vitest";
import { validateNavLink, validateNavLinks } from "@/lib/navigationValidation";

describe("validateNavLink", () => {
  it("passes for a valid internal link", () => {
    expect(validateNavLink({ label: "Shop", to: "/shop" })).toEqual({});
  });

  it("passes for a link with a query string or hash", () => {
    expect(validateNavLink({ label: "Best Sellers", to: "/shop?sort=best-selling" })).toEqual({});
    expect(validateNavLink({ label: "Our Story", to: "/about#story" })).toEqual({});
  });

  it("passes for a full external URL", () => {
    expect(validateNavLink({ label: "Blog", to: "https://blog.example.com" })).toEqual({});
  });

  it("requires a non-empty label", () => {
    expect(validateNavLink({ label: "  ", to: "/shop" })).toEqual({ label: "Label is required." });
  });

  it("requires a non-empty link", () => {
    expect(validateNavLink({ label: "Shop", to: "" })).toEqual({ to: "Link is required." });
  });

  it("rejects a link with no leading slash and no protocol", () => {
    const errors = validateNavLink({ label: "Shop", to: "shop" });
    expect(errors.to).toBeDefined();
  });
});

describe("validateNavLinks", () => {
  it("reports no errors for a valid list", () => {
    const result = validateNavLinks([
      { label: "Shop", to: "/shop" },
      { label: "About", to: "/about" },
    ]);
    expect(result.listError).toBeUndefined();
    expect(result.rowErrors).toEqual([{}, {}]);
  });

  it("requires at least one link", () => {
    const result = validateNavLinks([]);
    expect(result.listError).toBe("Add at least one nav link.");
  });

  it("reports per-row errors at the matching index", () => {
    const result = validateNavLinks([
      { label: "Shop", to: "/shop" },
      { label: "", to: "" },
    ]);
    expect(result.rowErrors[0]).toEqual({});
    expect(result.rowErrors[1].label).toBeDefined();
    expect(result.rowErrors[1].to).toBeDefined();
  });
});
