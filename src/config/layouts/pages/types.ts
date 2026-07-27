import type { PageLayout } from "@/types/layout";
import type { SectionKey } from "@/config/sectionRegistry";

/**
 * A standalone, routable page built entirely from the section-registry
 * page builder (Phase 11/14), as opposed to Home/About/Contact which each
 * have their own hand-written `pages/*.tsx` rendering engine. A
 * `DynamicPageDefinition` is a `PageLayout` plus the extra fields a
 * generic route needs: where it lives (`slug`/`path`) and what its
 * `<title>`/meta description should be (`meta`).
 *
 * Unlike Home/About/Contact, a dynamic page can use ANY section key in
 * `SECTION_REGISTRY` - it isn't restricted to a page-specific union.
 */
export interface DynamicPageDefinition extends PageLayout<SectionKey> {
  /** Unique identifier for this page, used as its registry key. */
  slug: string;
  /** Root-relative route path this page is mounted at, e.g. "/faq". */
  path: string;
  /** `<title>`/meta description for this page, passed to `useSiteMeta`. */
  meta: { title: string; description: string };
}
