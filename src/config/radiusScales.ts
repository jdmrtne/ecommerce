import type { ThemeConfig } from "@/config/theme";

/**
 * Curated corner-radius scales for the Phase 17 Theme Editor.
 * `ThemeConfig.radius` is five related values (`sm`/`md`/`lg`/`xl`/`full`)
 * that need to stay proportional to look right - editing them as five
 * independent free-text length fields risks an inconsistent scale (e.g.
 * `lg` smaller than `sm`). Each option below is one of the exact scales
 * already used by one of the 10 shipped presets, spanning sharp to round.
 */
export interface RadiusScaleOption {
  id: string;
  label: string;
  radius: ThemeConfig["radius"];
}

export const RADIUS_SCALE_OPTIONS: RadiusScaleOption[] = [
  {
    id: "sharp",
    label: "Sharp",
    radius: { sm: "0.125rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem", full: "999px" },
  },
  {
    id: "subtle",
    label: "Subtle",
    radius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "999px" },
  },
  {
    id: "standard",
    label: "Standard",
    radius: { sm: "0.5rem", md: "0.9rem", lg: "1.5rem", xl: "2.25rem", full: "999px" },
  },
  {
    id: "soft",
    label: "Soft",
    radius: { sm: "0.375rem", md: "0.625rem", lg: "1rem", xl: "1.5rem", full: "999px" },
  },
  {
    id: "round",
    label: "Round",
    radius: { sm: "0.75rem", md: "1.25rem", lg: "1.75rem", xl: "2.5rem", full: "999px" },
  },
];

/** Finds which curated scale (if any) matches a given radius object exactly, e.g. to preselect the right option in a `<select>`. */
export function matchRadiusScaleId(radius: ThemeConfig["radius"]): string | null {
  const match = RADIUS_SCALE_OPTIONS.find(
    (option) =>
      option.radius.sm === radius.sm &&
      option.radius.md === radius.md &&
      option.radius.lg === radius.lg &&
      option.radius.xl === radius.xl,
  );
  return match?.id ?? null;
}
