import type { ThemeConfig } from "@/config/theme";

/**
 * Template preset types (Phase 12).
 *
 * A `TemplatePreset` is the top-level "which business vertical does this
 * deployment look like" switch - one level above `ThemeConfig`. Where
 * `ThemeConfig` only covers colors/fonts/radius/card/button, a preset also
 * picks a navigation layout, a footer layout, a hero layout, and a section
 * spacing scale, so a single config change reskins the whole site rather
 * than just its color palette.
 *
 * Every style axis below is a closed set of variants implemented *inside*
 * the existing shared components (`Navbar`, `Footer`, `Hero`,
 * `lib/sectionStyle.ts`) - no component is duplicated per preset. Adding a
 * new preset never requires touching component code, only adding a new
 * `TemplatePreset` object in `config/presets/` and registering it.
 */

/** Desktop/mobile navigation layout variant. See `components/layout/Navbar.tsx`. */
export type NavStyle = "standard" | "centered" | "minimal";

/** Footer layout variant. See `components/layout/Footer.tsx`. */
export type FooterStyle = "columns" | "stacked" | "minimal";

/** Homepage hero layout variant. See `components/home/Hero.tsx`. */
export type HeroStyle = "illustrated" | "bold" | "minimal";

/**
 * Vertical rhythm scale. Remaps every section's `padding` token
 * (`none`/`sm`/`md`/`lg`/`xl` - see `types/layout.ts`) to a different set
 * of `py-*` values, from tight (`compact`) to airy (`spacious`). Resolved
 * centrally in `lib/sectionStyle.ts`, so no section component needs to
 * know which scale is active.
 */
export type SectionSpacing = "compact" | "cozy" | "relaxed" | "spacious";

export interface TemplatePreset {
  /** Stable identifier, used as the registry key and for `ACTIVE_PRESET_ID`. */
  id: string;
  /** Display name, e.g. for a future admin preset picker. */
  name: string;
  /** One-line description of the vertical/mood this preset targets. */
  description: string;
  /** Colors, fonts, radius scale, card style, button style - applied via `applyTheme()`. */
  theme: ThemeConfig;
  navStyle: NavStyle;
  footerStyle: FooterStyle;
  heroStyle: HeroStyle;
  sectionSpacing: SectionSpacing;
}
