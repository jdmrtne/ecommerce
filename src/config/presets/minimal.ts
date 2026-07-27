import type { TemplatePreset } from "@/types/preset";

export const minimalPreset: TemplatePreset = {
  id: "minimal",
  name: "Minimal",
  description: "Near-monochrome, restrained, and quiet. Small radius, flat cards, one muted accent color.",
  theme: {
    colors: {
      cream: "#fafaf9",
      surface: "#ffffff",
      beige: "#ececea",
      beigeDark: "#dcdad6",
      ink: "#1c1b1a",
      inkSoft: "#767371",
      primary: "#1c1b1a",
      primaryDeep: "#000000",
      primaryTint: "#ececea",
      accent: "#5b5955",
      accentDeep: "#3a3835",
      accentTint: "#f0efed",
      success: "#4d7a63",
      error: "#a13d2e",
    },
    fonts: {
      display: '"Inter", "Segoe UI", sans-serif',
      body: '"Inter", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      full: "999px",
    },
    cardStyle: "flat",
    buttonStyle: "square",
  },
  navStyle: "minimal",
  footerStyle: "minimal",
  heroStyle: "minimal",
  sectionSpacing: "compact",
};
