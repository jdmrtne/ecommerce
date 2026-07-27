import type { TemplatePreset } from "@/types/preset";

/**
 * The template's original look (Phases 1-11), preserved exactly as the
 * default preset so existing white-labeled deployments built before Phase
 * 12 render pixel-identically. Every color/font/radius value below matches
 * the old hardcoded `theme` object that used to live in `config/theme.ts`.
 */
export const classicPreset: TemplatePreset = {
  id: "classic",
  name: "Classic",
  description: "The template's original warm, handmade-craft look. A safe, versatile default for most small businesses.",
  theme: {
    colors: {
      cream: "#fbf6ee",
      surface: "#fffdf9",
      beige: "#efe3d2",
      beigeDark: "#e2d2b8",
      ink: "#4a3628",
      inkSoft: "#8a7565",
      primary: "#4a6fa5",
      primaryDeep: "#33507a",
      primaryTint: "#e4ebf4",
      accent: "#e8639e",
      accentDeep: "#c94781",
      accentTint: "#fbe6f0",
      success: "#6b9080",
      error: "#c0563f",
    },
    fonts: {
      display: '"Fraunces", "Iowan Old Style", serif',
      body: '"Manrope", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.5rem",
      md: "0.9rem",
      lg: "1.5rem",
      xl: "2.25rem",
      full: "999px",
    },
    cardStyle: "soft",
    buttonStyle: "rounded",
  },
  navStyle: "standard",
  footerStyle: "columns",
  heroStyle: "illustrated",
  sectionSpacing: "cozy",
};
