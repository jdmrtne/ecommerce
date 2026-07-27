/**
 * Homepage layout system.
 *
 * The homepage is built from a fixed set of self-contained sections
 * (hero, categories, featured products, ...). A "layout" is just an
 * ordered subset of those sections - which ones appear, and in what
 * order. `src/pages/Home.tsx` reads `ACTIVE_HOMEPAGE_LAYOUT` and renders
 * exactly the sections `HOMEPAGE_LAYOUTS[ACTIVE_HOMEPAGE_LAYOUT].sections`
 * lists, in that order, using the *same* section components every layout
 * shares - no section is ever duplicated or rewritten per layout.
 *
 * To ship a white-labeled site with a different homepage template, change
 * `ACTIVE_HOMEPAGE_LAYOUT` below. No component code needs to change.
 *
 * To define a new layout entirely, add a new key to `HOMEPAGE_LAYOUTS`
 * with its own `sections` array (reordering/omitting from the same
 * section list) - `Home.tsx` picks it up automatically.
 */

/** Every section the homepage can render. Keys map 1:1 to a component in `Home.tsx`. */
export type HomepageSectionKey =
  | "hero"
  | "categories"
  | "featured"
  | "bestSellers"
  | "about"
  | "testimonials"
  | "instagram"
  | "newsletter"
  | "faq"
  | "contact";

export interface HomepageLayoutDefinition {
  /** Shown nowhere in the UI today - for a future admin/preview screen. */
  label: string;
  description: string;
  /** Sections rendered top-to-bottom. Omit a key to leave that section out entirely. */
  sections: HomepageSectionKey[];
}

export type HomepageLayoutId = "classic" | "minimal" | "modern" | "luxury";

export const HOMEPAGE_LAYOUTS: Record<HomepageLayoutId, HomepageLayoutDefinition> = {
  classic: {
    label: "Classic",
    description:
      "The full storefront homepage - every section, in the original template order. Good default for most stores.",
    sections: [
      "hero",
      "categories",
      "featured",
      "bestSellers",
      "about",
      "testimonials",
      "instagram",
      "newsletter",
      "faq",
      "contact",
    ],
  },
  minimal: {
    label: "Minimal",
    description:
      "A lean, fast-loading homepage for stores that want to get straight to the product - hero, one product section, a short story beat, and a way to get in touch.",
    sections: ["hero", "featured", "about", "contact"],
  },
  modern: {
    label: "Modern",
    description:
      "Product-forward and social-proof heavy - leads with what's new, backs it up with best sellers and reviews, and skips the slower storytelling sections.",
    sections: ["hero", "featured", "bestSellers", "categories", "testimonials", "newsletter", "contact"],
  },
  luxury: {
    label: "Luxury",
    description:
      "Story-led and spacious - fewer sections so each one gets more room to breathe, opening with brand narrative before product.",
    sections: ["hero", "about", "featured", "testimonials", "contact"],
  },
};

/**
 * The one setting a store owner changes to switch templates.
 * Must be a key of `HOMEPAGE_LAYOUTS`.
 */
export const ACTIVE_HOMEPAGE_LAYOUT: HomepageLayoutId = "classic";
