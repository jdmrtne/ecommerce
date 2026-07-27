import { describe, expect, it } from "vitest";
import {
  hasPolicyDocumentErrors,
  validatePolicyDocument,
  validatePolicyLastUpdated,
  validatePolicySection,
  validatePolicyTitle,
} from "@/lib/policyValidation";

describe("policyValidation", () => {
  it("validatePolicyTitle rejects empty/whitespace, accepts non-empty", () => {
    expect(validatePolicyTitle("")).toBeDefined();
    expect(validatePolicyTitle("   ")).toBeDefined();
    expect(validatePolicyTitle("Privacy Policy")).toBeUndefined();
  });

  it("validatePolicyLastUpdated rejects empty/whitespace, accepts non-empty", () => {
    expect(validatePolicyLastUpdated("")).toBeDefined();
    expect(validatePolicyLastUpdated("   ")).toBeDefined();
    expect(validatePolicyLastUpdated("2026-01-01")).toBeUndefined();
  });

  it("validatePolicySection requires both heading and body", () => {
    expect(validatePolicySection({ heading: "", body: "" })).toEqual({
      heading: "Heading is required.",
      body: "Body text is required.",
    });
    expect(validatePolicySection({ heading: "H", body: "" })).toEqual({ body: "Body text is required." });
    expect(validatePolicySection({ heading: "", body: "B" })).toEqual({ heading: "Heading is required." });
    expect(validatePolicySection({ heading: "H", body: "B" })).toEqual({});
  });

  it("validatePolicyDocument flags a missing title, date, and empty section list", () => {
    const errors = validatePolicyDocument({ title: "", lastUpdated: "", sections: [] });
    expect(errors.title).toBeDefined();
    expect(errors.lastUpdated).toBeDefined();
    expect(errors.sectionsError).toBeDefined();
    expect(errors.sectionErrors).toEqual([]);
  });

  it("validatePolicyDocument flags per-section errors at the matching index", () => {
    const errors = validatePolicyDocument({
      title: "Privacy",
      lastUpdated: "2026-01-01",
      sections: [
        { heading: "Good", body: "Good body" },
        { heading: "", body: "" },
      ],
    });
    expect(errors.title).toBeUndefined();
    expect(errors.lastUpdated).toBeUndefined();
    expect(errors.sectionsError).toBeUndefined();
    expect(errors.sectionErrors[0]).toEqual({});
    expect(errors.sectionErrors[1]).toEqual({ heading: "Heading is required.", body: "Body text is required." });
  });

  it("validatePolicyDocument passes cleanly for a fully valid document", () => {
    const errors = validatePolicyDocument({
      title: "Privacy",
      lastUpdated: "2026-01-01",
      sections: [{ heading: "H", body: "B" }],
    });
    expect(hasPolicyDocumentErrors(errors)).toBe(false);
  });

  it("hasPolicyDocumentErrors detects a title-only, section-only, or sectionsError-only failure", () => {
    expect(
      hasPolicyDocumentErrors({ title: "Required.", sectionErrors: [] }),
    ).toBe(true);
    expect(
      hasPolicyDocumentErrors({ sectionsError: "Add at least one section.", sectionErrors: [] }),
    ).toBe(true);
    expect(
      hasPolicyDocumentErrors({ sectionErrors: [{ heading: "Required." }] }),
    ).toBe(true);
    expect(hasPolicyDocumentErrors({ sectionErrors: [{}] })).toBe(false);
  });
});
