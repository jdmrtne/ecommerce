import { describe, expect, it } from "vitest";
import {
  validateCopyrightHolder,
  validateFooterGroup,
  validateFooterLink,
  validateFooterLinkGroups,
} from "@/lib/footerValidation";

describe("validateFooterLink", () => {
  it("accepts a valid internal link", () => {
    expect(validateFooterLink({ label: "Shop", to: "/shop" })).toEqual({});
  });

  it("accepts an internal link with a query string or hash", () => {
    expect(validateFooterLink({ label: "Best Sellers", to: "/shop?sort=best-selling" })).toEqual({});
    expect(validateFooterLink({ label: "Our Story", to: "/about#story" })).toEqual({});
  });

  it("accepts a full external URL", () => {
    expect(validateFooterLink({ label: "Blog", to: "https://blog.example.com" })).toEqual({});
  });

  it("rejects an empty label", () => {
    expect(validateFooterLink({ label: "  ", to: "/shop" })).toEqual({ label: "Label is required." });
  });

  it("rejects an empty link", () => {
    expect(validateFooterLink({ label: "Shop", to: "" })).toEqual({ to: "Link is required." });
  });

  it("rejects a link with no leading slash and no protocol", () => {
    expect(validateFooterLink({ label: "Shop", to: "shop" })).toEqual({
      to: 'Must start with "/" (e.g. "/shop") or be a full URL (e.g. "https://...").',
    });
  });
});

describe("validateFooterGroup", () => {
  it("accepts a group with a title and valid links", () => {
    const errors = validateFooterGroup({ title: "Shop", links: [{ label: "All", to: "/shop" }] });
    expect(errors.title).toBeUndefined();
    expect(errors.linkErrors).toEqual([{}]);
  });

  it("rejects an empty title", () => {
    const errors = validateFooterGroup({ title: "  ", links: [{ label: "All", to: "/shop" }] });
    expect(errors.title).toBe("Column title is required.");
  });

  it("surfaces per-link errors at the matching index", () => {
    const errors = validateFooterGroup({
      title: "Shop",
      links: [{ label: "All", to: "/shop" }, { label: "", to: "" }],
    });
    expect(errors.linkErrors).toEqual([{}, { label: "Label is required.", to: "Link is required." }]);
  });
});

describe("validateFooterLinkGroups", () => {
  it("allows an empty overall group list (the minimal footerStyle shows none anyway)", () => {
    expect(validateFooterLinkGroups([])).toEqual({ groupErrors: [] });
  });

  it("flags a group with a valid title but zero links", () => {
    const { groupErrors } = validateFooterLinkGroups([{ title: "Shop", links: [] }]);
    expect(groupErrors[0].linksError).toBe("Add at least one link, or remove this column.");
  });

  it("does not flag the links-empty error when the title itself is also invalid", () => {
    const { groupErrors } = validateFooterLinkGroups([{ title: "", links: [] }]);
    expect(groupErrors[0].title).toBe("Column title is required.");
    expect(groupErrors[0].linksError).toBeUndefined();
  });

  it("passes a fully valid multi-group list with no errors", () => {
    const { groupErrors } = validateFooterLinkGroups([
      { title: "Shop", links: [{ label: "All", to: "/shop" }] },
      { title: "Help", links: [{ label: "Contact", to: "/contact" }] },
    ]);
    expect(groupErrors.every((e) => !e.title && !e.linksError && e.linkErrors.every((le) => Object.keys(le).length === 0))).toBe(
      true,
    );
  });
});

describe("validateCopyrightHolder", () => {
  it("accepts a non-empty value", () => {
    expect(validateCopyrightHolder("Acme Co")).toBeUndefined();
  });

  it("rejects an empty or whitespace-only value", () => {
    expect(validateCopyrightHolder("")).toBe("Copyright name is required.");
    expect(validateCopyrightHolder("   ")).toBe("Copyright name is required.");
  });
});
