import type { SectionSettings } from "@/types/layout";
import type { SectionSpacing } from "@/types/preset";
import { resolveActivePreset } from "@/lib/themeSettingsStore";

type PaddingKey = NonNullable<SectionSettings["padding"]>;

/**
 * Vertical rhythm scales (Phase 12), one per `SectionSpacing` value. The
 * `cozy` row is the original Phase 11 `PADDING_CLASS` values, unchanged -
 * so the `classic` preset (`sectionSpacing: "cozy"`) renders pixel-identical
 * to every phase before this one.
 */
const SPACING_SCALES: Record<SectionSpacing, Record<PaddingKey, string>> = {
  compact: { none: "py-0", sm: "py-6", md: "py-8", lg: "py-10", xl: "py-14" },
  cozy: { none: "py-0", sm: "py-8", md: "py-12", lg: "py-16", xl: "py-24" },
  relaxed: { none: "py-0", sm: "py-10", md: "py-16", lg: "py-20", xl: "py-28" },
  spacious: { none: "py-0", sm: "py-12", md: "py-20", lg: "py-28", xl: "py-36" },
};

const BACKGROUND_CLASS: Record<NonNullable<SectionSettings["background"]>, string> = {
  transparent: "",
  surface: "bg-surface",
  beige: "bg-beige/40",
  "denim-tint": "bg-denim-tint/60",
  "bloom-tint": "bg-bloom-tint/60",
};

const WIDTH_CLASS: Record<NonNullable<SectionSettings["width"]>, string> = {
  narrow: "max-w-3xl",
  medium: "max-w-5xl",
  default: "max-w-7xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

/**
 * Every section defines its own *current* look as `defaults` (matching
 * what was previously hardcoded in its JSX). A layout config's
 * `settings` only needs to specify the fields it wants to override -
 * anything unset falls through to that section's default, so a section
 * with no `settings` renders pixel-identical to before Phase 11.
 */
export function resolveSectionSettings(
  defaults: Required<SectionSettings>,
  overrides?: SectionSettings,
): Required<SectionSettings> {
  return { ...defaults, ...overrides };
}

/**
 * `py-*` class for the resolved padding. Reads the *live* active preset's
 * `sectionSpacing` on every call (Phase 17) - cheap (a `localStorage`
 * read + object lookup), and means a saved preset switch shows up in
 * every section's spacing without a reload, the same way `paddingClass`'s
 * caller re-renders for any other reason.
 */
export function paddingClass(settings: Required<SectionSettings>): string {
  const scale = SPACING_SCALES[resolveActivePreset().sectionSpacing];
  return scale[settings.padding];
}

/** Background class for the resolved background. Empty string for `transparent`. */
export function backgroundClass(settings: Required<SectionSettings>): string {
  return BACKGROUND_CLASS[settings.background];
}

/** `max-w-*` class for the resolved width. */
export function widthClass(settings: Required<SectionSettings>): string {
  return WIDTH_CLASS[settings.width];
}
