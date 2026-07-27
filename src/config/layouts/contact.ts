import type { PageLayout } from "@/types/layout";

/** Every section key the /contact page can render. Keys map 1:1 to entries in `config/sectionRegistry.tsx`. */
export type ContactSectionKey = "contactIntro" | "contactDetails";

/**
 * `/contact` layout configuration (Phase 11). Only two sections today -
 * the info-cards-and-form grid is kept as a single `contactDetails`
 * section (rather than split further) because the two columns share one
 * responsive grid in the current design; splitting them into
 * independently reorderable sections would mean redesigning that layout,
 * which is out of scope for this phase (see `MASTER_HANDOFF.md`).
 */
export const CONTACT_LAYOUT: PageLayout<ContactSectionKey> = {
  label: "Contact (default)",
  description: "Heading, then contact info + message form.",
  sections: [
    { key: "contactIntro", enabled: true, order: 0 },
    { key: "contactDetails", enabled: true, order: 1 },
  ],
};
