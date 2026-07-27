import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/product";
import { supabase } from "@/lib/api/client";
import { mapCategoryRow, toCategoryRow } from "@/lib/api/types";
import type { CategoryRow } from "@/lib/api/types";

/**
 * Phase 25 - Backend Integration. Same function names/shapes as
 * `lib/categoriesStore.ts`'s `resolveAllCategories()`/
 * `resolveCategoryById()`/`saveCategoryOverride()`/
 * `deleteCategoryOverride()`, prefixed `api` and backed by the
 * `categories` table. See `products.ts` for the fuller rationale - same
 * pattern, applied here.
 */

export async function apiGetCategories(client: SupabaseClient = supabase): Promise<Category[]> {
  const { data, error } = await client.from("categories").select("*").order("label", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CategoryRow[]).map(mapCategoryRow);
}

export async function apiGetCategoryById(id: string, client: SupabaseClient = supabase): Promise<Category | undefined> {
  const { data, error } = await client.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCategoryRow(data as CategoryRow) : undefined;
}

export async function apiSaveCategory(category: Category, client: SupabaseClient = supabase): Promise<Category> {
  const { data, error } = await client.from("categories").upsert(toCategoryRow(category)).select().single();
  if (error) throw new Error(error.message);
  return mapCategoryRow(data as CategoryRow);
}

export async function apiDeleteCategory(id: string, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
