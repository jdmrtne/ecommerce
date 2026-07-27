/**
 * Reusable theme system.
 *
 * `src/index.css` defines the *default* values for these CSS custom
 * properties inside `@theme` (Tailwind v4's CSS-first config) - that's
 * what keeps the production build fast and lets Tailwind generate
 * utilities like `bg-denim`/`text-bloom`/`font-display` at build time.
 *
 * This file is the *runtime override* layer: `applyTheme()` writes this
 * object's values onto `:root` as inline CSS custom properties before the
 * app renders. Because CSS custom properties cascade at runtime, any
 * utility class that resolves to `var(--color-denim)` etc. picks up the
 * override automatically - no component or CSS file needs to change to
 * reskin the site.
 *
 * To re-theme a white-labeled copy of this project, edit or pick a preset
 * in `config/presets/` (colors, fonts, radius, button/card style all live
 * on each preset's `theme` field of this shape). Component code should
 * never hardcode a hex color or px radius - use the existing Tailwind
 * tokens (which resolve through this config) instead.
 */
export interface ThemeConfig {
  colors: {
    /** Page background. */
    cream: string;
    /** Card/panel background. */
    surface: string;
    /** Muted background (footers, subtle sections). */
    beige: string;
    beigeDark: string;
    /** Body text. */
    ink: string;
    /** Secondary/muted text. */
    inkSoft: string;
    /** Primary accent (links, buttons, active states). */
    primary: string;
    primaryDeep: string;
    primaryTint: string;
    /** Secondary accent (badges, highlights). */
    accent: string;
    accentDeep: string;
    accentTint: string;
    success: string;
    error: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  /** Card visual style - passed through as a data attribute for future CSS hooks. */
  cardStyle: "soft" | "flat" | "outlined";
  /** Button visual style - passed through as a data attribute for future CSS hooks. */
  buttonStyle: "rounded" | "pill" | "square";
}

/**
 * Phase 12 note: this file used to also export a single hardcoded default
 * `theme` object. That default now lives as the `theme` field of
 * `config/presets/classic.ts` (the template's original look, byte-for-byte
 * unchanged) - see `config/presets/index.ts` for the full preset registry
 * and `ACTIVE_PRESET_ID`. This file keeps the `ThemeConfig` shape and the
 * `applyTheme()` mechanics, which every preset reuses unchanged.
 */

/**
 * Maps this config onto the CSS custom property names already defined in
 * `src/index.css`. The existing token *names* (`--color-denim`,
 * `--color-bloom`, ...) are kept internally for backwards compatibility
 * with every component's Tailwind classes (`bg-denim`, `text-bloom-deep`,
 * etc.) - renaming those class names across every component is a purely
 * cosmetic change with no functional benefit, so it was intentionally
 * left alone (see Phase 8 handoff, Architecture Decisions). What actually
 * matters for white-labeling is that the *values* are config-driven,
 * which this function guarantees.
 */
function cssVarMap(t: ThemeConfig): Record<string, string> {
  return {
    "--color-cream": t.colors.cream,
    "--color-surface": t.colors.surface,
    "--color-beige": t.colors.beige,
    "--color-beige-dark": t.colors.beigeDark,
    "--color-ink": t.colors.ink,
    "--color-ink-soft": t.colors.inkSoft,
    "--color-denim": t.colors.primary,
    "--color-denim-deep": t.colors.primaryDeep,
    "--color-denim-tint": t.colors.primaryTint,
    "--color-bloom": t.colors.accent,
    "--color-bloom-deep": t.colors.accentDeep,
    "--color-bloom-tint": t.colors.accentTint,
    "--color-success": t.colors.success,
    "--color-error": t.colors.error,
    "--font-display": t.fonts.display,
    "--font-body": t.fonts.body,
    "--radius-sm": t.radius.sm,
    "--radius-md": t.radius.md,
    "--radius-lg": t.radius.lg,
    "--radius-xl": t.radius.xl,
    "--radius-full": t.radius.full,
  };
}

const OVERRIDE_STYLE_ID = "brand-theme-overrides";

/**
 * Applies `theme` by injecting a `<style>` tag with `:root` custom
 * property overrides. Call once, before the app renders (see
 * `src/main.tsx`). Safe to call in non-browser environments (no-ops if
 * `document` is unavailable, e.g. during tests run under Node).
 *
 * Deliberately NOT implemented via `element.style.setProperty` (inline
 * styles): inline styles have higher CSS specificity than the `.dark`
 * class selector in `src/index.css`, so they would permanently pin every
 * color to the light-theme config values and silently break dark mode
 * (`useTheme.ts`). Color overrides are scoped to `:root:not(.dark)` so
 * they only apply outside dark mode, leaving `.dark`'s own palette in
 * `index.css` fully in control of dark-mode colors. Fonts and radius have
 * no dark-mode-specific values, so those are safe to apply unconditionally.
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.cardStyle = config.cardStyle;
  root.dataset.buttonStyle = config.buttonStyle;

  const vars = cssVarMap(config);
  const colorProps = new Set([
    "--color-cream",
    "--color-surface",
    "--color-beige",
    "--color-beige-dark",
    "--color-ink",
    "--color-ink-soft",
    "--color-denim",
    "--color-denim-deep",
    "--color-denim-tint",
    "--color-bloom",
    "--color-bloom-deep",
    "--color-bloom-tint",
    "--color-success",
    "--color-error",
  ]);

  const colorDecls: string[] = [];
  const globalDecls: string[] = [];
  for (const [prop, value] of Object.entries(vars)) {
    const decl = `${prop}: ${value};`;
    if (colorProps.has(prop)) colorDecls.push(decl);
    else globalDecls.push(decl);
  }

  const css = [
    globalDecls.length ? `:root { ${globalDecls.join(" ")} }` : "",
    colorDecls.length ? `:root:not(.dark) { ${colorDecls.join(" ")} }` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let styleEl = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = OVERRIDE_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}
