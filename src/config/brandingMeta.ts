/**
 * The subset of `branding.ts` that's pure text/config, with no asset
 * import and no `@/` path alias - both only resolve inside Vite's
 * module graph, not in a plain Node script. `branding.ts` spreads this
 * object into the full `BrandingConfig`; `scripts/sync-index-html.mjs`
 * (Phase 13) imports this file directly by relative path so it can sync
 * `index.html`'s static pre-render `<title>`/meta tags from the same
 * source of truth at build time, without loading the rest of the app.
 * See the note in `index.html` and in that script.
 */
export interface BrandingMeta {
  /** Short business name, used in the navbar, footer, and page titles. */
  businessName: string;
  /** One-line tagline shown near the logo/footer. */
  tagline: string;
  /** Longer description used for SEO meta tags and About-page fallbacks. */
  businessDescription: string;
  /** Browser tab icon path, relative to /public. */
  favicon: string;
  /** Used for <meta name="theme-color">. */
  themeColor: string;
}

export const BRANDING_META: BrandingMeta = {
  businessName: "My Business",
  tagline: "Your business tagline",
  businessDescription: "Describe your business here.",
  favicon: "/favicon.png",
  themeColor: "#fbf6ee",
};
