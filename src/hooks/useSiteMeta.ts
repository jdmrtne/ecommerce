import { useEffect } from "react";
import { site } from "@/config/site";
import { buildTitle } from "@/config/titleTemplate";
import { resolveBranding } from "@/lib/storeSettingsStore";

interface SiteMetaOptions {
  /** Page-specific title. Pass "" for the homepage to use the site default title. */
  title: string;
  /** Page-specific description. Falls back to `site.defaultDescription` when omitted. */
  description?: string;
  /** Overrides `site.defaultOgImage` for this page. */
  ogImage?: string;
}

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Applies a live favicon override (Phase 24 - Media Manager, via Store
 * Settings). `index.html`'s static `<link rel="icon">` still points at
 * `brandingMeta.ts`'s default (correct for the pre-JS instant and for the
 * `scripts/sync-index-html.mjs` build-time sync), but once the app has
 * mounted, an admin-uploaded favicon should take over - same "runtime DOM
 * beats static HTML" split `useSiteMeta` already uses for title/meta tags.
 */
function setFavicon(href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "icon");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Applies per-page `<title>` and meta tags at runtime, driven by
 * `src/config/site.ts`. Call once per page component with that page's
 * title/description - every route in `App.tsx` does this, so no page's
 * metadata is left at whatever the previous route set.
 *
 * This only affects the live DOM (correct for every real visitor and any
 * JS-executing crawler). It intentionally doesn't touch `index.html`'s
 * static tags - see the note in `site.ts` for why, and what to do if
 * pre-JS crawler metadata becomes a requirement.
 */
export function useSiteMeta({ title, description, ogImage }: SiteMetaOptions): void {
  useEffect(() => {
    // businessName/tagline/businessDescription are read live (Store
    // Settings-aware) rather than from `site.siteName`/`site.titleTemplate`/
    // `site.defaultDescription`, which are computed once from the static
    // branding default at module load and would otherwise go stale the
    // moment an admin saves a Store Settings override. Everything else on
    // `site` (locale/ogImage/twitterHandle) is out of this phase's scope
    // and still comes from the static config.
    const branding = resolveBranding();
    const fullTitle = buildTitle(branding.businessName, branding.tagline, title);
    document.title = fullTitle;

    const desc = description ?? branding.businessDescription;
    setMetaTag("name", "description", desc);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:site_name", branding.businessName);
    setMetaTag("property", "og:locale", site.locale);
    setFavicon(branding.favicon);

    const image = ogImage ?? site.defaultOgImage;
    if (image) setMetaTag("property", "og:image", image);

    if (site.twitterHandle) {
      setMetaTag("name", "twitter:card", "summary_large_image");
      setMetaTag("name", "twitter:site", site.twitterHandle);
    }
  }, [title, description, ogImage]);
}
