import type { FooterLinkGroup } from "@/lib/footerSettingsStore";

export interface FooterLinkFormErrors {
  label?: string;
  to?: string;
}

export interface FooterGroupFormErrors {
  title?: string;
  /** Set when the group has a valid title but zero links - a title with nothing under it isn't a useful saved state. */
  linksError?: string;
  linkErrors: FooterLinkFormErrors[];
}

/**
 * Per-link validation, identical rule to Phase 21's `validateNavLink()`:
 * a non-empty label, and a non-empty `to` that either starts with "/" (an
 * internal route - query strings/hashes like `/shop?sort=newest` or
 * `/about#story` are valid, matching every entry in `FOOTER_LINK_GROUPS`
 * today) or looks like an absolute URL.
 */
export function validateFooterLink(link: { label: string; to: string }): FooterLinkFormErrors {
  const errors: FooterLinkFormErrors = {};
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
 * Validates one footer link group: a non-empty column title, plus every
 * link within it via `validateFooterLink()`. A group is allowed to have
 * zero links on the way to being edited (e.g. right after removing its
 * last one), but not when the whole list is saved - see
 * `validateFooterLinkGroups()`.
 */
export function validateFooterGroup(group: FooterLinkGroup): FooterGroupFormErrors {
  return {
    title: group.title.trim() ? undefined : "Column title is required.",
    linkErrors: group.links.map((link) => validateFooterLink(link)),
  };
}

/**
 * Validates the whole footer link group list for the Footer Editor's save
 * action: every group via `validateFooterGroup()`, plus a per-group
 * "needs at least one link" error (unlike the header nav, an empty footer
 * link *group* list overall is allowed - `footerStyle: "minimal"` shows no
 * link groups at all - but a group with a title and no links is never a
 * useful saved state).
 */
export function validateFooterLinkGroups(groups: FooterLinkGroup[]): {
  groupErrors: FooterGroupFormErrors[];
} {
  const groupErrors = groups.map((group) => {
    const errors = validateFooterGroup(group);
    if (!errors.title && group.links.length === 0) {
      return { ...errors, linksError: "Add at least one link, or remove this column." };
    }
    return errors;
  });
  return { groupErrors };
}

/** A non-empty copyright/holder name - shown in the footer as "© {year} {value}. All rights reserved." */
export function validateCopyrightHolder(value: string): string | undefined {
  return value.trim() ? undefined : "Copyright name is required.";
}
