import type { TemplatePreset } from "@/types/preset";
import { applyTheme } from "@/config/theme";
import { classicPreset } from "./classic";
import { minimalPreset } from "./minimal";
import { modernPreset } from "./modern";
import { cutePreset } from "./cute";
import { luxuryPreset } from "./luxury";
import { fashionPreset } from "./fashion";
import { bakeryPreset } from "./bakery";
import { restaurantPreset } from "./restaurant";
import { electronicsPreset } from "./electronics";
import { handmadePreset } from "./handmade";

/**
 * Template preset registry (Phase 12).
 *
 * Every preset the template ships with, keyed by its `id`. To reskin a
 * white-labeled copy of this project for a different business vertical,
 * change `ACTIVE_PRESET_ID` below to one of these keys - no component
 * code needs to change. To add a brand-new preset, add a `TemplatePreset`
 * object under `config/presets/`, import it here, and add it to this map;
 * `presets.test.ts` will automatically validate its shape.
 */
export const PRESETS: Record<string, TemplatePreset> = {
  classic: classicPreset,
  minimal: minimalPreset,
  modern: modernPreset,
  cute: cutePreset,
  luxury: luxuryPreset,
  fashion: fashionPreset,
  bakery: bakeryPreset,
  restaurant: restaurantPreset,
  electronics: electronicsPreset,
  handmade: handmadePreset,
};

/** Ordered list of every preset, e.g. for a future admin preset picker. */
export const TEMPLATE_PRESETS: TemplatePreset[] = Object.values(PRESETS);

/**
 * Which preset this deployment uses. Change this one value to reskin the
 * entire site - colors, fonts, radius, card/button style, navigation
 * layout, footer layout, hero layout, and section spacing all switch
 * together, since they're designed as one cohesive look per preset rather
 * than independent knobs.
 */
export const ACTIVE_PRESET_ID = "classic";

/** The resolved active preset. Falls back to `classic` if `ACTIVE_PRESET_ID` is ever mistyped. */
export const activePreset: TemplatePreset = PRESETS[ACTIVE_PRESET_ID] ?? classicPreset;

/**
 * Applies the active preset: writes its `theme` as CSS custom property
 * overrides (via `applyTheme()`, unchanged from Phase 1-11) and sets
 * `data-nav-style` / `data-footer-style` / `data-hero-style` /
 * `data-section-spacing` attributes on `<html>`. Layout-shape components
 * (`Navbar`, `Footer`, `Hero`) read `activePreset` directly for their
 * structural branch; `lib/sectionStyle.ts` reads `activePreset.sectionSpacing`
 * for its padding scale. The `data-*` attributes exist alongside that for
 * CSS-only hooks (mirroring the pre-existing `data-card-style`/
 * `data-button-style` pattern from `config/theme.ts`) and for easy
 * inspection in devtools.
 */
export function applyPreset(preset: TemplatePreset = activePreset): void {
  applyTheme(preset.theme);

  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.navStyle = preset.navStyle;
  root.dataset.footerStyle = preset.footerStyle;
  root.dataset.heroStyle = preset.heroStyle;
  root.dataset.sectionSpacing = preset.sectionSpacing;
  // Reserved for future CSS-only hooks keyed off the preset id itself
  // (e.g. `html[data-preset="luxury"]`); not consumed by any rule yet.
  root.dataset.preset = preset.id;
}
