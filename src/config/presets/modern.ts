import type { TemplatePreset } from "@/types/preset";

export const modernPreset: TemplatePreset = {
  id: "modern",
  name: "Modern",
  description: "Bold contrast and geometric type, for tech-forward or design-led brands.",
  theme: {
    colors: {
      cream: "#f5f4fb",
      surface: "#ffffff",
      beige: "#e5e2f5",
      beigeDark: "#d1cbee",
      ink: "#191333",
      inkSoft: "#615b80",
      primary: "#5b3df0",
      primaryDeep: "#4327c4",
      primaryTint: "#e9e4fd",
      accent: "#ff6b4a",
      accentDeep: "#e04d2c",
      accentTint: "#ffe4dc",
      success: "#26a37a",
      error: "#e0392b",
    },
    fonts: {
      display: '"Space Grotesk", "Segoe UI", sans-serif',
      body: '"Inter", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.375rem",
      md: "0.625rem",
      lg: "1rem",
      xl: "1.5rem",
      full: "999px",
    },
    cardStyle: "flat",
    buttonStyle: "rounded",
  },
  navStyle: "centered",
  footerStyle: "stacked",
  heroStyle: "bold",
  sectionSpacing: "relaxed",
};
