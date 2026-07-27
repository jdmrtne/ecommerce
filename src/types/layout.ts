/**
 * Page builder types (Phase 11).
 *
 * A "page layout" is an ordered list of section instances. Each instance
 * points at a key in the central `SECTION_REGISTRY` (see
 * `config/sectionRegistry.tsx`) and carries its own enable/order/title/
 * subtitle/appearance config - the page component itself never hardcodes
 * which sections exist or what order they render in.
 */

/** Visual appearance knobs every section wrapper understands. Omit any key to fall back to that section's own default. */
export interface SectionSettings {
  /** Vertical spacing. Maps to a `py-*` scale. */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Section background tone, pulled from the existing theme tokens - never a raw color. */
  background?: "transparent" | "surface" | "beige" | "denim-tint" | "bloom-tint";
  /** Max-width of the section's inner content column. */
  width?: "narrow" | "medium" | "default" | "wide" | "full";
  /** Heading/content alignment, where the section supports it. */
  align?: "left" | "center";
}

/**
 * One section placed on a page. `key` must exist in `SECTION_REGISTRY`.
 * `title`/`subtitle` override that section's default copy from
 * `content/*.ts` for this placement only - leave unset to use the
 * section's normal content-driven heading.
 */
export interface SectionInstance<Key extends string = string> {
  key: Key;
  enabled: boolean;
  /** Render order, ascending. Ties break on array position. */
  order: number;
  title?: string;
  subtitle?: string;
  settings?: SectionSettings;
}

/** A named, ordered arrangement of sections for one page. */
export interface PageLayout<Key extends string = string> {
  label: string;
  description: string;
  sections: SectionInstance<Key>[];
}

/** Props every registered section component must accept (all optional - every field has a content-driven default). */
export interface SectionOverrideProps {
  title?: string;
  subtitle?: string;
  settings?: SectionSettings;
}

/** Returns only the enabled sections of a layout, sorted by `order`. */
export function resolveLayoutSections<Key extends string>(
  layout: PageLayout<Key>,
): SectionInstance<Key>[] {
  return layout.sections
    .filter((section) => section.enabled)
    .slice()
    .sort((a, b) => a.order - b.order);
}
