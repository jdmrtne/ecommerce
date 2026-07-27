import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/api/client";

/**
 * Backend Integration - Settings sync. Thin client for the generic
 * `site_settings` key/value table (see `supabase/schema.sql`). Each
 * settings store (`lib/themeSettingsStore.ts`,
 * `lib/storeSettingsStore.ts`, `lib/homepageSettingsStore.ts`) uses this
 * to read/write its own `key` (`"theme"` / `"store"` / `"homepage"`),
 * with the override object as `value`, unmapped - unlike products/
 * orders/categories there's no fixed row shape to map to/from, since
 * `value` is just whatever that store's own `*SettingsOverride` type is.
 */

export async function apiGetSetting<T>(key: string, client: SupabaseClient = supabase): Promise<T | undefined> {
  const { data, error } = await client.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data.value as T) : undefined;
}

export async function apiSaveSetting<T>(key: string, value: T, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
