import type { TemplatePreset } from "@/types/preset";

export const electronicsPreset: TemplatePreset = {
  id: "electronics",
  name: "Electronics",
  description: "Graphite and electric blue, with a technical geometric display face. For gadgets and tech retailers.",
  theme: {
    colors: {
      cream: "#f3f4f6",
      surface: "#ffffff",
      beige: "#e2e5ea",
      beigeDark: "#c9cdd6",
      ink: "#14181f",
      inkSoft: "#5c6470",
      primary: "#0d6efd",
      primaryDeep: "#094fbb",
      primaryTint: "#dfeaff",
      accent: "#00c2b8",
      accentDeep: "#009991",
      accentTint: "#d7f6f4",
      success: "#1f9d55",
      error: "#dc2626",
    },
    fonts: {
      display: '"Space Grotesk", "Segoe UI", sans-serif',
      body: '"Inter", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "999px",
    },
    cardStyle: "flat",
    buttonStyle: "square",
  },
  navStyle: "minimal",
  footerStyle: "stacked",
  heroStyle: "bold",
  sectionSpacing: "compact",
};
