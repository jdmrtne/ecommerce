import logo from "@/assets/logo/logo.png";
import { BRANDING_META, type BrandingMeta } from "@/config/brandingMeta";

/**
 * Single source of truth for everything brand-identity related.
 *
 * To turn this codebase into a different store, replace the values below
 * (and swap `src/assets/logo/logo.png` / `public/favicon.*` for the new
 * brand's files) - no component code needs to change.
 *
 * `businessName`/`tagline`/`businessDescription`/`favicon`/`themeColor`
 * live in `config/brandingMeta.ts` (Phase 13) rather than directly here,
 * so that pure-text subset can also be read by
 * `scripts/sync-index-html.mjs` outside the Vite/React app - this file
 * still re-exports them as part of `BrandingConfig`, so nothing else in
 * the app needs to know they moved.
 *
 * `storageKeyPrefix` is used to namespace this store's localStorage keys
 * (cart, wishlist, auth session, theme, orders) so two different
 * white-labeled sites built from this codebase never collide with each
 * other's saved data in the same browser.
 */
export interface BrandingConfig extends BrandingMeta {
  /** Imported logo asset - swap the file in src/assets/logo/. */
  logo: string;
  /** Alt text for the logo image. */
  logoAlt: string;
  /** Copyright line shown in the footer (business name is appended automatically). */
  copyrightHolder: string;
  /** Lowercase, hyphen-safe identifier used to namespace localStorage keys. */
  storageKeyPrefix: string;
}

export const branding: BrandingConfig = {
  ...BRANDING_META,
  logo,
  logoAlt: "My Business",
  copyrightHolder: "My Business",
  storageKeyPrefix: "store",
};

/** Helper for building namespaced localStorage keys from storageKeyPrefix. */
export function storageKey(suffix: string): string {
  return `${branding.storageKeyPrefix}-${suffix}`;
}
