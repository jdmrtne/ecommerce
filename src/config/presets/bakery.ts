import type { TemplatePreset } from "@/types/preset";

export const bakeryPreset: TemplatePreset = {
  id: "bakery",
  name: "Bakery",
  description: "Warm cream, terracotta, and butter yellow, with soft pastry-like rounding. For bakeries and cafes.",
  theme: {
    colors: {
      cream: "#fdf6ea",
      surface: "#fffcf5",
      beige: "#f5e4c6",
      beigeDark: "#eccf9c",
      ink: "#54331f",
      inkSoft: "#93705a",
      primary: "#d97b45",
      primaryDeep: "#b25e2f",
      primaryTint: "#faeadd",
      accent: "#e8b23d",
      accentDeep: "#c9931f",
      accentTint: "#fbf0d6",
      success: "#7a9457",
      error: "#c2482f",
    },
    fonts: {
      display: '"Fraunces", "Iowan Old Style", serif',
      body: '"Nunito", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.75rem",
      md: "1.25rem",
      lg: "2rem",
      xl: "2.75rem",
      full: "999px",
    },
    cardStyle: "soft",
    buttonStyle: "pill",
  },
  navStyle: "standard",
  footerStyle: "columns",
  heroStyle: "illustrated",
  sectionSpacing: "cozy",
};
