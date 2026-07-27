import type { TemplatePreset } from "@/types/preset";

export const cutePreset: TemplatePreset = {
  id: "cute",
  name: "Cute",
  description: "Pastel, bubbly, and playful, with rounded fonts and pill buttons. Great for kawaii, kids, or gift shops.",
  theme: {
    colors: {
      cream: "#fff5f9",
      surface: "#ffffff",
      beige: "#fbe4ee",
      beigeDark: "#f6cee0",
      ink: "#5a3a4a",
      inkSoft: "#9c7789",
      primary: "#ff8fb3",
      primaryDeep: "#e8628f",
      primaryTint: "#ffe3ec",
      accent: "#8fd3f4",
      accentDeep: "#5db3dd",
      accentTint: "#e3f4fc",
      success: "#7bc99b",
      error: "#e86a6a",
    },
    fonts: {
      display: '"Quicksand", "Segoe UI", sans-serif',
      body: '"Nunito", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.75rem",
      md: "1.25rem",
      lg: "1.75rem",
      xl: "2.5rem",
      full: "999px",
    },
    cardStyle: "soft",
    buttonStyle: "pill",
  },
  navStyle: "standard",
  footerStyle: "stacked",
  heroStyle: "illustrated",
  sectionSpacing: "cozy",
};
