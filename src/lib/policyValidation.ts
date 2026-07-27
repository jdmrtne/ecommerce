import type { PolicyDocument } from "@/content/policies";

export interface PolicySectionFormErrors {
  heading?: string;
  body?: string;
}

export interface PolicyDocumentFormErrors {
  title?: string;
  lastUpdated?: string;
  /** Set when the document has zero sections - a policy page with no content isn't a useful saved state. */
  sectionsError?: string;
  sectionErrors: PolicySectionFormErrors[];
}

/** Validates one section: a non-empty heading and a non-empty body. */
export function validatePolicySection(section: { heading: string; body: string }): PolicySectionFormErrors {
  const errors: PolicySectionFormErrors = {};
  if (!section.heading.trim()) errors.heading = "Heading is required.";
  if (!section.body.trim()) errors.body = "Body text is required.";
  return errors;
}

/** A non-empty policy title (e.g. "Privacy Policy"). */
export function validatePolicyTitle(value: string): string | undefined {
  return value.trim() ? undefined : "Title is required.";
}

/** A non-empty last-updated date string (`content/policies.ts` uses `YYYY-MM-DD`, but any non-empty value is accepted). */
export function validatePolicyLastUpdated(value: string): string | undefined {
  return value.trim() ? undefined : "Last updated date is required.";
}

/**
 * Validates a whole document for the Policy Editor's save action: title,
 * last-updated date, every section via `validatePolicySection()`, plus a
 * "needs at least one section" error - a policy page must show some
 * content once saved.
 */
export function validatePolicyDocument(
  doc: Pick<PolicyDocument, "title" | "lastUpdated" | "sections">,
): PolicyDocumentFormErrors {
  const sectionErrors = doc.sections.map((section) => validatePolicySection(section));
  return {
    title: validatePolicyTitle(doc.title),
    lastUpdated: validatePolicyLastUpdated(doc.lastUpdated),
    sectionsError: doc.sections.length === 0 ? "Add at least one section." : undefined,
    sectionErrors,
  };
}

/** True if a `validatePolicyDocument()` result has any error at all. */
export function hasPolicyDocumentErrors(errors: PolicyDocumentFormErrors): boolean {
  return (
    !!errors.title ||
    !!errors.lastUpdated ||
    !!errors.sectionsError ||
    errors.sectionErrors.some((e) => Object.keys(e).length > 0)
  );
}
