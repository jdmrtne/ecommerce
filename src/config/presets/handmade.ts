import type { TemplatePreset } from "@/types/preset";

export const handmadePreset: TemplatePreset = {
  id: "handmade",
  name: "Handmade",
  description: "Earthy terracotta, olive, and cream, with rounded friendly type. For craft, pottery, and artisan goods.",
  theme: {
    colors: {
      cream: "#f9f3ea",
      surface: "#fffbf3",
      beige: "#ecdfc7",
      beigeDark: "#dcc79f",
      ink: "#4a3a25",
      inkSoft: "#8a765c",
      primary: "#a8672f",
      primaryDeep: "#82501f",
      primaryTint: "#f1e3d0",
      accent: "#6b7a3f",
      accentDeep: "#525f2f",
      accentTint: "#e5e9d6",
      success: "#5f8a52",
      error: "#b3502f",
    },
    fonts: {
      display: '"Quicksand", "Segoe UI", sans-serif',
      body: '"Nunito", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.625rem",
      md: "1rem",
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
