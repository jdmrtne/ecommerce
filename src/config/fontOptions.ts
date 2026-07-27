/**
 * Curated font choices for the Phase 17 Theme Editor. `ThemeConfig.fonts`
 * are full CSS font-family stacks (e.g. `'"Fraunces", "Iowan Old Style",
 * serif'`), not just a family name - free-text editing risks a stack that
 * doesn't resolve to anything loaded. Every option below is one of the
 * exact stacks already used by one of the 10 shipped presets, so every
 * choice is guaranteed to render correctly (`src/index.css` loads all of
 * these Google Fonts families up front, regardless of the active preset -
 * see `MASTER_HANDOFF.md` Known Issues).
 */
export interface FontOption {
  label: string;
  value: string;
}

export const DISPLAY_FONT_OPTIONS: FontOption[] = [
  { label: "Fraunces (warm serif)", value: '"Fraunces", "Iowan Old Style", serif' },
  { label: "Playfair Display (elegant serif)", value: '"Playfair Display", Georgia, serif' },
  { label: "Cormorant Garamond (refined serif)", value: '"Cormorant Garamond", Georgia, serif' },
  { label: "Space Grotesk (modern sans)", value: '"Space Grotesk", "Segoe UI", sans-serif' },
  { label: "Quicksand (rounded sans)", value: '"Quicksand", "Segoe UI", sans-serif' },
  { label: "Inter (clean sans)", value: '"Inter", "Segoe UI", sans-serif' },
];

export const BODY_FONT_OPTIONS: FontOption[] = [
  { label: "Manrope", value: '"Manrope", "Segoe UI", sans-serif' },
  { label: "Inter", value: '"Inter", "Segoe UI", sans-serif' },
  { label: "Nunito", value: '"Nunito", "Segoe UI", sans-serif' },
  { label: "Lato", value: '"Lato", "Segoe UI", sans-serif' },
  { label: "Jost", value: '"Jost", "Segoe UI", sans-serif' },
];
