import type { PageLayout, SectionInstance } from "@/types/layout";

/**
 * Every section key the homepage can render. Keys map 1:1 to entries in
 * `config/sectionRegistry.tsx`.
 */
export type HomepageSectionKey =
  | "hero"
  | "categories"
  | "featured"
  | "bestSellers"
  | "newArrivals"
  | "collections"
  | "about"
  | "testimonials"
  | "instagram"
  | "newsletter"
  | "faq"
  | "contact";

export type HomeLayoutId = "classic" | "minimal" | "modern" | "luxury";

/** Friendly display name for each section key, for the Phase 18 Homepage Editor's section list UI. */
export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  hero: "Hero",
  categories: "Shop by Category",
  featured: "Featured Products",
  bestSellers: "Best Sellers",
  newArrivals: "New Arrivals",
  collections: "Collections",
  about: "About the Brand",
  testimonials: "Testimonials",
  instagram: "Instagram Gallery",
  newsletter: "Newsletter Signup",
  faq: "FAQ",
  contact: "Contact Teaser",
};

/** Canonical order every section key can appear in, used to synthesize a full 12-row editable list even for layouts (like `minimal`) that only define a handful. */
export const ALL_HOMEPAGE_SECTION_KEYS: HomepageSectionKey[] = [
  "hero",
  "categories",
  "featured",
  "bestSellers",
  "newArrivals",
  "collections",
  "about",
  "testimonials",
  "instagram",
  "newsletter",
  "faq",
  "contact",
];

/** Shorthand for building a layout's `sections` array from a plain ordered key list, all enabled, no overrides. Individual entries can still be hand-edited afterward to disable a section or add `title`/`subtitle`/`settings`. */
function sectionsFrom(keys: HomepageSectionKey[]): SectionInstance<HomepageSectionKey>[] {
  return keys.map((key, index) => ({ key, enabled: true, order: index }));
}

/**
 * Homepage layout configuration (Phase 11 - supersedes Phase 10's
 * `homepageLayouts.ts`, which this file replaces). `pages/Home.tsx` reads
 * `ACTIVE_HOME_LAYOUT`, resolves it against `HOME_LAYOUTS`, and renders
 * exactly the enabled sections in `order`, using the *same* section
 * components every layout shares - no section is ever duplicated or
 * rewritten per layout.
 *
 * Each `SectionInstance` also carries its own `title`/`subtitle`/
 * `settings` - a store owner can retitle a section or change its
 * padding/background/width for one layout without touching any
 * component or duplicating the section elsewhere.
 *
 * To ship a white-labeled site with a different homepage template,
 * change `ACTIVE_HOME_LAYOUT` below. To reorder or hide a section,
 * edit its `order`/`enabled` here - no component code needs to change.
 */
export const HOME_LAYOUTS: Record<HomeLayoutId, PageLayout<HomepageSectionKey>> = {
  classic: {
    label: "Classic",
    description:
      "The full storefront homepage - every section, in the original template order. Good default for most stores.",
    sections: sectionsFrom([
      "hero",
      "categories",
      "newArrivals",
      "featured",
      "bestSellers",
      "collections",
      "about",
      "testimonials",
      "instagram",
      "newsletter",
      "faq",
      "contact",
    ]),
  },
  minimal: {
    label: "Minimal",
    description:
      "A lean, fast-loading homepage for stores that want to get straight to the product - hero, one product section, a short story beat, and a way to get in touch.",
    sections: sectionsFrom(["hero", "featured", "about", "contact"]),
  },
  modern: {
    label: "Modern",
    description:
      "Product-forward and social-proof heavy - leads with what's new, backs it up with best sellers and reviews, and skips the slower storytelling sections.",
    sections: sectionsFrom(["hero", "featured", "bestSellers", "categories", "testimonials", "newsletter", "contact"]),
  },
  luxury: {
    label: "Luxury",
    description:
      "Story-led and spacious - fewer sections so each one gets more room to breathe, opening with brand narrative before product.",
    sections: sectionsFrom(["hero", "about", "featured", "testimonials", "contact"]),
  },
};

/**
 * The one setting a store owner changes to switch templates.
 * Must be a key of `HOME_LAYOUTS`.
 */
export const ACTIVE_HOME_LAYOUT: HomeLayoutId = "classic";
