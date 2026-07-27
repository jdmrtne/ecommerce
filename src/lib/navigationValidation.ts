import type { NavLink } from "@/config/navigation";

export interface NavLinkFormErrors {
  label?: string;
  to?: string;
}

/**
 * Per-row validation for the Navigation Editor (Phase 21): every link
 * needs a non-empty label, and a non-empty `to` that either starts with
 * "/" (an internal route, matching every entry in `config/navigation.ts`
 * today - query strings/hashes like `/shop?sort=newest` or `/about#story`
 * are valid) or looks like an absolute URL (`https://...`), in case a
 * future admin wants to link out. Anything else (a bare word with no
 * leading slash, an empty string) is rejected rather than silently
 * producing a broken/relative-to-the-wrong-place link.
 */
export function validateNavLink(link: { label: string; to: string }): NavLinkFormErrors {
  const errors: NavLinkFormErrors = {};
  if (!link.label.trim()) errors.label = "Label is required.";
  const to = link.to.trim();
  if (!to) {
    errors.to = "Link is required.";
  } else if (!to.startsWith("/") && !/^https?:\/\//i.test(to)) {
    errors.to = 'Must start with "/" (e.g. "/shop") or be a full URL (e.g. "https://...").';
  }
  return errors;
}

/**
 * Validates the whole nav link list for the Navigation Editor's save
 * action: every row must individually pass `validateNavLink()`, and at
 * least one link must remain (an empty header nav is never a state the
 * admin should be able to save, even though a single row is allowed to be
 * removed on the way there).
 */
export function validateNavLinks(links: NavLink[]): { listError?: string; rowErrors: NavLinkFormErrors[] } {
  const rowErrors = links.map((link) => validateNavLink(link));
  const listError = links.length === 0 ? "Add at least one nav link." : undefined;
  return { listError, rowErrors };
}
