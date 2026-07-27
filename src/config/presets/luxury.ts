import type { TemplatePreset } from "@/types/preset";

export const luxuryPreset: TemplatePreset = {
  id: "luxury",
  name: "Luxury",
  description: "Black, gold, and cream, with serif display type and sharp, minimal-radius edges. For premium/high-end brands.",
  theme: {
    colors: {
      cream: "#faf7f0",
      surface: "#ffffff",
      beige: "#ece4d3",
      beigeDark: "#dccdac",
      ink: "#181614",
      inkSoft: "#726a5c",
      primary: "#b08d4f",
      primaryDeep: "#8a6c37",
      primaryTint: "#f1e8d4",
      accent: "#4a1620",
      accentDeep: "#320e15",
      accentTint: "#ecdde0",
      success: "#4f6d4b",
      error: "#7a2e22",
    },
    fonts: {
      display: '"Playfair Display", Georgia, serif',
      body: '"Lato", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.125rem",
      md: "0.25rem",
      lg: "0.375rem",
      xl: "0.5rem",
      full: "999px",
    },
    cardStyle: "outlined",
    buttonStyle: "square",
  },
  navStyle: "centered",
  footerStyle: "minimal",
  heroStyle: "bold",
  sectionSpacing: "spacious",
};
