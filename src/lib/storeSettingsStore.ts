import type { SupabaseClient } from "@supabase/supabase-js";
import { branding as BRANDING_DEFAULTS, storageKey } from "@/config/branding";
import type { BrandingConfig } from "@/config/branding";
import { business as BUSINESS_DEFAULTS } from "@/config/business";
import type { BusinessConfig, BusinessHours, SocialLinks } from "@/config/business";
import { apiGetSetting, apiSaveSetting } from "@/lib/api/settings";

/** Row key this store uses in the `site_settings` table (see `lib/api/settings.ts`). */
const REMOTE_KEY = "store";

/**
 * Phase 16 - Store Settings. The first admin editor, and the one that
 * establishes the override pattern every later editor (Theme, Homepage,
 * Products, ...) reuses: persist edits as a `localStorage` override
 * layered over the static config defaults (`config/branding.ts` /
 * `config/business.ts`), read through a resolver (`override ?? default`)
 * rather than replacing the default outright. This keeps a single,
 * consistent data-flow seam that Phase 25 (Backend Integration) can swap
 * for a real API one feature at a time - see `MASTER_HANDOFF.md`
 * "Developer Notes".
 *
 * Only the fields actually exposed by the Store Settings admin page
 * (business name/tagline/description from branding; contact info from
 * business; and, since Phase 24 added a Media Manager to attach images
 * to, logo/logoAlt/favicon) are overridable here. Everything else on
 * `BrandingConfig` (storageKeyPrefix, themeColor, ...) is out of this
 * phase's scope and always comes from the static default.
 */
export interface StoreSettingsOverride {
  businessName?: string;
  tagline?: string;
  businessDescription?: string;
  /** Data URL from `AssetPicker` (Phase 24), or a static default's imported asset path. */
  logo?: string;
  logoAlt?: string;
  /** Data URL from `AssetPicker` (Phase 24), or the static default's `/favicon.png`. */
  favicon?: string;
  legalName?: string;
  address?: string;
  email?: string;
  phone?: string;
  hours?: BusinessHours[];
  social?: SocialLinks;
  googleMapsUrl?: string;
  responseTime?: string;
}

const STORAGE_KEY = storageKey("store-settings");

/**
 * Dispatched on `window` whenever the override is saved or reset, so any
 * mounted component using `useStoreSettings()` re-renders immediately in
 * the same tab (the native `storage` event only fires in *other* tabs).
 */
export const STORE_SETTINGS_CHANGE_EVENT = "storesettingschange";

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getStoreSettingsOverride(): StoreSettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as StoreSettingsOverride;
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(STORE_SETTINGS_CHANGE_EVENT));
}

/** Merges `partial` over any existing override and persists the result. */
export function saveStoreSettingsOverride(partial: StoreSettingsOverride): void {
  if (typeof window === "undefined") return;
  const next: StoreSettingsOverride = { ...getStoreSettingsOverride(), ...partial };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
  void apiSaveSetting(REMOTE_KEY, next).catch((error) => {
    console.error("Failed to sync store settings to the server - saved locally on this device only for now.", error);
  });
}

/** Clears the entire override, reverting every field back to its static default. */
export function resetStoreSettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/**
 * Pulls the latest saved override from Supabase into the local cache -
 * see `themeSettingsStore.ts`'s `loadThemeSettingsOverride()` for the
 * full rationale. Called once at app boot (`lib/settingsSync.ts`).
 */
export async function loadStoreSettingsOverride(client?: SupabaseClient): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const remote = await apiGetSetting<StoreSettingsOverride>(REMOTE_KEY, client);
    if (remote === undefined) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    notifyChange();
  } catch (error) {
    console.error("Failed to load store settings from the server - showing this device's last-known settings instead.", error);
  }
}

/** Resolves the live branding config: saved override fields, falling back to the static default. */
export function resolveBranding(): BrandingConfig {
  const override = getStoreSettingsOverride();
  return {
    ...BRANDING_DEFAULTS,
    businessName: override.businessName ?? BRANDING_DEFAULTS.businessName,
    tagline: override.tagline ?? BRANDING_DEFAULTS.tagline,
    businessDescription: override.businessDescription ?? BRANDING_DEFAULTS.businessDescription,
    logo: override.logo ?? BRANDING_DEFAULTS.logo,
    logoAlt: override.logoAlt ?? BRANDING_DEFAULTS.logoAlt,
    favicon: override.favicon ?? BRANDING_DEFAULTS.favicon,
  };
}

/** Resolves the live business/contact config: saved override fields, falling back to the static default. */
export function resolveBusiness(): BusinessConfig {
  const override = getStoreSettingsOverride();
  return {
    ...BUSINESS_DEFAULTS,
    legalName: override.legalName ?? BUSINESS_DEFAULTS.legalName,
    address: override.address ?? BUSINESS_DEFAULTS.address,
    email: override.email ?? BUSINESS_DEFAULTS.email,
    phone: override.phone ?? BUSINESS_DEFAULTS.phone,
    hours: override.hours ?? BUSINESS_DEFAULTS.hours,
    social: override.social ?? BUSINESS_DEFAULTS.social,
    googleMapsUrl: override.googleMapsUrl ?? BUSINESS_DEFAULTS.googleMapsUrl,
    responseTime: override.responseTime ?? BUSINESS_DEFAULTS.responseTime,
  };
}
