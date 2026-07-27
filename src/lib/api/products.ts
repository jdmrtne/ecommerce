import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";
import { supabase } from "@/lib/api/client";
import { mapProductRow, toProductRow } from "@/lib/api/types";
import type { ProductRow } from "@/lib/api/types";

/**
 * Phase 25 - Backend Integration. Same function names/shapes as
 * `lib/productsStore.ts`'s `resolveAllProducts()`/`resolveProductById()`/
 * `saveProductOverride()`/`deleteProductOverride()`, prefixed `api` and
 * backed by the `products` table instead of `localStorage` - swapping a
 * future admin page from one to the other is a call-site rename, not a
 * rewrite. Not wired into any component yet (this phase is plumbing
 * only); `client` defaults to the app singleton but is overridable so
 * tests can inject a mock instead of hitting the network (see
 * `products.test.ts` / `src/test/mockSupabaseClient.ts`).
 */

export async function apiGetProducts(client: SupabaseClient = supabase): Promise<Product[]> {
  const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map(mapProductRow);
}

export async function apiGetProductById(id: string, client: SupabaseClient = supabase): Promise<Product | undefined> {
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProductRow(data as ProductRow) : undefined;
}

/** Insert-or-update by id (matches `saveProductOverride`'s upsert-by-id behavior). */
export async function apiSaveProduct(product: Product, client: SupabaseClient = supabase): Promise<Product> {
  const { data, error } = await client.from("products").upsert(toProductRow(product)).select().single();
  if (error) throw new Error(error.message);
  return mapProductRow(data as ProductRow);
}

export async function apiDeleteProduct(id: string, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
