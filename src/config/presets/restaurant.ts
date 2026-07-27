import type { TemplatePreset } from "@/types/preset";

export const restaurantPreset: TemplatePreset = {
  id: "restaurant",
  name: "Restaurant",
  description: "Deep green, burgundy, and cream, with an elegant serif display face. For upscale dining and hospitality.",
  theme: {
    colors: {
      cream: "#f7f4ec",
      surface: "#fffdf8",
      beige: "#e7ddc7",
      beigeDark: "#d3c3a0",
      ink: "#22301f",
      inkSoft: "#5f6e58",
      primary: "#2f4a30",
      primaryDeep: "#1b2e1c",
      primaryTint: "#e2e9df",
      accent: "#762839",
      accentDeep: "#571c28",
      accentTint: "#ecdbde",
      success: "#3f7a4d",
      error: "#8c2f26",
    },
    fonts: {
      display: '"Playfair Display", Georgia, serif',
      body: '"Jost", "Segoe UI", sans-serif',
    },
    radius: {
      sm: "0.375rem",
      md: "0.625rem",
      lg: "1rem",
      xl: "1.5rem",
      full: "999px",
    },
    cardStyle: "outlined",
    buttonStyle: "rounded",
  },
  navStyle: "centered",
  footerStyle: "columns",
  heroStyle: "bold",
  sectionSpacing: "relaxed",
};
