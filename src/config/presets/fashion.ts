import type { TemplatePreset } from "@/types/preset";

export const fashionPreset: TemplatePreset = {
  id: "fashion",
  name: "Fashion",
  description: "Editorial black, white, and blush, with a delicate serif display face. For apparel and boutique brands.",
  theme: {
    colors: {
      cream: "#ffffff",
      surface: "#fbfbfb",
      beige: "#ececec",
      beigeDark: "#d8d8d8",
      ink: "#141414",
      inkSoft: "#6e6e6e",
      primary: "#141414",
      primaryDeep: "#000000",
      primaryTint: "#ececec",
      accent: "#d9a5a0",
      accentDeep: "#c17f78",
      accentTint: "#f6e9e7",
      success: "#4a7a5c",
      error: "#a53f2f",
    },
    fonts: {
      display: '"Cormorant Garamond", Georgia, serif',
      body: '"Jost", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.125rem",
      md: "0.25rem",
      lg: "0.375rem",
      xl: "0.5rem",
      full: "999px",
    },
    cardStyle: "flat",
    buttonStyle: "square",
  },
  navStyle: "minimal",
  footerStyle: "minimal",
  heroStyle: "minimal",
  sectionSpacing: "spacious",
};
