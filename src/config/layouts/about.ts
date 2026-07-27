import type { PageLayout } from "@/types/layout";

/** Every section key the /about page can render. Keys map 1:1 to entries in `config/sectionRegistry.tsx`. */
export type AboutSectionKey = "aboutIntro" | "aboutStory" | "aboutProcess" | "aboutValues" | "aboutCta";

/**
 * `/about` layout configuration (Phase 11). `pages/About.tsx` reads this
 * the same way `pages/Home.tsx` reads `config/layouts/home.ts` - a small
 * rendering engine over `config/sectionRegistry.tsx`. Reordering,
 * disabling, or retitling a section here never requires touching
 * `About.tsx` or any section component.
 */
export const ABOUT_LAYOUT: PageLayout<AboutSectionKey> = {
  label: "About (default)",
  description: "Intro, origin story, process steps, values, and a shop CTA - the original page order.",
  sections: [
    { key: "aboutIntro", enabled: true, order: 0 },
    { key: "aboutStory", enabled: true, order: 1 },
    { key: "aboutProcess", enabled: true, order: 2 },
    { key: "aboutValues", enabled: true, order: 3 },
    { key: "aboutCta", enabled: true, order: 4 },
  ],
};
