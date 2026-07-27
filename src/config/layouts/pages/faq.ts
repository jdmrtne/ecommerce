import type { DynamicPageDefinition } from "@/config/layouts/pages/types";
import { branding } from "@/config/branding";

/**
 * Standalone `/faq` page (Phase 14) - the first real example of the
 * dynamic-page system, closing the gap flagged in Phase 11/13's Known
 * Issues (the FAQ accordion previously only existed as a homepage
 * section, reachable via the `/#faq` anchor link). Reuses the existing
 * `faq` section from `SECTION_REGISTRY` as-is; no new component was
 * written for this page.
 */
export const FAQ_PAGE: DynamicPageDefinition = {
  slug: "faq",
  path: "/faq",
  label: "FAQ",
  description: "Standalone frequently-asked-questions page.",
  meta: {
    title: "FAQ",
    description: `Answers to common questions about ${branding.businessName}.`,
  },
  sections: [{ key: "faq", enabled: true, order: 0 }],
};
